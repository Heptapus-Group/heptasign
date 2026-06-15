import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { setSessionCookie, signSession } from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth/password";
import { writeAuditLog } from "@/lib/audit/audit";
import { requestMeta } from "@/lib/request";
import { redirectTo, safeRedirectPath } from "@/lib/redirect";
import { maybeCleanup, rateLimit } from "@/lib/auth/rate-limit";

// A valid bcrypt hash of an impossible-to-match value, used to keep response
// timing constant whether or not the email maps to a real account.
const DUMMY_HASH = "$2b$12$M1rk2P85HqeZf9Z3PVxKd.FdcoXg68Vr.FcQEt5CiC2iKhl78ZRuu";

const LOGIN_LIMIT = 10;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const email = String(form.get("email") || "").trim().toLowerCase();
  const password = String(form.get("password") || "");
  const next = safeRedirectPath(String(form.get("next") || "/dashboard"));
  const meta = requestMeta(request);

  maybeCleanup();
  const limiterKey = `login:${meta.ipAddress || "unknown"}:${email}`;
  const limit = rateLimit(limiterKey, LOGIN_LIMIT, LOGIN_WINDOW_MS);
  if (!limit.allowed) {
    return redirectTo("/login?error=throttled");
  }

  const user = await prisma.user.findUnique({ where: { email } });
  // Always run a bcrypt comparison so timing does not reveal whether the
  // account exists.
  const passwordOk = await verifyPassword(password, user?.passwordHash || DUMMY_HASH);

  if (!user || !passwordOk) {
    return redirectTo("/login?error=invalid");
  }

  const token = signSession({ userId: user.id, email: user.email, role: user.role });
  await setSessionCookie(token);
  await writeAuditLog({
    userId: user.id,
    action: "user.login",
    entityType: "User",
    entityId: user.id,
    metadata: { email: user.email },
    ...meta
  });

  return redirectTo(next);
}
