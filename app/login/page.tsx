import { Alert, Field, inputClass } from "@/components/ui";
import { HeptaMark, LockIcon, ShieldIcon, CheckIcon } from "@/components/icons";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between bg-sidebar p-12 text-white lg:flex">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand">
            <HeptaMark className="h-6 w-6" />
          </span>
          <span className="text-lg font-semibold tracking-tight">HeptaSign</span>
        </div>
        <div className="max-w-md">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight">
            Internal document approvals, signed and verifiable.
          </h2>
          <ul className="mt-8 space-y-4 text-sm text-sidebar-text">
            {[
              "Upload originals untouched, sign a stamped copy",
              "QR + barcode verification by code or token",
              "Full audit trail for every approval"
            ].map((line) => (
              <li key={line} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand/20 text-brand">
                  <CheckIcon className="h-3.5 w-3.5" />
                </span>
                {line}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-sidebar-text">Heptapus Group · Internal use only</p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-canvas px-5 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand text-white">
              <HeptaMark className="h-6 w-6" />
            </span>
          </div>
          <div className="mb-7">
            <h1 className="text-2xl font-semibold tracking-tight text-ink">Sign in</h1>
            <p className="mt-1.5 text-sm text-muted">Use your Heptapus internal account.</p>
          </div>
          <form action="/api/auth/login" method="post" className="space-y-4">
            <input type="hidden" name="next" value={params.next || "/dashboard"} />
            {params.error === "throttled" ? (
              <Alert tone="warning">
                <LockIcon className="h-4 w-4 shrink-0" />
                Too many attempts. Please wait a few minutes and try again.
              </Alert>
            ) : params.error ? (
              <Alert>
                <ShieldIcon className="h-4 w-4 shrink-0" />
                Invalid email or password.
              </Alert>
            ) : null}
            <Field label="Email">
              <input name="email" type="email" autoComplete="username" required className={inputClass} />
            </Field>
            <Field label="Password">
              <input name="password" type="password" autoComplete="current-password" required className={inputClass} />
            </Field>
            <div className="pt-1">
              <button
                type="submit"
                className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-brand text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark focus-visible:ring-4 focus-visible:ring-brand-ring"
              >
                Sign in
              </button>
            </div>
          </form>
          <p className="mt-8 text-center text-xs text-faint">
            This is an internal approval tool, not a legally qualified e-signature system.
          </p>
        </div>
      </div>
    </main>
  );
}
