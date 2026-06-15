import { notFound } from "next/navigation";
import { AppShell } from "@/components/shell";
import { Alert, Button, ButtonLink, Card, CardHeader, MetaItem, PageHeader } from "@/components/ui";
import { StatusBadge } from "@/components/status-badge";
import { PenIcon, ShieldIcon } from "@/components/icons";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { canSignDocument } from "@/lib/documents/access";

export default async function SignDocumentPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const query = await searchParams;
  const document = await prisma.document.findUnique({ where: { id } });
  if (!document) notFound();
  if (!(await canSignDocument(user, id))) notFound();

  return (
    <AppShell>
      <PageHeader
        title="Sign / approve document"
        description={`${document.documentCode} · ${document.title}`}
        actions={<StatusBadge status={document.status} />}
      />
      <Card className="max-w-3xl overflow-hidden">
        <CardHeader
          title="Approval confirmation"
          description="Signing creates a separate stamped PDF and public verification record. The original upload remains unchanged."
        />
        <div className="space-y-5 p-5">
          {query.error ? <Alert>{decodeURIComponent(query.error)}</Alert> : null}

          <div className="flex items-start gap-3 rounded-lg border border-brand/20 bg-brand-soft px-4 py-3 text-sm text-brand-dark">
            <ShieldIcon className="mt-0.5 h-[18px] w-[18px] shrink-0" />
            <p>
              You are signing as <span className="font-semibold">{user.name}</span>
              {user.title ? <> ({user.title})</> : null}. This action is recorded with your name, IP address, and a
              tamper-evident hash.
            </p>
          </div>

          <dl className="grid gap-5 sm:grid-cols-2">
            <MetaItem label="Document code" value={document.documentCode} mono />
            <MetaItem label="Title" value={document.title} />
            <MetaItem label="Current status" value={<StatusBadge status={document.status} />} />
            <MetaItem
              label="Original hash"
              value={document.originalFileHash || "Recalculated during signing"}
              wide
              mono
            />
          </dl>
        </div>
        <form action={`/api/documents/${document.id}/sign`} method="post" className="flex flex-wrap gap-3 border-t border-line p-5">
          <Button icon={<PenIcon className="h-[18px] w-[18px]" />}>Sign / approve document</Button>
          <ButtonLink href={`/documents/${document.id}`} variant="secondary">
            Cancel
          </ButtonLink>
        </form>
      </Card>
    </AppShell>
  );
}
