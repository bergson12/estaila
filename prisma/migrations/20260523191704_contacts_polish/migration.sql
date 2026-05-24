-- CreateTable
CREATE TABLE "ContactActivity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contactId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "durationMin" INTEGER,
    "propertyId" TEXT,
    "appointmentId" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContactActivity_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6B7280',
    "icon" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ContactTag" (
    "contactId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    PRIMARY KEY ("contactId", "tagId"),
    CONSTRAINT "ContactTag_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ContactTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ContactCustomField" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contactId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    CONSTRAINT "ContactCustomField_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SmartList" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT 'List',
    "color" TEXT NOT NULL DEFAULT '#3B82F6',
    "filters" TEXT NOT NULL,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Contact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "phone" TEXT,
    "whatsapp" TEXT,
    "email" TEXT,
    "location" TEXT,
    "rnc" TEXT,
    "reference" TEXT,
    "ratings" TEXT NOT NULL DEFAULT '[]',
    "profession" TEXT NOT NULL DEFAULT '[]',
    "favorite" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "avatar" TEXT,
    "score" INTEGER NOT NULL DEFAULT 0,
    "lastContactedAt" DATETIME,
    "birthday" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Contact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Contact" ("avatar", "createdAt", "email", "favorite", "id", "location", "name", "notes", "phone", "profession", "ratings", "reference", "rnc", "type", "updatedAt", "userId", "whatsapp") SELECT "avatar", "createdAt", "email", "favorite", "id", "location", "name", "notes", "phone", "profession", "ratings", "reference", "rnc", "type", "updatedAt", "userId", "whatsapp" FROM "Contact";
DROP TABLE "Contact";
ALTER TABLE "new_Contact" RENAME TO "Contact";
CREATE INDEX "Contact_userId_idx" ON "Contact"("userId");
CREATE INDEX "Contact_type_idx" ON "Contact"("type");
CREATE INDEX "Contact_lastContactedAt_idx" ON "Contact"("lastContactedAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "ContactActivity_contactId_createdAt_idx" ON "ContactActivity"("contactId", "createdAt");

-- CreateIndex
CREATE INDEX "ContactActivity_userId_idx" ON "ContactActivity"("userId");

-- CreateIndex
CREATE INDEX "ContactActivity_type_idx" ON "ContactActivity"("type");

-- CreateIndex
CREATE INDEX "Tag_userId_idx" ON "Tag"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_userId_name_key" ON "Tag"("userId", "name");

-- CreateIndex
CREATE INDEX "ContactTag_tagId_idx" ON "ContactTag"("tagId");

-- CreateIndex
CREATE INDEX "ContactCustomField_contactId_idx" ON "ContactCustomField"("contactId");

-- CreateIndex
CREATE UNIQUE INDEX "ContactCustomField_contactId_key_key" ON "ContactCustomField"("contactId", "key");

-- CreateIndex
CREATE INDEX "SmartList_userId_idx" ON "SmartList"("userId");
