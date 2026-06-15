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
      <div className="min-w-0">
        <h1 className="text-[26px] font-semibold leading-tight tracking-tight text-ink">{title}</h1>
        {description ? <p className="mt-1.5 max-w-3xl text-sm leading-6 text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2.5">{actions}</div> : null}
    </div>
  );
}

export function PageTitle(props: { title: string; description?: string }) {
  return <PageHeader {...props} />;
}

const buttonBase =
  "inline-flex min-h-[40px] items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition focus-visible:ring-4 focus-visible:ring-brand-ring disabled:pointer-events-none disabled:opacity-60";

const buttonVariants = {
  primary: "bg-brand text-white shadow-sm hover:bg-brand-dark",
  secondary: "border border-line bg-panel text-ink shadow-sm hover:bg-canvas",
  ghost: "text-muted hover:bg-canvas hover:text-ink",
  danger: "border border-rose-200 bg-panel text-rose-600 shadow-sm hover:bg-rose-50",
  dark: "bg-ink text-white shadow-sm hover:bg-ink/90"
};

export function Button({
  children,
  variant = "primary",
  type = "submit",
  icon,
  className = ""
}: {
  children: React.ReactNode;
  variant?: keyof typeof buttonVariants;
  type?: "button" | "submit" | "reset";
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <button type={type} className={`${buttonBase} ${buttonVariants[variant]} ${className}`}>
      {icon}
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  children,
  variant = "primary",
  icon,
  newTab,
  className = ""
}: {
  href: string;
  children: React.ReactNode;
  variant?: keyof typeof buttonVariants;
  icon?: React.ReactNode;
  newTab?: boolean;
  className?: string;
}) {
  const external = newTab ? { target: "_blank", rel: "noopener noreferrer" } : {};
  return (
    <Link href={href} className={`${buttonBase} ${buttonVariants[variant]} ${className}`} {...external}>
      {icon}
      {children}
    </Link>
  );
}

export function Field({
  label,
  children,
  hint
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-semibold text-ink">{label}</span>
      {children}
      {hint ? <span className="mt-1.5 block text-xs text-faint">{hint}</span> : null}
    </label>
  );
}

export const inputClass =
  "w-full rounded-lg border border-line bg-panel px-3.5 py-2.5 text-sm text-ink shadow-sm outline-none transition placeholder:text-faint focus:border-brand focus:ring-4 focus:ring-brand-ring";

export function Card({
  children,
  className = ""
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-xl border border-line bg-panel shadow-card ${className}`}>{children}</section>
  );
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
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
      <div className="min-w-0">
        <h2 className="text-[15px] font-semibold tracking-tight text-ink">{title}</h2>
        {description ? <p className="mt-1 text-sm leading-6 text-muted">{description}</p> : null}
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

  return <div className={`flex items-start gap-2 rounded-lg border px-3.5 py-2.5 text-sm ${tones[tone]}`}>{children}</div>;
}

export function EmptyState({
  title,
  description,
  action,
  icon
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="px-6 py-14 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-line bg-canvas text-muted">
        {icon}
      </div>
      <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
      <p className="mx-auto mt-1.5 max-w-md text-sm leading-6 text-muted">{description}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function MetaItem({
  label,
  value,
  wide,
  mono
}: {
  label: string;
  value: React.ReactNode;
  wide?: boolean;
  mono?: boolean;
}) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-faint">{label}</dt>
      <dd className={`mt-1.5 text-sm font-medium text-ink ${mono ? "break-all font-mono text-[13px] text-muted" : ""}`}>
        {value}
      </dd>
    </div>
  );
}
