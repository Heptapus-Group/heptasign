import { NextResponse } from "next/server";
import { getAppUrl } from "@/lib/env";

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

export function redirectTo(path: string) {
  return NextResponse.redirect(new URL(safeRedirectPath(path), getAppUrl()), 303);
}
