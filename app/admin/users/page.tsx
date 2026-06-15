import { AppShell } from "@/components/shell";
import { Alert, Button, Card, CardHeader, Field, PageHeader, inputClass } from "@/components/ui";
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

export default async function UsersPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <AppShell>
      <PageHeader title="Users" description="Create internal accounts and assign business titles used on signature records." />
      <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
        <Card className="h-fit overflow-hidden">
          <CardHeader title="Create user" description="System role controls access; title appears on signed documents." />
          <form action="/api/admin/users" method="post" className="space-y-4 p-5">
            {params.error ? <Alert>Could not create user. Check required fields and duplicate email.</Alert> : null}
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
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-[11px] uppercase tracking-wider text-faint">
                    <th className="px-5 py-3 font-semibold">User</th>
                    <th className="px-5 py-3 font-semibold">Title</th>
                    <th className="px-5 py-3 font-semibold">Role</th>
                    <th className="px-5 py-3 font-semibold">Created</th>
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
                            className={`${inputClass} min-w-36 py-1.5`}
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
                      <td className="px-5 py-3.5 text-muted tnum">{user.createdAt.toLocaleDateString()}</td>
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
