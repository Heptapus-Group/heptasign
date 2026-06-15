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

export async function signDocument(input: SignInput) {
  const document = await prisma.document.findUnique({ where: { id: input.documentId } });
  if (!document) throw new Error("Document not found.");
  if (document.status !== DocumentStatus.DRAFT) throw new Error("Only draft documents can be signed.");

  const originalPdf = await readStoredFile(document.originalFilePath);
  const originalFileHash = cryptoProvider.hashSha256(originalPdf);
  const verificationToken = cryptoProvider.createVerificationToken();
  const verificationUrl = `${getAppUrl()}/verify/${verificationToken}`;
  const signedAt = new Date();

  const signedPdf = await stampSignedPdf({
    originalPdf,
    documentCode: document.documentCode,
    signerName: input.signerName,
    signerRole: input.signerRole,
    signedAt,
    verificationUrl
  });

  const signed = await saveSignedPdf(document.id, signedPdf);

  const result = await prisma.$transaction(async (tx) => {
    const updatedDocument = await tx.document.update({
      where: { id: document.id },
      data: {
        status: DocumentStatus.SIGNED,
        originalFileHash,
        signedFileHash: signed.hash,
        signedFilePath: signed.relativePath,
        verificationToken
      }
    });

    await tx.documentFile.create({
      data: {
        documentId: document.id,
        kind: "SIGNED",
        filePath: signed.relativePath,
        fileHash: signed.hash
      }
    });

    await tx.documentSignature.create({
      data: {
        documentId: document.id,
        signedById: input.userId,
        signedByName: input.signerName,
        signedByRole: input.signerRole,
        signedAt,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        originalFileHash,
        signedFileHash: signed.hash,
        verificationToken
      }
    });

    await tx.documentAssignment.updateMany({
      where: { documentId: document.id, userId: input.userId },
      data: { status: "SIGNED", signedAt }
    });

    return updatedDocument;
  });

  await writeAuditLog({
    userId: input.userId,
    action: "document.signed",
    entityType: "Document",
    entityId: document.id,
    metadata: { documentCode: document.documentCode, verificationToken },
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

  return result;
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
