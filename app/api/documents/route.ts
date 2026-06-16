import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/session";
import { saveOriginalPdf, validatePdfUpload } from "@/lib/files/storage";
import { writeAuditLog } from "@/lib/audit/audit";
import { requestMeta } from "@/lib/request";
import { redirectTo } from "@/lib/redirect";

export async function POST(request: NextRequest) {
  const user = await requireUser();
  const form = await request.formData();
  const documentCode = String(form.get("documentCode") || "").trim();
  const title = String(form.get("title") || "").trim();
  const description = String(form.get("description") || "").trim() || null;
  const assignedUserIds = form.getAll("assignedUserIds").map((value) => String(value)).filter(Boolean);
  const sequentialSigning = String(form.get("sequentialSigning") || "") === "true";
  const file = form.get("file");

  // Signing order: use the per-user "order_<id>" field when provided, otherwise
  // fall back to the order the users appear in the form.
  const orderFor = (userId: string, fallback: number) => {
    const raw = Number(form.get(`order_${userId}`));
    return Number.isFinite(raw) && raw > 0 ? raw : fallback + 1;
  };

  if (!documentCode || !title || !(file instanceof File)) {
    return redirectTo("/documents/new?error=missing");
  }

  try {
    const buffer = await validatePdfUpload(file);
    const document = await prisma.document.create({
      data: {
        documentCode,
        title,
        description,
        sequentialSigning,
        originalFilePath: "pending",
        createdById: user.id,
        assignments: {
          create: assignedUserIds.map((assignedUserId, index) => ({
            userId: assignedUserId,
            assignedById: user.id,
            order: orderFor(assignedUserId, index)
          }))
        }
      }
    });

    const saved = await saveOriginalPdf(document.id, buffer);
    await prisma.document.update({
      where: { id: document.id },
      data: {
        originalFilePath: saved.relativePath,
        originalFileHash: saved.hash,
        files: {
          create: {
            kind: "ORIGINAL",
            filePath: saved.relativePath,
            fileHash: saved.hash
          }
        }
      }
    });

    await writeAuditLog({
      userId: user.id,
      action: "document.created",
      entityType: "Document",
      entityId: document.id,
      metadata: { documentCode, title, assignedUserIds },
      ...requestMeta(request)
    });

    return redirectTo(`/documents/${document.id}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    if (message.includes("Unique constraint")) {
      return redirectTo("/documents/new?error=duplicate");
    }
    return redirectTo(`/documents/new?error=${encodeURIComponent(message)}`);
  }
}
