import { notFound } from "next/navigation";
import { UserRole } from "@prisma/client";
import { AppShell } from "@/components/shell";
import { Alert, Button, ButtonLink, Card, CardHeader, EmptyState, Field, MetaItem, PageHeader } from "@/components/ui";
import { StatusBadge } from "@/components/status-badge";
import { PenIcon, FileIcon, DownloadIcon, UsersIcon, PlusIcon, CheckIcon, ArchiveIcon, TrashIcon } from "@/components/icons";
import { ConfirmForm } from "@/components/confirm-form";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { canAccessDocument, canSignDocument } from "@/lib/documents/access";

const errorMessages: Record<string, string> = {
  forbidden: "Only the document creator or an admin can revoke this document.",
  "not-revocable": "Only a signed document can be revoked.",
  "no-signed-pdf": "This document has no signed PDF to archive yet.",
  "delete-forbidden": "You can only delete your own draft documents. Signed documents can be deleted by an admin."
};

export default async function DocumentDetailPage({
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
      signatures: { orderBy: { signedAt: "desc" } },
      assignments: {
        include: { user: { select: { name: true, email: true, title: true } } },
        orderBy: [{ order: "asc" }, { createdAt: "asc" }]
      }
    }
  });
  if (!document) notFound();
  const canManageAssignments = user.role === UserRole.ADMIN || document.createdById === user.id;
  const canSign = document.status === "DRAFT" && (await canSignDocument(user, document.id));
  const canRevoke = document.status === "SIGNED" && canManageAssignments;
  const canDelete = user.role === UserRole.ADMIN || (document.createdById === user.id && document.status === "DRAFT");
  const canSyncPaperless = Boolean(document.signedFilePath) && canManageAssignments;
  const signedCount = document.assignments.filter((a) => a.status === "SIGNED").length;
  const totalSigners = document.assignments.length;
  const assignedIds = new Set(document.assignments.map((assignment) => assignment.userId));
  const assignableUsers = canManageAssignments
    ? await prisma.user.findMany({
        where: { id: { notIn: [user.id, ...assignedIds] } },
        orderBy: { name: "asc" },
        select: { id: true, name: true, email: true, title: true }
      })
    : [];

  const errorText = query.error ? errorMessages[query.error] || null : null;

  return (
    <AppShell>
      <PageHeader
        title={document.title}
        description={document.documentCode}
        actions={
          <>
            <StatusBadge status={document.status} />
            {canSign ? (
              <ButtonLink href={`/documents/${document.id}/sign`} icon={<PenIcon className="h-[18px] w-[18px]" />}>
                Sign
              </ButtonLink>
            ) : null}
          </>
        }
      />

      {errorText ? (
        <div className="mb-5">
          <Alert>{errorText}</Alert>
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <Card className="overflow-hidden">
          <CardHeader title="Document details" description="Internal approval status, hashes, and file access." />
          <dl className="grid gap-5 p-5 sm:grid-cols-2">
            <MetaItem label="Document code" value={document.documentCode} mono />
            <MetaItem label="Status" value={<StatusBadge status={document.status} />} />
            <MetaItem label="Original hash" value={document.originalFileHash || "—"} wide mono />
            <MetaItem label="Signed hash" value={document.signedFileHash || "—"} wide mono />
            <MetaItem label="Verification token" value={document.verificationToken || "—"} wide mono />
            <MetaItem label="Description" value={document.description || "—"} wide />
          </dl>

          <div className="border-t border-line px-5 py-4">
            <h3 className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-ink">
              <ArchiveIcon className="h-4 w-4 text-muted" />
              Paperless archive
            </h3>
            <dl className="grid gap-5 sm:grid-cols-2">
              <MetaItem label="Sync status" value={document.paperlessStatus || "Not configured"} />
              <MetaItem label="Task" value={document.paperlessTaskId || "—"} mono />
              {document.paperlessError ? (
                <MetaItem label="Last error" value={document.paperlessError} wide />
              ) : null}
            </dl>
          </div>

          <div className="flex flex-wrap gap-3 border-t border-line p-5">
            <ButtonLink
              href={`/api/files/original/${document.id}`}
              variant="secondary"
              newTab
              icon={<FileIcon className="h-[18px] w-[18px]" />}
            >
              View original PDF
            </ButtonLink>
            {document.signedFilePath ? (
              <ButtonLink
                href={`/api/files/signed/${document.id}`}
                variant="secondary"
                newTab
                icon={<DownloadIcon className="h-[18px] w-[18px]" />}
              >
                View signed PDF
              </ButtonLink>
            ) : null}
            {canSyncPaperless ? (
              <form action={`/api/documents/${document.id}/paperless`} method="post">
                <Button variant="secondary" icon={<ArchiveIcon className="h-[18px] w-[18px]" />}>
                  Sync to Paperless
                </Button>
              </form>
            ) : null}
            {canRevoke || canDelete ? (
              <div className="ml-auto flex flex-wrap gap-3">
                {canRevoke ? (
                  <ConfirmForm
                    action={`/api/documents/${document.id}/revoke`}
                    message={`Revoke ${document.documentCode}? Its verification record will be marked revoked.`}
                  >
                    <Button variant="danger">Revoke</Button>
                  </ConfirmForm>
                ) : null}
                {canDelete ? (
                  <ConfirmForm
                    action={`/api/documents/${document.id}/delete`}
                    message={`Permanently delete ${document.documentCode}? This removes the document, its files, and all signature records. This cannot be undone.`}
                  >
                    <Button variant="danger" icon={<TrashIcon className="h-[18px] w-[18px]" />}>
                      Delete
                    </Button>
                  </ConfirmForm>
                ) : null}
              </div>
            ) : null}
          </div>
        </Card>

        <div className="space-y-5">
          <Card className="overflow-hidden">
            <CardHeader title="Signature history" description="Recorded signers and verification tokens." />
            {document.signatures.length === 0 ? (
              <EmptyState
                icon={<PenIcon className="h-5 w-5" />}
                title="No signatures yet"
                description="This draft has not been approved. Sign it to create a verification record."
              />
            ) : (
              <ul className="divide-y divide-line">
                {document.signatures.map((signature) => (
                  <li key={signature.id} className="p-5">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                        <CheckIcon className="h-3.5 w-3.5" />
                      </span>
                      <span className="font-medium text-ink">{signature.signedByName}</span>
                    </div>
                    <div className="mt-1 text-sm text-muted">{signature.signedByRole}</div>
                    <div className="mt-1 text-sm text-ink tnum">{signature.signedAt.toLocaleString()}</div>
                    <div className="mt-2 break-all font-mono text-[11px] text-faint">{signature.verificationToken}</div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="overflow-hidden">
            <CardHeader
              title="Assigned signers"
              description={
                totalSigners > 0
                  ? `${signedCount}/${totalSigners} signed · ${document.sequentialSigning ? "Sequential order" : "Any order"}`
                  : "People who can access this document for approval."
              }
            />
            {document.assignments.length === 0 ? (
              <EmptyState
                icon={<UsersIcon className="h-5 w-5" />}
                title="No assigned signers"
                description="Only the creator and admins can access this draft."
              />
            ) : (
              <ol className="divide-y divide-line">
                {document.assignments.map((assignment, index) => (
                  <li key={assignment.id} className="flex items-center gap-3 p-5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-canvas text-xs font-semibold text-muted">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-ink">{assignment.user.name}</div>
                      <div className="truncate text-sm text-muted">
                        {assignment.user.title || "No title"} · {assignment.user.email}
                      </div>
                    </div>
                    <StatusBadge status={assignment.status} />
                  </li>
                ))}
              </ol>
            )}
            {canManageAssignments ? (
              <form action={`/api/documents/${document.id}/assign`} method="post" className="border-t border-line p-5">
                <Field label="Add signers">
                  <div className="scroll-area max-h-44 space-y-2 overflow-y-auto rounded-lg border border-line bg-canvas p-2.5">
                    {assignableUsers.length === 0 ? (
                      <p className="px-1 py-2 text-sm text-muted">No available users to assign.</p>
                    ) : null}
                    {assignableUsers.map((item) => (
                      <label
                        key={item.id}
                        className="flex cursor-pointer items-start gap-3 rounded-lg border border-transparent bg-panel p-3 text-sm shadow-sm transition hover:border-brand/30"
                      >
                        <input
                          name="assignedUserIds"
                          value={item.id}
                          type="checkbox"
                          className="mt-0.5 h-4 w-4 rounded accent-brand"
                        />
                        <span className="min-w-0">
                          <span className="block font-medium text-ink">{item.name}</span>
                          <span className="block truncate text-muted">
                            {item.title || "No title"} · {item.email}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                </Field>
                <div className="mt-3">
                  <Button variant="secondary" icon={<PlusIcon className="h-[18px] w-[18px]" />}>
                    Assign selected
                  </Button>
                </div>
              </form>
            ) : null}
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
