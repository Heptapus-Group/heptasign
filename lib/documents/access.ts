import { Prisma, UserRole } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

type CurrentUser = {
  id: string;
  role: UserRole;
};

export function visibleDocumentWhere(user: CurrentUser): Prisma.DocumentWhereInput {
  if (user.role === UserRole.ADMIN) return {};

  return {
    OR: [
      { createdById: user.id },
      { assignments: { some: { userId: user.id } } }
    ]
  };
}

export async function canAccessDocument(user: CurrentUser, documentId: string) {
  if (user.role === UserRole.ADMIN) return true;

  const count = await prisma.document.count({
    where: {
      id: documentId,
      OR: [
        { createdById: user.id },
        { assignments: { some: { userId: user.id } } }
      ]
    }
  });

  return count > 0;
}

export async function canSignDocument(user: CurrentUser, documentId: string) {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    select: {
      status: true,
      createdById: true,
      sequentialSigning: true,
      assignments: {
        select: { userId: true, status: true, order: true, createdAt: true },
        orderBy: [{ order: "asc" }, { createdAt: "asc" }]
      }
    }
  });

  if (!document) return false;
  // Once a document is finalized (SIGNED) or revoked, nobody can sign.
  if (document.status !== "DRAFT") return false;

  const assignments = document.assignments;

  // Unassigned document: only the creator (or an admin) self-signs.
  if (assignments.length === 0) {
    return document.createdById === user.id || user.role === UserRole.ADMIN;
  }

  // Assigned document: the signer must be an assignee whose turn it is. Admins
  // are not exempt here, so they cannot inject a phantom signature out of band.
  const myIndex = assignments.findIndex((assignment) => assignment.userId === user.id);
  if (myIndex === -1) return false;
  if (assignments[myIndex].status !== "PENDING") return false;
  if (document.sequentialSigning && assignments.slice(0, myIndex).some((a) => a.status !== "SIGNED")) {
    return false;
  }
  return true;
}
