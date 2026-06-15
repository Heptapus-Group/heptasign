const colors: Record<string, string> = {
  DRAFT: "bg-amber-50 text-amber-800 border-amber-200 ring-amber-100",
  SIGNED: "bg-emerald-50 text-emerald-800 border-emerald-200 ring-emerald-100",
  REVOKED: "bg-rose-50 text-rose-800 border-rose-200 ring-rose-100",
  SUPERSEDED: "bg-slate-100 text-slate-700 border-slate-200 ring-slate-100"
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ring-4 ${colors[status] || colors.DRAFT}`}>
      {status}
    </span>
  );
}
