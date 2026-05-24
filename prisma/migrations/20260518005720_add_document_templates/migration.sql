-- CreateTable
CREATE TABLE "DocumentTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "kind" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "body" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'MANUAL',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "DocumentTemplate_userId_kind_idx" ON "DocumentTemplate"("userId", "kind");

-- CreateIndex
CREATE INDEX "DocumentTemplate_kind_idx" ON "DocumentTemplate"("kind");
