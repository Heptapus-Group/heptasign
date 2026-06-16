import { DocumentStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { getAppUrl } from "@/lib/env";
import { cryptoProvider } from "@/lib/crypto/provider";
import { readStoredFile, saveSignedPdf } from "@/lib/files/storage";
import { stampSignedPdf } from "@/lib/pdf/stamp";
import { writeAuditLog } from "@/lib/audit/audit";
import { isPaperlessEnabled, uploadSignedPdfToPaperless } from "@/lib/paperless/client";

type SignInput = {
  documentId: string;
  userId: string;
  signerName: string;
  signerRole: string;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export type SignResult = { finalized: boolean };

export async function signDocument(input: SignInput): Promise<SignResult> {
  const document = await prisma.document.findUnique({
    where: { id: input.documentId },
    include: { assignments: { orderBy: [{ order: "asc" }, { createdAt: "asc" }] } }
  });
  if (!document) throw new Error("Document not found.");
  if (document.status !== DocumentStatus.DRAFT) throw new Error("Only draft documents can be signed.");

  const assignments = document.assignments;
  const signedAt = new Date();

  if (assignments.length > 0) {
    const myIndex = assignments.findIndex((a) => a.userId === input.userId);
    if (myIndex === -1) throw new Error("Bu belgeyi imzalamak için atanmadınız.");
    const mine = assignments[myIndex];
    if (mine.status === "SIGNED") throw new Error("Bu belgeyi zaten imzaladınız.");
    if (document.sequentialSigning && assignments.slice(0, myIndex).some((a) => a.status !== "SIGNED")) {
      throw new Error("Sıra sizde değil. Önceki imzacılar henüz imzalamadı.");
    }

    // Record this signer on their assignment (idempotent guard against double-submit).
    const claimed = await prisma.documentAssignment.updateMany({
      where: { id: mine.id, status: "PENDING" },
      data: {
        status: "SIGNED",
        signedAt,
        signerName: input.signerName,
        signerRole: input.signerRole,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null
      }
    });
    if (claimed.count === 0) throw new Error("Bu belgeyi zaten imzaladınız.");
  } else if (document.createdById !== input.userId) {
    throw new Error("Bu belgeyi imzalama yetkiniz yok.");
  }

  await writeAuditLog({
    userId: input.userId,
    action: "document.signed",
    entityType: "Document",
    entityId: document.id,
    metadata: { documentCode: document.documentCode },
    ipAddress: input.ipAddress,
    userAgent: input.userAgent
  });

  // Build the ordered list of signers and decide whether the document is complete.
  let signers: { userId: string; name: string; role: string; signedAt: Date; ipAddress: string | null; userAgent: string | null }[];
  if (assignments.length > 0) {
    const fresh = await prisma.documentAssignment.findMany({
      where: { documentId: document.id },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }]
    });
    if (!fresh.every((a) => a.status === "SIGNED")) {
      // More signatures still pending — keep the document open, do not finalize.
      return { finalized: false };
    }
    signers = fresh.map((a) => ({
      userId: a.userId,
      name: a.signerName || "—",
      role: a.signerRole || "",
      signedAt: a.signedAt || signedAt,
      ipAddress: a.ipAddress,
      userAgent: a.userAgent
    }));
  } else {
    signers = [
      {
        userId: input.userId,
        name: input.signerName,
        role: input.signerRole,
        signedAt,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null
      }
    ];
  }

  // Finalize: stamp the PDF with every signer and lock the document.
  const originalPdf = await readStoredFile(document.originalFilePath);
  const originalFileHash = cryptoProvider.hashSha256(originalPdf);
  const verificationToken = cryptoProvider.createVerificationToken();
  const verificationUrl = `${getAppUrl()}/verify/${verificationToken}`;
  const finalizedAt = new Date();

  const signedPdf = await stampSignedPdf({
    originalPdf,
    documentCode: document.documentCode,
    signers: signers.map((s) => ({ name: s.name, role: s.role, signedAt: s.signedAt })),
    signedAt: finalizedAt,
    verificationUrl
  });

  const signed = await saveSignedPdf(document.id, signedPdf);

  // Guard so concurrent last signatures cannot finalize twice.
  const claim = await prisma.document.updateMany({
    where: { id: document.id, status: DocumentStatus.DRAFT },
    data: {
      status: DocumentStatus.SIGNED,
      originalFileHash,
      signedFileHash: signed.hash,
      signedFilePath: signed.relativePath,
      verificationToken
    }
  });
  if (claim.count === 0) {
    // Another request already finalized this document.
    return { finalized: true };
  }

  await prisma.documentFile.create({
    data: {
      documentId: document.id,
      kind: "SIGNED",
      filePath: signed.relativePath,
      fileHash: signed.hash
    }
  });

  for (const signer of signers) {
    await prisma.documentSignature.create({
      data: {
        documentId: document.id,
        signedById: signer.userId,
        signedByName: signer.name,
        signedByRole: signer.role,
        signedAt: signer.signedAt,
        ipAddress: signer.ipAddress,
        userAgent: signer.userAgent,
        originalFileHash,
        signedFileHash: signed.hash,
        verificationToken: cryptoProvider.createVerificationToken()
      }
    });
  }

  await writeAuditLog({
    userId: input.userId,
    action: "document.finalized",
    entityType: "Document",
    entityId: document.id,
    metadata: { documentCode: document.documentCode, verificationToken, signers: signers.length },
    ipAddress: input.ipAddress,
    userAgent: input.userAgent
  });

  await syncSignedDocumentToPaperless({
    documentId: document.id,
    documentCode: document.documentCode,
    title: document.title,
    signedPdf,
    userId: input.userId,
    ipAddress: input.ipAddress,
    userAgent: input.userAgent
  });

  return { finalized: true };
}

export async function syncSignedDocumentToPaperless(input: {
  documentId: string;
  documentCode: string;
  title: string;
  signedPdf: Buffer;
  userId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  if (!isPaperlessEnabled()) {
    await prisma.document.update({
      where: { id: input.documentId },
      data: {
        paperlessStatus: "DISABLED",
        paperlessError: null,
        paperlessSyncedAt: null
      }
    });
    return;
  }

  try {
    const upload = await uploadSignedPdfToPaperless({
      pdf: input.signedPdf,
      filename: `${input.documentCode}-signed.pdf`,
      title: input.title,
      documentCode: input.documentCode
    });

    if (upload.skipped) return;

    await prisma.document.update({
      where: { id: input.documentId },
      data: {
        paperlessStatus: "SYNCED",
        paperlessTaskId: upload.taskId,
        paperlessError: null,
        paperlessSyncedAt: new Date()
      }
    });

    await writeAuditLog({
      userId: input.userId,
      action: "paperless.synced",
      entityType: "Document",
      entityId: input.documentId,
      metadata: { documentCode: input.documentCode, taskId: upload.taskId },
      ipAddress: input.ipAddress,
      userAgent: input.userAgent
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Paperless sync failed.";
    await prisma.document.update({
      where: { id: input.documentId },
      data: {
        paperlessStatus: "FAILED",
        paperlessError: message.slice(0, 1000),
        paperlessSyncedAt: null
      }
    });

    await writeAuditLog({
      userId: input.userId,
      action: "paperless.failed",
      entityType: "Document",
      entityId: input.documentId,
      metadata: { documentCode: input.documentCode, error: message },
      ipAddress: input.ipAddress,
      userAgent: input.userAgent
    });
  }
}
