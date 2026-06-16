ALTER TABLE "Document" ADD COLUMN "sequentialSigning" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "DocumentAssignment"
  ADD COLUMN "order" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "signerName" TEXT,
  ADD COLUMN "signerRole" TEXT,
  ADD COLUMN "ipAddress" TEXT,
  ADD COLUMN "userAgent" TEXT;
