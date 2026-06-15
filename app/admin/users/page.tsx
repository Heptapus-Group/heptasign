import { AppShell } from "@/components/shell";
import { Alert, Button, Card, CardHeader, Field, PageHeader, inputClass } from "@/components/ui";
import { LockIcon } from "@/components/icons";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const createErrors = new Set(["missing", "duplicate"]);
const resetErrorMessages: Record<string, string> = {
  "weak-password": "New password must be at least 8 characters.",
  "user-not-found": "That user no longer exists."
};

export default async function UsersPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; status?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });

  const createError = params.error && createErrors.has(params.error);
  const resetError = params.error ? resetErrorMessages[params.error] : null;

  return (
    <AppShell>
      <PageHeader title="Users" description="Create internal accounts, assign titles, and reset passwords." />

      {params.status === "password-reset" ? (
        <div className="mb-5">
          <Alert tone="success">
            <LockIcon className="h-4 w-4 shrink-0" />
            Password reset. Share the new password with the user securely.
          </Alert>
        </div>
      ) : null}
      {resetError ? (
        <div className="mb-5">
          <Alert>{resetError}</Alert>
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
        <Card className="h-fit overflow-hidden">
          <CardHeader title="Create user" description="System role controls access; title appears on signed documents." />
          <form action="/api/admin/users" method="post" className="space-y-4 p-5">
            {createError ? <Alert>Could not create user. Check required fields and duplicate email.</Alert> : null}
            <Field label="Name">
              <input name="name" required className={inputClass} />
            </Field>
            <Field label="Email">
              <input name="email" type="email" required className={inputClass} />
            </Field>
            <Field label="Title" hint="Shown on signed documents, e.g. CEO, CFO, COO.">
              <input name="title" placeholder="CEO, CFO, COO" className={inputClass} />
            </Field>
            <Field label="Password" hint="At least 8 characters.">
              <input name="password" type="password" minLength={8} required className={inputClass} />
            </Field>
            <Field label="System role">
              <select name="role" className={inputClass}>
                <option value="USER">User</option>
                <option value="ADMIN">Admin</option>
              </select>
            </Field>
            <Button>Create user</Button>
          </form>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader
            title="Current users"
            description={`${users.length} internal account${users.length === 1 ? "" : "s"}`}
          />
          {users.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-muted">No users yet.</div>
          ) : (
            <div className="overflow-x-auto scroll-area">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-[11px] uppercase tracking-wider text-faint">
                    <th className="px-5 py-3 font-semibold">User</th>
                    <th className="px-5 py-3 font-semibold">Title</th>
                    <th className="px-5 py-3 font-semibold">Role</th>
                    <th className="px-5 py-3 font-semibold">Reset password</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {users.map((user) => (
                    <tr key={user.id} className="align-middle transition hover:bg-canvas">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-brand">
                            {initials(user.name)}
                          </span>
                          <div className="min-w-0">
                            <div className="font-medium text-ink">{user.name}</div>
                            <div className="truncate text-xs text-muted">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <form action={`/api/admin/users/${user.id}/title`} method="post" className="flex gap-2">
                          <input
                            name="title"
                            defaultValue={user.title || ""}
                            placeholder="CEO, CFO"
                            className={`${inputClass} min-w-32 py-1.5`}
                          />
                          <button className="rounded-lg border border-line bg-panel px-3 text-xs font-semibold text-ink shadow-sm transition hover:bg-canvas">
                            Save
                          </button>
                        </form>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold ${
                            user.role === "ADMIN" ? "bg-brand-soft text-brand-dark" : "bg-canvas text-muted"
                          }`}
                        >
                          {user.role === "ADMIN" ? "Admin" : "User"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <form action={`/api/admin/users/${user.id}/password`} method="post" className="flex gap-2">
                          <input
                            name="password"
                            type="password"
                            minLength={8}
                            required
                            placeholder="New password"
                            autoComplete="new-password"
                            className={`${inputClass} min-w-40 py-1.5`}
                          />
                          <button className="rounded-lg border border-line bg-panel px-3 text-xs font-semibold text-ink shadow-sm transition hover:bg-canvas">
                            Reset
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
