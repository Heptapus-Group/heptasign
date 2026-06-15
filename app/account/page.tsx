import { AppShell } from "@/components/shell";
import { Alert, Button, Card, CardHeader, Field, MetaItem, PageHeader, inputClass } from "@/components/ui";
import { LockIcon } from "@/components/icons";
import { requireUser } from "@/lib/auth/session";

const errorMessages: Record<string, string> = {
  weak: "New password must be at least 8 characters.",
  mismatch: "New password and confirmation do not match.",
  "invalid-current": "Your current password is incorrect.",
  same: "New password must be different from your current password.",
  throttled: "Too many attempts. Please wait a few minutes and try again."
};

export default async function AccountPage({
  searchParams
}: {
  searchParams: Promise<{ status?: string; error?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const errorText = params.error ? errorMessages[params.error] || "Could not update password." : null;

  return (
    <AppShell>
      <PageHeader title="Account" description="Your profile details and password." />
      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <Card className="h-fit overflow-hidden">
          <CardHeader title="Profile" description="Managed by an administrator." />
          <dl className="grid gap-5 p-5 sm:grid-cols-2">
            <MetaItem label="Name" value={user.name} />
            <MetaItem label="Email" value={user.email} />
            <MetaItem label="Title" value={user.title || "—"} />
            <MetaItem label="System role" value={user.role === "ADMIN" ? "Admin" : "User"} />
          </dl>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader title="Change password" description="Enter your current password, then choose a new one." />
          <form action="/api/account/password" method="post" className="space-y-4 p-5">
            {params.status === "changed" ? (
              <Alert tone="success">
                <LockIcon className="h-4 w-4 shrink-0" />
                Your password has been updated.
              </Alert>
            ) : null}
            {errorText ? <Alert>{errorText}</Alert> : null}
            <Field label="Current password">
              <input name="currentPassword" type="password" autoComplete="current-password" required className={inputClass} />
            </Field>
            <Field label="New password" hint="At least 8 characters.">
              <input name="newPassword" type="password" autoComplete="new-password" minLength={8} required className={inputClass} />
            </Field>
            <Field label="Confirm new password">
              <input name="confirmPassword" type="password" autoComplete="new-password" minLength={8} required className={inputClass} />
            </Field>
            <Button icon={<LockIcon className="h-[18px] w-[18px]" />}>Update password</Button>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}
