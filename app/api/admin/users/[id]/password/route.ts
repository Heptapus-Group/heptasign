import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";
import { writeAuditLog } from "@/lib/audit/audit";
import { requestMeta } from "@/lib/request";
import { redirectTo } from "@/lib/redirect";

const MIN_PASSWORD_LENGTH = 8;

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const { id } = await context.params;
  const form = await request.formData();
  const newPassword = String(form.get("password") || "");

  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return redirectTo("/admin/users?error=weak-password");
  }

  const target = await prisma.user.findUnique({ where: { id }, select: { id: true, email: true } });
  if (!target) {
    return redirectTo("/admin/users?error=user-not-found");
  }

  await prisma.user.update({
    where: { id: target.id },
    data: { passwordHash: await hashPassword(newPassword) }
  });

  await writeAuditLog({
    userId: admin.id,
    action: "user.password_reset",
    entityType: "User",
    entityId: target.id,
    metadata: { email: target.email },
    ...requestMeta(request)
  });

  return redirectTo("/admin/users?status=password-reset");
}
