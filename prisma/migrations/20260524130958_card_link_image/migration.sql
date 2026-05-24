-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CardLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cardId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT 'Link',
    "imageUrl" TEXT,
    "description" TEXT,
    "color" TEXT,
    "highlight" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CardLink_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "DigitalCard" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_CardLink" ("active", "cardId", "clicks", "color", "createdAt", "icon", "id", "label", "order", "url") SELECT "active", "cardId", "clicks", "color", "createdAt", "icon", "id", "label", "order", "url" FROM "CardLink";
DROP TABLE "CardLink";
ALTER TABLE "new_CardLink" RENAME TO "CardLink";
CREATE INDEX "CardLink_cardId_order_idx" ON "CardLink"("cardId", "order");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
