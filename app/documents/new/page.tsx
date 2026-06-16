import { AppShell } from "@/components/shell";
import { Alert, Button, ButtonLink, Card, CardHeader, Field, PageHeader, inputClass } from "@/components/ui";
import { UsersIcon } from "@/components/icons";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

const errorMessages: Record<string, string> = {
  missing: "Document code, title, and a PDF file are required.",
  duplicate: "A document with this code already exists. Use a unique code."
};

export default async function NewDocumentPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const users = await prisma.user.findMany({
    where: { id: { not: user.id } },
    orderBy: [{ name: "asc" }],
    select: { id: true, name: true, email: true, title: true }
  });

  const errorText = params.error
    ? errorMessages[params.error] || decodeURIComponent(params.error)
    : null;

  return (
    <AppShell>
      <PageHeader
        title="New document"
        description="Upload the original PDF and enter the existing unique document code. HeptaSign validates uniqueness but does not generate document codes."
      />
      <Card className="max-w-3xl overflow-hidden">
        <CardHeader
          title="Draft metadata"
          description="The uploaded PDF is stored unchanged. Signing creates a separate stamped copy."
        />
        <form action="/api/documents" method="post" encType="multipart/form-data" className="space-y-5 p-5">
          {errorText ? <Alert>{errorText}</Alert> : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Document code">
              <input name="documentCode" required className={inputClass} placeholder="e.g. HG-2026-0142" />
            </Field>
            <Field label="Title">
              <input name="title" required className={inputClass} placeholder="Document title" />
            </Field>
          </div>
          <Field label="Description" hint="Optional. Shown on the document detail page.">
            <textarea name="description" rows={4} className={inputClass} />
          </Field>
          <Field label="PDF file" hint="PDF only. The original is never modified.">
            <input
              name="file"
              type="file"
              accept="application/pdf"
              required
              className="block w-full cursor-pointer rounded-lg border border-line bg-panel text-sm text-muted shadow-sm outline-none transition file:mr-3 file:cursor-pointer file:border-0 file:border-r file:border-line file:bg-canvas file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-ink hover:file:bg-line/40 focus:border-brand focus:ring-4 focus:ring-brand-ring"
            />
          </Field>
          <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-[13px] font-semibold text-ink">
                <UsersIcon className="h-4 w-4 text-muted" />
                Send for signature
              </div>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-muted">
                <input type="checkbox" name="sequentialSigning" value="true" className="h-4 w-4 rounded accent-brand" />
                Sequential signing (in order)
              </label>
            </div>
            <p className="mb-2 text-xs text-faint">
              When sequential is on, each person can only sign after everyone with a lower order number. Set the order
              per signer; leave blank to use the listed order.
            </p>
            <div className="scroll-area max-h-60 space-y-2 overflow-y-auto rounded-lg border border-line bg-canvas p-2.5">
              {users.length === 0 ? (
                <p className="px-1 py-2 text-sm text-muted">No other users yet. Add users from Users.</p>
              ) : null}
              {users.map((item) => (
                <label
                  key={item.id}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-transparent bg-panel p-3 text-sm shadow-sm transition hover:border-brand/30"
                >
                  <input
                    name="assignedUserIds"
                    value={item.id}
                    type="checkbox"
                    className="h-4 w-4 rounded accent-brand"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-ink">{item.name}</span>
                    <span className="block truncate text-muted">
                      {item.title || "No title"} · {item.email}
                    </span>
                  </span>
                  <input
                    type="number"
                    min={1}
                    name={`order_${item.id}`}
                    placeholder="#"
                    title="Signing order"
                    className="w-14 rounded-md border border-line bg-panel px-2 py-1.5 text-center text-sm text-ink shadow-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand-ring"
                  />
                </label>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-3 border-t border-line pt-5">
            <Button>Create draft</Button>
            <ButtonLink href="/documents" variant="secondary">
              Cancel
            </ButtonLink>
          </div>
        </form>
      </Card>
    </AppShell>
  );
}
