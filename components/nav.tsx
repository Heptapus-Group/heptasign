"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DashboardIcon,
  DocumentsIcon,
  VerifyIcon,
  UsersIcon,
  LogoutIcon,
  HeptaMark
} from "@/components/icons";

type NavUser = {
  name: string;
  title: string | null;
  role: string;
} | null;

type NavItem = {
  href: string;
  label: string;
  Icon: (props: React.SVGProps<SVGSVGElement>) => React.ReactElement;
  adminOnly?: boolean;
};

const items: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", Icon: DashboardIcon },
  { href: "/documents", label: "Documents", Icon: DocumentsIcon },
  { href: "/verify", label: "Verify", Icon: VerifyIcon },
  { href: "/admin/users", label: "Users", Icon: UsersIcon, adminOnly: true }
];

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function NavLinks({ user, onNavigate }: { user: NavUser; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {items
        .filter((item) => !item.adminOnly || user?.role === "ADMIN")
        .map(({ href, label, Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-sidebar-active text-sidebar-textActive"
                  : "text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-textActive"
              }`}
            >
              <Icon
                className={`h-[18px] w-[18px] shrink-0 transition ${
                  active ? "text-brand" : "text-sidebar-text group-hover:text-sidebar-textActive"
                }`}
              />
              {label}
            </Link>
          );
        })}
    </nav>
  );
}

function Brand() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2.5 px-5 py-5 text-white">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-white">
        <HeptaMark className="h-5 w-5" />
      </span>
      <span className="leading-tight">
        <span className="block text-[15px] font-semibold tracking-tight">HeptaSign</span>
        <span className="block text-[11px] font-medium text-sidebar-text">Approval console</span>
      </span>
    </Link>
  );
}

function UserCard({ user }: { user: NonNullable<NavUser> }) {
  return (
    <div className="mt-auto border-t border-white/10 p-3">
      <div className="flex items-center gap-3 rounded-lg px-2 py-2">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sidebar-active text-xs font-semibold text-white">
          {initials(user.name)}
        </span>
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block truncate text-sm font-medium text-white">{user.name}</span>
          <span className="block truncate text-xs text-sidebar-text">{user.title || user.role}</span>
        </span>
        <form action="/api/auth/logout" method="post">
          <button
            type="submit"
            title="Log out"
            aria-label="Log out"
            className="flex h-8 w-8 items-center justify-center rounded-md text-sidebar-text transition hover:bg-sidebar-hover hover:text-white"
          >
            <LogoutIcon className="h-[18px] w-[18px]" />
          </button>
        </form>
      </div>
    </div>
  );
}

export function SideNav({ user }: { user: NavUser }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-sidebar lg:flex">
        <Brand />
        <NavLinks user={user} />
        {user ? <UserCard user={user} /> : null}
      </aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-sidebar px-4 py-3 lg:hidden">
        <Brand />
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="flex h-9 w-9 items-center justify-center rounded-md text-sidebar-text hover:bg-sidebar-hover hover:text-white"
        >
          <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
      </div>

      {/* Mobile drawer */}
      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-sidebar">
            <div className="flex items-center justify-between">
              <Brand />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="mr-3 flex h-9 w-9 items-center justify-center rounded-md text-sidebar-text hover:bg-sidebar-hover hover:text-white"
              >
                <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </div>
            <NavLinks user={user} onNavigate={() => setOpen(false)} />
            {user ? <UserCard user={user} /> : null}
          </aside>
        </div>
      ) : null}
    </>
  );
}
