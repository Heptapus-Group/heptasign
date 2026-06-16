import { notFound } from "next/navigation";
import { AppShell } from "@/components/shell";
import { Alert, Button, ButtonLink, Card, CardHeader, MetaItem, PageHeader } from "@/components/ui";
import { StatusBadge } from "@/components/status-badge";
import { PenIcon, ShieldIcon } from "@/components/icons";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { canAccessDocument, canSignDocument } from "@/lib/documents/access";

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
  if (!(await canAccessDocument(user, id))) notFound();

  const document = await prisma.document.findUnique({
    where: { id },
    include: {
      assignments: {
        include: { user: { select: { name: true, title: true } } },
        orderBy: [{ order: "asc" }, { createdAt: "asc" }]
      }
    }
  });
  if (!document) notFound();

  const assignments = document.assignments;
  const total = assignments.length;
  const signedCount = assignments.filter((a) => a.status === "SIGNED").length;
  const mine = assignments.find((a) => a.userId === user.id);
  const canSign = await canSignDocument(user, id);

  let blockReason: "finalized" | "already" | "turn" | "forbidden" | null = null;
  if (!canSign) {
    if (document.status !== "DRAFT") blockReason = "finalized";
    else if (mine?.status === "SIGNED") blockReason = "already";
    else if (mine && document.sequentialSigning) blockReason = "turn";
    else blockReason = "forbidden";
  }

  const blockMessages: Record<string, string> = {
    finalized: "Bu belge artık imzalanamaz (tamamlanmış veya iptal edilmiş).",
    already: "Bu belgeyi zaten imzaladınız.",
    turn: "Sıra sizde değil. Sizden önceki imzacılar henüz imzalamadı.",
    forbidden: "Bu belgeyi imzalama yetkiniz yok."
  };

  return (
    <AppShell>
      <PageHeader
        title="Sign / approve document"
        description={`${document.documentCode} · ${document.title}`}
        actions={<StatusBadge status={document.status} />}
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <Card className="overflow-hidden">
          <CardHeader
            title="Approval confirmation"
            description="Signing creates a separate stamped PDF and public verification record once everyone has signed. The original upload remains unchanged."
          />
          <div className="space-y-5 p-5">
            {query.error ? <Alert>{decodeURIComponent(query.error)}</Alert> : null}
            {blockReason ? <Alert tone={blockReason === "already" ? "success" : "warning"}>{blockMessages[blockReason]}</Alert> : null}

            {canSign ? (
              <div className="flex items-start gap-3 rounded-lg border border-brand/20 bg-brand-soft px-4 py-3 text-sm text-brand-dark">
                <ShieldIcon className="mt-0.5 h-[18px] w-[18px] shrink-0" />
                <p>
                  You are signing as <span className="font-semibold">{user.name}</span>
                  {user.title ? <> ({user.title})</> : null}. This action is recorded with your name, IP address, and a
                  tamper-evident hash.
                </p>
              </div>
            ) : null}

            <dl className="grid gap-5 sm:grid-cols-2">
              <MetaItem label="Document code" value={document.documentCode} mono />
              <MetaItem label="Title" value={document.title} />
              <MetaItem
                label="Signing mode"
                value={document.sequentialSigning ? "Sequential (in order)" : "Parallel (any order)"}
              />
              <MetaItem label="Progress" value={total > 0 ? `${signedCount} / ${total} signed` : "Single signer"} />
            </dl>
          </div>
          {canSign ? (
            <form action={`/api/documents/${document.id}/sign`} method="post" className="flex flex-wrap gap-3 border-t border-line p-5">
              <Button icon={<PenIcon className="h-[18px] w-[18px]" />}>Sign / approve document</Button>
              <ButtonLink href={`/documents/${document.id}`} variant="secondary">
                Cancel
              </ButtonLink>
            </form>
          ) : (
            <div className="border-t border-line p-5">
              <ButtonLink href={`/documents/${document.id}`} variant="secondary">
                Back to document
              </ButtonLink>
            </div>
          )}
        </Card>

        {total > 0 ? (
          <Card className="h-fit overflow-hidden">
            <CardHeader title="Signers" description={document.sequentialSigning ? "In signing order." : "Any order."} />
            <ol className="divide-y divide-line">
              {assignments.map((assignment, index) => (
                <li key={assignment.id} className="flex items-center gap-3 px-5 py-3.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-canvas text-xs font-semibold text-muted">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-ink">
                      {assignment.user.name}
                      {assignment.userId === user.id ? <span className="text-brand"> (you)</span> : null}
                    </div>
                    <div className="truncate text-xs text-muted">{assignment.user.title || "No title"}</div>
                  </div>
                  <StatusBadge status={assignment.status} />
                </li>
              ))}
            </ol>
          </Card>
        ) : null}
      </div>
    </AppShell>
  );
}
