-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BillingEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'PAYPAL',
    "amount" DECIMAL NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "reference" TEXT,
    "metadata" TEXT,
    "credits" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BillingEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_BillingEvent" ("amount", "createdAt", "credits", "currency", "id", "metadata", "reference", "type", "userId") SELECT "amount", "createdAt", "credits", "currency", "id", "metadata", "reference", "type", "userId" FROM "BillingEvent";
DROP TABLE "BillingEvent";
ALTER TABLE "new_BillingEvent" RENAME TO "BillingEvent";
CREATE INDEX "BillingEvent_userId_idx" ON "BillingEvent"("userId");
CREATE INDEX "BillingEvent_type_idx" ON "BillingEvent"("type");
CREATE INDEX "BillingEvent_reference_idx" ON "BillingEvent"("reference");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
