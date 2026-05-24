-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Site" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "template" TEXT NOT NULL DEFAULT 'LUXURY_DARK',
    "title" TEXT,
    "tagline" TEXT,
    "about" TEXT,
    "primaryColor" TEXT,
    "logoUrl" TEXT,
    "coverUrl" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "email" TEXT,
    "facebookUrl" TEXT,
    "instagramUrl" TEXT,
    "tiktokUrl" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "fontPair" TEXT NOT NULL DEFAULT 'ELEGANT',
    "language" TEXT NOT NULL DEFAULT 'es',
    "enabledSections" TEXT NOT NULL DEFAULT '["AMENITIES","FLOOR_PLANS","NEIGHBORHOOD","IMMERSIVE","FINISHES","AGENT","CTA"]',
    "customDomain" TEXT,
    "customCss" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Site_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Site" ("about", "coverUrl", "createdAt", "email", "facebookUrl", "id", "instagramUrl", "logoUrl", "phone", "primaryColor", "published", "slug", "tagline", "template", "tiktokUrl", "title", "updatedAt", "userId", "whatsapp") SELECT "about", "coverUrl", "createdAt", "email", "facebookUrl", "id", "instagramUrl", "logoUrl", "phone", "primaryColor", "published", "slug", "tagline", "template", "tiktokUrl", "title", "updatedAt", "userId", "whatsapp" FROM "Site";
DROP TABLE "Site";
ALTER TABLE "new_Site" RENAME TO "Site";
CREATE UNIQUE INDEX "Site_userId_key" ON "Site"("userId");
CREATE UNIQUE INDEX "Site_slug_key" ON "Site"("slug");
CREATE UNIQUE INDEX "Site_customDomain_key" ON "Site"("customDomain");
CREATE INDEX "Site_slug_idx" ON "Site"("slug");
CREATE INDEX "Site_published_idx" ON "Site"("published");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
