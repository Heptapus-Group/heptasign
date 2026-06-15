import { DocumentStatus, UserRole } from "@prisma/client";
import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { canAccessDocument } from "@/lib/documents/access";
import { writeAuditLog } from "@/lib/audit/audit";
import { requestMeta } from "@/lib/request";
import { redirectTo } from "@/lib/redirect";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await context.params;

  const document = await prisma.document.findUnique({
    where: { id },
    select: { id: true, status: true, createdById: true, documentCode: true }
  });

  if (!document || !(await canAccessDocument(user, id))) {
    return redirectTo("/documents");
  }

  // Only an admin or the document creator may revoke.
  if (user.role !== UserRole.ADMIN && document.createdById !== user.id) {
    return redirectTo(`/documents/${id}?error=forbidden`);
  }

  // Only a signed document can be revoked.
  if (document.status !== DocumentStatus.SIGNED) {
    return redirectTo(`/documents/${id}?error=not-revocable`);
  }

  await prisma.document.update({
    where: { id },
    data: { status: DocumentStatus.REVOKED }
  });

  await writeAuditLog({
    userId: user.id,
    action: "document.revoked",
    entityType: "Document",
    entityId: id,
    metadata: { documentCode: document.documentCode },
    ...requestMeta(request)
  });

  return redirectTo(`/documents/${id}`);
}
