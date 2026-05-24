-- CreateTable
CREATE TABLE "DigitalCard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "role" TEXT,
    "bio" TEXT,
    "avatarUrl" TEXT,
    "coverUrl" TEXT,
    "theme" TEXT NOT NULL DEFAULT 'MINIMAL',
    "primaryColor" TEXT NOT NULL DEFAULT '#3B82F6',
    "accentColor" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "showProperties" BOOLEAN NOT NULL DEFAULT true,
    "showWhatsapp" BOOLEAN NOT NULL DEFAULT true,
    "views" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DigitalCard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CardLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cardId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT 'Link',
    "color" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CardLink_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "DigitalCard" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CardView" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cardId" TEXT NOT NULL,
    "referrer" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CardView_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "DigitalCard" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BusinessCard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "template" TEXT NOT NULL DEFAULT 'MODERN',
    "primaryColor" TEXT NOT NULL DEFAULT '#0F172A',
    "accentColor" TEXT NOT NULL DEFAULT '#3B82F6',
    "frontUrl" TEXT,
    "backUrl" TEXT,
    "generatedBy" TEXT NOT NULL DEFAULT 'MANUAL',
    "prompt" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BusinessCard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "DigitalCard_slug_key" ON "DigitalCard"("slug");

-- CreateIndex
CREATE INDEX "DigitalCard_userId_idx" ON "DigitalCard"("userId");

-- CreateIndex
CREATE INDEX "DigitalCard_slug_idx" ON "DigitalCard"("slug");

-- CreateIndex
CREATE INDEX "CardLink_cardId_order_idx" ON "CardLink"("cardId", "order");

-- CreateIndex
CREATE INDEX "CardView_cardId_createdAt_idx" ON "CardView"("cardId", "createdAt");

-- CreateIndex
CREATE INDEX "BusinessCard_userId_idx" ON "BusinessCard"("userId");
