import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { writeAuditLog } from "@/lib/audit/audit";
import { requestMeta } from "@/lib/request";
import { redirectTo } from "@/lib/redirect";
import { maybeCleanup, rateLimit } from "@/lib/auth/rate-limit";

const MIN_PASSWORD_LENGTH = 8;
const CHANGE_LIMIT = 5;
const CHANGE_WINDOW_MS = 15 * 60 * 1000;

export async function POST(request: NextRequest) {
  const sessionUser = await requireUser();
  const form = await request.formData();
  const currentPassword = String(form.get("currentPassword") || "");
  const newPassword = String(form.get("newPassword") || "");
  const confirmPassword = String(form.get("confirmPassword") || "");

  maybeCleanup();
  const limit = rateLimit(`pwchange:${sessionUser.id}`, CHANGE_LIMIT, CHANGE_WINDOW_MS);
  if (!limit.allowed) {
    return redirectTo("/account?error=throttled");
  }

  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return redirectTo("/account?error=weak");
  }
  if (newPassword !== confirmPassword) {
    return redirectTo("/account?error=mismatch");
  }

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { id: true, email: true, passwordHash: true }
  });
  if (!user) {
    return redirectTo("/login");
  }

  if (!(await verifyPassword(currentPassword, user.passwordHash))) {
    return redirectTo("/account?error=invalid-current");
  }

  if (await verifyPassword(newPassword, user.passwordHash)) {
    return redirectTo("/account?error=same");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(newPassword) }
  });

  await writeAuditLog({
    userId: user.id,
    action: "user.password_changed",
    entityType: "User",
    entityId: user.id,
    metadata: { email: user.email },
    ...requestMeta(request)
  });

  return redirectTo("/account?status=changed");
}
