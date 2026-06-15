import Link from "next/link";
import { DocumentStatus } from "@prisma/client";
import { AppShell } from "@/components/shell";
import { ButtonLink, Card, CardHeader, EmptyState, PageHeader } from "@/components/ui";
import { StatusBadge } from "@/components/status-badge";
import {
  DocumentsIcon,
  CheckIcon,
  PenIcon,
  ShieldIcon,
  PlusIcon,
  ChevronRightIcon,
  FileIcon
} from "@/components/icons";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/session";
import { visibleDocumentWhere } from "@/lib/documents/access";

export default async function DashboardPage() {
  const user = await requireUser();
  const scope = visibleDocumentWhere(user);
  const [total, signed, draft, revoked, pendingMySignature, recent] = await Promise.all([
    prisma.document.count({ where: scope }),
    prisma.document.count({ where: { AND: [scope, { status: DocumentStatus.SIGNED }] } }),
    prisma.document.count({ where: { AND: [scope, { status: DocumentStatus.DRAFT }] } }),
    prisma.document.count({ where: { AND: [scope, { status: DocumentStatus.REVOKED }] } }),
    prisma.document.findMany({
      where: {
        status: DocumentStatus.DRAFT,
        assignments: { some: { userId: user.id, status: "PENDING" } }
      },
      orderBy: { updatedAt: "desc" },
      take: 6
    }),
    prisma.document.findMany({
      where: { AND: [scope, { status: DocumentStatus.SIGNED }] },
      orderBy: { updatedAt: "desc" },
      take: 6
    })
  ]);

  const stats = [
    { label: "Total documents", value: total, Icon: DocumentsIcon, tint: "text-brand bg-brand-soft" },
    { label: "Signed", value: signed, Icon: CheckIcon, tint: "text-emerald-600 bg-emerald-50" },
    { label: "Drafts", value: draft, Icon: PenIcon, tint: "text-amber-600 bg-amber-50" },
    { label: "Revoked", value: revoked, Icon: ShieldIcon, tint: "text-rose-600 bg-rose-50" }
  ];

  return (
    <AppShell>
      <PageHeader
        title={`Welcome, ${user.name.split(" ")[0]}`}
        description="A quick operational view of internal approval activity, open drafts, and recent signed records."
        actions={
          <ButtonLink href="/documents/new" icon={<PlusIcon className="h-[18px] w-[18px]" />}>
            New document
          </ButtonLink>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, Icon, tint }) => (
          <Card key={label} className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted">{label}</span>
              <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${tint}`}>
                <Icon className="h-[18px] w-[18px]" />
              </span>
            </div>
            <div className="mt-3 text-3xl font-semibold tracking-tight text-ink tnum">{value}</div>
          </Card>
        ))}
      </div>

      <Card className="mt-7 overflow-hidden">
        <CardHeader
          title="Pending my signature"
          description="Documents assigned to you and waiting for internal approval."
        />
        {pendingMySignature.length === 0 ? (
          <EmptyState
            icon={<PenIcon className="h-5 w-5" />}
            title="No pending signature tasks"
            description="Documents assigned to you for approval will appear here."
          />
        ) : (
          <ul className="divide-y divide-line">
            {pendingMySignature.map((doc) => (
              <li key={doc.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <PenIcon className="h-[18px] w-[18px]" />
                </span>
                <div className="min-w-0 flex-1">
                  <Link href={`/documents/${doc.id}`} className="block truncate font-medium text-ink hover:text-brand">
                    {doc.title}
                  </Link>
                  <span className="block truncate font-mono text-xs text-muted">{doc.documentCode}</span>
                </div>
                <ButtonLink href={`/documents/${doc.id}/sign`} icon={<PenIcon className="h-[18px] w-[18px]" />}>
                  Sign
                </ButtonLink>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="mt-7 overflow-hidden">
        <CardHeader
          title="Recent signed documents"
          description="Latest completed approvals with verification records."
          actions={
            <ButtonLink href="/documents" variant="ghost">
              View all
            </ButtonLink>
          }
        />
        {recent.length === 0 ? (
          <EmptyState
            icon={<FileIcon className="h-5 w-5" />}
            title="No signed documents yet"
            description="Create a draft document and approve it to see recent signatures here."
            action={
              <ButtonLink href="/documents/new" icon={<PlusIcon className="h-[18px] w-[18px]" />}>
                Create first document
              </ButtonLink>
            }
          />
        ) : (
          <ul className="divide-y divide-line">
            {recent.map((doc) => (
              <li key={doc.id}>
                <Link
                  href={`/documents/${doc.id}`}
                  className="group flex items-center gap-4 px-5 py-4 transition hover:bg-canvas"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-line bg-canvas text-muted">
                    <FileIcon className="h-[18px] w-[18px]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-ink">{doc.title}</span>
                    <span className="block truncate font-mono text-xs text-muted">{doc.documentCode}</span>
                  </span>
                  <StatusBadge status={doc.status} />
                  <ChevronRightIcon className="h-[18px] w-[18px] text-faint transition group-hover:translate-x-0.5 group-hover:text-muted" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </AppShell>
  );
}
