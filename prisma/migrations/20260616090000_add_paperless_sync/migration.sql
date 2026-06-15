ALTER TABLE "Document"
ADD COLUMN "paperlessStatus" TEXT,
ADD COLUMN "paperlessTaskId" TEXT,
ADD COLUMN "paperlessError" TEXT,
ADD COLUMN "paperlessSyncedAt" TIMESTAMP(3);
