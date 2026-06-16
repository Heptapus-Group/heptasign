"use client";

export function ConfirmForm({
  action,
  message,
  children,
  className
}: {
  action: string;
  message: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <form
      action={action}
      method="post"
      className={className}
      onSubmit={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      {children}
    </form>
  );
}
