import { Alert, ButtonLink, Card, CardHeader, Field, MetaItem, PageHeader, inputClass } from "@/components/ui";
import { StatusBadge } from "@/components/status-badge";
import { PublicHeader } from "@/components/public-header";
import { SearchIcon, DownloadIcon, ShieldIcon } from "@/components/icons";
import { prisma } from "@/lib/db/prisma";

export default async function VerifyPage({
  searchParams
}: {
  searchParams: Promise<{ documentCode?: string; error?: string }>;
}) {
  const params = await searchParams;
  const document = params.documentCode
    ? await prisma.document.findFirst({
        where: { documentCode: params.documentCode, verificationToken: { not: null } },
        include: { signatures: { orderBy: { signedAt: "desc" }, take: 1 } }
      })
    : null;

  return (
    <div className="min-h-screen bg-canvas">
      <PublicHeader />
      <main className="mx-auto max-w-4xl px-5 py-10">
        <PageHeader title="Verify document" description="Check a Heptapus internal approval record by document code." />
        <Card className="mb-6 overflow-hidden">
          <CardHeader
            title="Manual verification"
            description="Enter the document code printed on the document or in your internal records."
          />
          <form action="/api/verify" method="post" className="flex flex-col gap-3 p-5 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Field label="Document code">
                <div className="relative">
                  <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-faint" />
                  <input
                    name="documentCode"
                    defaultValue={params.documentCode || ""}
                    placeholder="e.g. HG-2026-0142"
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </Field>
            </div>
            <button
              type="submit"
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-brand px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark focus-visible:ring-4 focus-visible:ring-brand-ring"
            >
              Verify
            </button>
          </form>
        </Card>

        {params.error ? <Alert>Document code is required.</Alert> : null}
        {params.documentCode && !document ? (
          <Alert tone="warning">No matching approval record found for this code.</Alert>
        ) : null}
        {document ? <VerificationResult document={document} /> : null}
      </main>
    </div>
  );
}

function VerificationResult({
  document
}: {
  document: NonNullable<Awaited<ReturnType<typeof prisma.document.findUnique>>> & {
    signatures: { signedByName: string; signedByRole: string; signedAt: Date }[];
  };
}) {
  const signature = document.signatures[0];
  const verified = document.status === "SIGNED";
  return (
    <Card className="mt-6 overflow-hidden">
      <div
        className={`flex items-center gap-3 border-b border-line px-5 py-4 ${
          verified ? "bg-emerald-50" : "bg-rose-50"
        }`}
      >
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-full ${
            verified ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
          }`}
        >
          <ShieldIcon className="h-5 w-5" />
        </span>
        <div>
          <div className={`text-sm font-semibold ${verified ? "text-emerald-800" : "text-rose-800"}`}>
            {verified ? "Verified approval record" : "This document has been revoked"}
          </div>
          <div className="text-xs text-muted">{document.title}</div>
        </div>
        <div className="ml-auto">
          <StatusBadge status={document.status} />
        </div>
      </div>
      <dl className="grid gap-5 p-5 sm:grid-cols-2">
        <MetaItem label="Document code" value={document.documentCode} mono />
        <MetaItem label="Title" value={document.title} />
        <MetaItem label="Signer" value={signature?.signedByName || "—"} />
        <MetaItem label="Title / role" value={signature?.signedByRole || "—"} />
        <MetaItem label="Signed date" value={signature?.signedAt.toLocaleString() || "—"} />
        <MetaItem label="Document hash" value={document.signedFileHash || document.originalFileHash || "—"} wide mono />
      </dl>
      {document.signedFilePath ? (
        <div className="border-t border-line p-5">
          <ButtonLink
            href={`/api/files/signed/${document.id}?token=${document.verificationToken}`}
            variant="dark"
            newTab
            icon={<DownloadIcon className="h-[18px] w-[18px]" />}
          >
            View signed PDF
          </ButtonLink>
        </div>
      ) : null}
    </Card>
  );
}
