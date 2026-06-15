import Link from "next/link";

export function PageHeader({
  title,
  description,
  actions
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-[1.65rem] font-semibold leading-tight tracking-normal text-ink">{title}</h1>
        {description ? <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function PageTitle(props: { title: string; description?: string }) {
  return <PageHeader {...props} />;
}

const buttonBase =
  "inline-flex min-h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-semibold transition duration-150 focus:outline-none focus:ring-2 focus:ring-brand/25 disabled:pointer-events-none disabled:opacity-60";

const buttonVariants = {
  primary: "bg-brand text-white shadow-sm shadow-teal-900/10 hover:bg-brandDark",
  secondary: "border border-line bg-white text-ink shadow-sm hover:border-slate-300 hover:bg-slate-50",
  danger: "border border-rose-200 bg-white text-rose-700 shadow-sm hover:bg-rose-50",
  dark: "bg-ink text-white shadow-sm shadow-slate-900/10 hover:bg-slate-800"
};

export function Button({
  children,
  variant = "primary",
  type = "submit",
  className = ""
}: {
  children: React.ReactNode;
  variant?: keyof typeof buttonVariants;
  type?: "button" | "submit" | "reset";
  className?: string;
}) {
  return <button type={type} className={`${buttonBase} ${buttonVariants[variant]} ${className}`}>{children}</button>;
}

export function ButtonLink({
  href,
  children,
  variant = "primary",
  className = ""
}: {
  href: string;
  children: React.ReactNode;
  variant?: keyof typeof buttonVariants;
  className?: string;
}) {
  return (
    <Link href={href} className={`${buttonBase} ${buttonVariants[variant]} ${className}`}>
      {children}
    </Link>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-ink">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "w-full rounded-md border border-line bg-white px-3.5 py-2.5 text-sm text-ink shadow-sm outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/15";

export function Card({
  children,
  className = ""
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <section className={`rounded-lg border border-line/80 bg-panel shadow-sm shadow-slate-900/5 ${className}`}>{children}</section>;
}

export function CardHeader({
  title,
  description,
  actions
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line/80 bg-slate-50/60 px-5 py-4">
      <div>
        <h2 className="font-semibold leading-6 text-ink">{title}</h2>
        {description ? <p className="mt-1 text-sm leading-5 text-muted">{description}</p> : null}
      </div>
      {actions}
    </div>
  );
}

export function Alert({
  children,
  tone = "error"
}: {
  children: React.ReactNode;
  tone?: "error" | "warning" | "info" | "success";
}) {
  const tones = {
    error: "border-rose-200 bg-rose-50 text-rose-800",
    warning: "border-amber-200 bg-amber-50 text-amber-800",
    info: "border-sky-200 bg-sky-50 text-sky-800",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800"
  };

  return <div className={`rounded-md border px-3.5 py-2.5 text-sm ${tones[tone]}`}>{children}</div>;
}

export function EmptyState({
  title,
  description,
  action
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="px-5 py-12 text-center">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white text-sm font-semibold text-muted shadow-sm">
        HS
      </div>
      <h3 className="font-medium text-ink">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function MetaItem({
  label,
  value,
  wide
}: {
  label: string;
  value: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-1 break-all text-sm font-medium text-ink">{value}</dd>
    </div>
  );
}
