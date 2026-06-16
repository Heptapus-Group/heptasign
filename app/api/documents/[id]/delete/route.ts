import { DocumentStatus, UserRole } from "@prisma/client";
import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { deleteStoredFile } from "@/lib/files/storage";
import { writeAuditLog } from "@/lib/audit/audit";
import { requestMeta } from "@/lib/request";
import { redirectTo } from "@/lib/redirect";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await context.params;

  const document = await prisma.document.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      createdById: true,
      documentCode: true,
      title: true,
      originalFilePath: true,
      signedFilePath: true
    }
  });

  if (!document) {
    return redirectTo("/documents");
  }

  // Admins may delete any document. Creators may delete their own only while it
  // is still a draft (a signed document has public verification records).
  const isAdmin = user.role === UserRole.ADMIN;
  const isOwnerDraft = document.createdById === user.id && document.status === DocumentStatus.DRAFT;
  if (!isAdmin && !isOwnerDraft) {
    return redirectTo(`/documents/${id}?error=delete-forbidden`);
  }

  // Remove the stored PDFs first; the DB cascade clears assignments, files,
  // and signature records when the document row is deleted.
  await deleteStoredFile(document.originalFilePath);
  await deleteStoredFile(document.signedFilePath);
  await prisma.document.delete({ where: { id } });

  await writeAuditLog({
    userId: user.id,
    action: "document.deleted",
    entityType: "Document",
    entityId: document.id,
    metadata: { documentCode: document.documentCode, title: document.title, status: document.status },
    ...requestMeta(request)
  });

  return redirectTo("/documents?deleted=1");
}
