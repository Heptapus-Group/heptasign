import Image from "next/image";
import { Alert, Button, Card, Field, inputClass } from "@/components/ui";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10">
      <div className="w-full max-w-[440px]">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-line bg-white shadow-lg shadow-slate-900/10">
            <Image src="/logo.png" alt="Heptapus" width={64} height={64} className="h-16 w-16 object-contain" priority />
          </div>
          <h1 className="text-3xl font-semibold tracking-normal text-ink">HeptaSign</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">
            Internal approval, signing, and document verification for Heptapus Group.
          </p>
        </div>
        <Card className="overflow-hidden">
          <div className="border-b border-line/80 bg-slate-50/70 px-7 py-5 text-center">
            <h2 className="text-base font-semibold text-ink">Sign in to your workspace</h2>
            <p className="mt-1 text-sm text-muted">Use your internal account credentials.</p>
          </div>
          <form action="/api/auth/login" method="post" className="space-y-4 p-7">
            <input type="hidden" name="next" value={params.next || "/dashboard"} />
            {params.error ? <Alert>Invalid email or password.</Alert> : null}
            <Field label="Email">
              <input name="email" type="email" required className={inputClass} autoComplete="email" />
            </Field>
            <Field label="Password">
              <input name="password" type="password" required className={inputClass} autoComplete="current-password" />
            </Field>
            <Button className="w-full">Login</Button>
          </form>
        </Card>
      </div>
    </main>
  );
}
