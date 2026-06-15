const styles: Record<string, { wrap: string; dot: string; label: string }> = {
  DRAFT: { wrap: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500", label: "Draft" },
  PENDING: { wrap: "bg-sky-50 text-sky-700 border-sky-200", dot: "bg-sky-500", label: "Pending" },
  SIGNED: { wrap: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500", label: "Signed" },
  REVOKED: { wrap: "bg-rose-50 text-rose-700 border-rose-200", dot: "bg-rose-500", label: "Revoked" },
  SUPERSEDED: { wrap: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400", label: "Superseded" }
};

export function StatusBadge({ status }: { status: string }) {
  const style = styles[status] || styles.DRAFT;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${style.wrap}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  );
}
