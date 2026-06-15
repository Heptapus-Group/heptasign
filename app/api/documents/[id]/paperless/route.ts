import { NextRequest } from "next/server";
import { UserRole } from "@prisma/client";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { canAccessDocument } from "@/lib/documents/access";
import { syncSignedDocumentToPaperless } from "@/lib/documents/signing";
import { readStoredFile } from "@/lib/files/storage";
import { requestMeta } from "@/lib/request";
import { redirectTo } from "@/lib/redirect";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await context.params;
  const document = await prisma.document.findUnique({ where: { id } });

  if (!document || !(await canAccessDocument(user, id))) {
    return redirectTo("/documents");
  }

  if (user.role !== UserRole.ADMIN && document.createdById !== user.id) {
    return redirectTo(`/documents/${id}`);
  }

  if (!document.signedFilePath) {
    return redirectTo(`/documents/${id}?error=no-signed-pdf`);
  }

  const signedPdf = await readStoredFile(document.signedFilePath);
  await syncSignedDocumentToPaperless({
    documentId: document.id,
    documentCode: document.documentCode,
    title: document.title,
    signedPdf,
    userId: user.id,
    ...requestMeta(request)
  });

  return redirectTo(`/documents/${id}`);
}
