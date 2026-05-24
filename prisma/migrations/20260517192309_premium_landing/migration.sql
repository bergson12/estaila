-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Property" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NUEVO',
    "priceUSD" DECIMAL,
    "priceDOP" DECIMAL,
    "bedrooms" INTEGER,
    "bathrooms" DECIMAL,
    "parking" INTEGER,
    "metersSquared" INTEGER,
    "location" TEXT,
    "address" TEXT,
    "mapsUrl" TEXT,
    "featuredPhoto" TEXT,
    "ownerId" TEXT,
    "lat" DECIMAL,
    "lng" DECIMAL,
    "premiumLanding" BOOLEAN NOT NULL DEFAULT false,
    "amenities" TEXT NOT NULL DEFAULT '[]',
    "finishes" TEXT NOT NULL DEFAULT '[]',
    "floorPlans" TEXT NOT NULL DEFAULT '[]',
    "nearbyPois" TEXT NOT NULL DEFAULT '[]',
    "videoUrl" TEXT,
    "walkthroughUrl" TEXT,
    "customTagline" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Property_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Property_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Contact" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Property" ("address", "amenities", "bathrooms", "bedrooms", "category", "createdAt", "customTagline", "description", "featuredPhoto", "finishes", "floorPlans", "id", "lat", "lng", "location", "mapsUrl", "metersSquared", "nearbyPois", "operation", "ownerId", "parking", "priceDOP", "priceUSD", "status", "title", "updatedAt", "userId", "videoUrl", "walkthroughUrl") SELECT "address", "amenities", "bathrooms", "bedrooms", "category", "createdAt", "customTagline", "description", "featuredPhoto", "finishes", "floorPlans", "id", "lat", "lng", "location", "mapsUrl", "metersSquared", "nearbyPois", "operation", "ownerId", "parking", "priceDOP", "priceUSD", "status", "title", "updatedAt", "userId", "videoUrl", "walkthroughUrl" FROM "Property";
DROP TABLE "Property";
ALTER TABLE "new_Property" RENAME TO "Property";
CREATE INDEX "Property_userId_idx" ON "Property"("userId");
CREATE INDEX "Property_category_idx" ON "Property"("category");
CREATE INDEX "Property_operation_idx" ON "Property"("operation");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
