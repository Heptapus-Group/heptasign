import Link from "next/link";
import { HeptaMark } from "@/components/icons";

export function PublicHeader() {
  return (
    <header className="border-b border-line bg-panel">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4">
        <Link href="/" className="flex items-center gap-2.5 text-ink">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-white">
            <HeptaMark className="h-5 w-5" />
          </span>
          <span className="leading-tight">
            <span className="block text-[15px] font-semibold tracking-tight">HeptaSign</span>
            <span className="block text-[11px] text-muted">Document verification</span>
          </span>
        </Link>
        <Link
          href="/login"
          className="rounded-lg border border-line bg-panel px-3.5 py-2 text-sm font-semibold text-ink shadow-sm transition hover:bg-canvas"
        >
          Staff sign in
        </Link>
      </div>
    </header>
  );
}
