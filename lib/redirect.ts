import { NextResponse } from "next/server";

/**
 * Returns an app-relative path that is safe to redirect to, or "/dashboard"
 * if the input could escape the application origin.
 *
 * Rejects:
 *  - paths that do not start with "/"
 *  - protocol-relative paths ("//evil.com", "/\evil.com") which resolve to
 *    a foreign origin when passed to the URL constructor
 *  - backslashes, which some browsers normalise to "/"
 */
export function safeRedirectPath(path: string | null | undefined) {
  if (!path) return "/dashboard";
  if (!path.startsWith("/")) return "/dashboard";
  if (path.startsWith("//") || path.startsWith("/\\")) return "/dashboard";
  if (path.includes("\\")) return "/dashboard";
  return path;
}

/**
 * Redirects to an app-relative path using a relative `Location` header. The
 * browser resolves it against the current request origin, so the redirect:
 *  - always stays same-origin (never trips CSP `form-action 'self'`)
 *  - does not depend on APP_URL, so a misconfigured APP_URL cannot bounce the
 *    user to the wrong host after a form POST.
 *
 * APP_URL is still used for absolute links embedded in artifacts (e.g. the QR
 * verification URL stamped into signed PDFs) — that must be configured to the
 * real public origin.
 */
export function redirectTo(path: string) {
  return new NextResponse(null, {
    status: 303,
    headers: { Location: safeRedirectPath(path) }
  });
}
