import Link from "next/link";
import { DocumentStatus, Prisma } from "@prisma/client";
import { AppShell } from "@/components/shell";
import { Button, ButtonLink, Card, EmptyState, PageHeader, inputClass } from "@/components/ui";
import { StatusBadge } from "@/components/status-badge";
import { SearchIcon, PlusIcon, FileIcon } from "@/components/icons";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/session";
import { visibleDocumentWhere } from "@/lib/documents/access";

export default async function DocumentsPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const q = params.q?.trim();
  const status = Object.values(DocumentStatus).includes(params.status as DocumentStatus)
    ? (params.status as DocumentStatus)
    : undefined;
  const where: Prisma.DocumentWhereInput = {
    AND: [visibleDocumentWhere(user)],
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { documentCode: { contains: q, mode: "insensitive" } },
            { title: { contains: q, mode: "insensitive" } }
          ]
        }
      : {})
  };

  const documents = await prisma.document.findMany({ where, orderBy: { createdAt: "desc" }, take: 100 });

  return (
    <AppShell>
      <PageHeader
        title="Documents"
        description="Find drafts, signed approvals, revoked records, and their verification metadata."
        actions={
          <ButtonLink href="/documents/new" icon={<PlusIcon className="h-[18px] w-[18px]" />}>
            New document
          </ButtonLink>
        }
      />

      <form className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-faint" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search by document code or title"
            className={`${inputClass} pl-10`}
          />
        </div>
        <select name="status" defaultValue={status || ""} className={`${inputClass} sm:w-48`}>
          <option value="">All statuses</option>
          {Object.values(DocumentStatus).map((item) => (
            <option key={item} value={item}>
              {item.charAt(0) + item.slice(1).toLowerCase()}
            </option>
          ))}
        </select>
        <Button variant="secondary">Search</Button>
      </form>

      <Card className="overflow-hidden">
        {documents.length === 0 ? (
          <EmptyState
            icon={<FileIcon className="h-5 w-5" />}
            title="No documents found"
            description="Try a different search, clear the status filter, or create a new document draft."
            action={
              <ButtonLink href="/documents/new" icon={<PlusIcon className="h-[18px] w-[18px]" />}>
                New document
              </ButtonLink>
            }
          />
        ) : (
          <div className="overflow-x-auto scroll-area">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-[11px] uppercase tracking-wider text-faint">
                  <th className="px-5 py-3 font-semibold">Code</th>
                  <th className="px-5 py-3 font-semibold">Title</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Created</th>
                  <th className="px-5 py-3 font-semibold">Signed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {documents.map((doc) => (
                  <tr key={doc.id} className="transition hover:bg-canvas">
                    <td className="px-5 py-3.5">
                      <Link href={`/documents/${doc.id}`} className="font-mono text-[13px] font-semibold text-brand hover:underline">
                        {doc.documentCode}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-ink">
                      <Link href={`/documents/${doc.id}`} className="hover:underline">
                        {doc.title}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={doc.status} />
                    </td>
                    <td className="px-5 py-3.5 text-muted tnum">{doc.createdAt.toLocaleDateString()}</td>
                    <td className="px-5 py-3.5 text-muted tnum">
                      {doc.status === "SIGNED" ? doc.updatedAt.toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </AppShell>
  );
}
