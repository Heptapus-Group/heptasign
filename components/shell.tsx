import Link from "next/link";
import Image from "next/image";
import { getCurrentUser } from "@/lib/auth/session";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-transparent">
      <header className="sticky top-0 z-20 border-b border-line/80 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-3.5">
          <Link href="/dashboard" className="flex items-center gap-3 text-ink">
            <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-lg border border-line bg-white shadow-sm">
              <Image src="/logo.png" alt="Heptapus" width={36} height={36} className="h-9 w-9 object-contain" />
            </span>
            <span>
              <span className="block text-base font-semibold leading-5">HeptaSign</span>
              <span className="block text-xs font-medium text-muted">Approval Console</span>
            </span>
          </Link>
          <nav className="flex flex-wrap items-center gap-1.5 text-sm font-medium text-muted">
            <Link href="/dashboard" className="rounded-md px-3 py-2 hover:bg-soft hover:text-ink">Dashboard</Link>
            <Link href="/documents" className="rounded-md px-3 py-2 hover:bg-soft hover:text-ink">Documents</Link>
            <Link href="/verify" className="rounded-md px-3 py-2 hover:bg-soft hover:text-ink">Verify</Link>
            {user?.role === "ADMIN" ? <Link href="/admin/users" className="rounded-md px-3 py-2 hover:bg-soft hover:text-ink">Users</Link> : null}
            {user ? (
              <div className="ml-2 flex items-center gap-3 border-l border-line pl-3">
                <div className="hidden text-right sm:block">
                  <div className="text-xs font-medium text-ink">{user.name}</div>
                  <div className="text-xs text-muted">{user.title || user.role}</div>
                </div>
                <form action="/api/auth/logout" method="post">
                  <button className="rounded-md border border-line bg-white px-3 py-2 text-ink shadow-sm hover:bg-slate-50">Logout</button>
                </form>
              </div>
            ) : null}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-5 py-8">{children}</main>
    </div>
  );
}
