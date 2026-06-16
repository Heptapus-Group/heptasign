import fs from "fs/promises";
import path from "path";
import { getMaxUploadBytes, getStoragePath } from "@/lib/env";
import { cryptoProvider } from "@/lib/crypto/provider";

export async function ensureStorage() {
  await fs.mkdir(path.join(getStoragePath(), "originals"), { recursive: true });
  await fs.mkdir(path.join(getStoragePath(), "signed"), { recursive: true });
}

export function safePdfName(id: string, label: "original" | "signed") {
  return `${id}-${label}.pdf`;
}

export async function validatePdfUpload(file: File) {
  if (!file || file.size <= 0) throw new Error("PDF file is required.");
  if (file.size > getMaxUploadBytes()) throw new Error("PDF file exceeds the upload limit.");
  if (file.type && file.type !== "application/pdf") throw new Error("Only PDF files are allowed.");

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.subarray(0, 4).toString("utf8") !== "%PDF") {
    throw new Error("Uploaded file is not a valid PDF.");
  }

  return buffer;
}

export async function saveOriginalPdf(documentId: string, buffer: Buffer) {
  await ensureStorage();
  const relativePath = path.join("originals", safePdfName(documentId, "original"));
  const fullPath = path.join(getStoragePath(), relativePath);
  await fs.writeFile(fullPath, buffer);
  return { relativePath, hash: cryptoProvider.hashSha256(buffer) };
}

export async function saveSignedPdf(documentId: string, buffer: Buffer) {
  await ensureStorage();
  const relativePath = path.join("signed", safePdfName(documentId, "signed"));
  const fullPath = path.join(getStoragePath(), relativePath);
  await fs.writeFile(fullPath, buffer);
  return { relativePath, hash: cryptoProvider.hashSha256(buffer) };
}

export async function readStoredFile(relativePath: string) {
  const fullPath = path.resolve(getStoragePath(), relativePath);
  const root = path.resolve(getStoragePath());
  if (!fullPath.startsWith(root)) throw new Error("Invalid file path.");
  return fs.readFile(fullPath);
}

export async function deleteStoredFile(relativePath?: string | null) {
  if (!relativePath || relativePath === "pending") return;
  const fullPath = path.resolve(getStoragePath(), relativePath);
  const root = path.resolve(getStoragePath());
  if (!fullPath.startsWith(root)) throw new Error("Invalid file path.");
  // force: ignore the file already being gone.
  await fs.rm(fullPath, { force: true });
}
