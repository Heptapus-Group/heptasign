import { notFound } from "next/navigation";
import { ButtonLink, Card, MetaItem, PageHeader } from "@/components/ui";
import { StatusBadge } from "@/components/status-badge";
import { PublicHeader } from "@/components/public-header";
import { DownloadIcon, ShieldIcon } from "@/components/icons";
import { prisma } from "@/lib/db/prisma";

export default async function VerifyTokenPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const document = await prisma.document.findUnique({
    where: { verificationToken: token },
    include: { signatures: { orderBy: { signedAt: "desc" }, take: 1 } }
  });
  if (!document) notFound();

  const signature = document.signatures[0];
  const verified = document.status === "SIGNED";

  return (
    <div className="min-h-screen bg-canvas">
      <PublicHeader />
      <main className="mx-auto max-w-4xl px-5 py-10">
        <PageHeader title="Verification result" description="Heptapus internal document approval record." />
        <Card className="overflow-hidden">
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
            <MetaItem label="Document hash" value={document.signedFileHash || "—"} wide mono />
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
      </main>
    </div>
  );
}
