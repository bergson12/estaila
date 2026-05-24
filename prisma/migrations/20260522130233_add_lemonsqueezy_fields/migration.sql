-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Organization" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT,
    "primaryColor" TEXT,
    "secondaryColor" TEXT,
    "accentColor" TEXT,
    "fontPair" TEXT NOT NULL DEFAULT 'ELEGANT',
    "legalName" TEXT,
    "taxId" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "address" TEXT,
    "plan" TEXT NOT NULL DEFAULT 'TEAM',
    "maxSeats" INTEGER NOT NULL DEFAULT 5,
    "paypalSubId" TEXT,
    "lsSubId" TEXT,
    "lsCustomerId" TEXT,
    "lsVariantId" TEXT,
    "billingProvider" TEXT NOT NULL DEFAULT 'NONE',
    "planActive" BOOLEAN NOT NULL DEFAULT true,
    "planRenewsAt" DATETIME,
    "customDomain" TEXT,
    "whiteLabel" BOOLEAN NOT NULL DEFAULT false,
    "defaultLocale" TEXT NOT NULL DEFAULT 'es',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Organization" ("accentColor", "address", "createdAt", "customDomain", "defaultLocale", "email", "fontPair", "id", "legalName", "logoUrl", "maxSeats", "name", "paypalSubId", "phone", "plan", "planActive", "planRenewsAt", "primaryColor", "secondaryColor", "slug", "taxId", "updatedAt", "website", "whiteLabel") SELECT "accentColor", "address", "createdAt", "customDomain", "defaultLocale", "email", "fontPair", "id", "legalName", "logoUrl", "maxSeats", "name", "paypalSubId", "phone", "plan", "planActive", "planRenewsAt", "primaryColor", "secondaryColor", "slug", "taxId", "updatedAt", "website", "whiteLabel" FROM "Organization";
DROP TABLE "Organization";
ALTER TABLE "new_Organization" RENAME TO "Organization";
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");
CREATE UNIQUE INDEX "Organization_paypalSubId_key" ON "Organization"("paypalSubId");
CREATE UNIQUE INDEX "Organization_lsSubId_key" ON "Organization"("lsSubId");
CREATE UNIQUE INDEX "Organization_customDomain_key" ON "Organization"("customDomain");
CREATE INDEX "Organization_slug_idx" ON "Organization"("slug");
CREATE INDEX "Organization_plan_idx" ON "Organization"("plan");
CREATE TABLE "new_user" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "name" TEXT NOT NULL,
    "image" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "plan" TEXT NOT NULL DEFAULT 'FREE',
    "credits" INTEGER NOT NULL DEFAULT 5,
    "paypalSubId" TEXT,
    "paypalCustomerId" TEXT,
    "lsSubId" TEXT,
    "lsCustomerId" TEXT,
    "lsVariantId" TEXT,
    "billingProvider" TEXT NOT NULL DEFAULT 'NONE',
    "planActive" BOOLEAN NOT NULL DEFAULT true,
    "planRenewsAt" DATETIME,
    "suspended" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_user" ("createdAt", "credits", "email", "emailVerified", "id", "image", "name", "paypalCustomerId", "paypalSubId", "plan", "planActive", "planRenewsAt", "role", "suspended", "updatedAt") SELECT "createdAt", "credits", "email", "emailVerified", "id", "image", "name", "paypalCustomerId", "paypalSubId", "plan", "planActive", "planRenewsAt", "role", "suspended", "updatedAt" FROM "user";
DROP TABLE "user";
ALTER TABLE "new_user" RENAME TO "user";
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");
CREATE UNIQUE INDEX "user_paypalSubId_key" ON "user"("paypalSubId");
CREATE UNIQUE INDEX "user_lsSubId_key" ON "user"("lsSubId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
