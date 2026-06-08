-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "avatar" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "brandName" TEXT NOT NULL,
    "industry" TEXT,
    "contactPerson" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "instagramUrl" TEXT,
    "facebookUrl" TEXT,
    "notes" TEXT,
    "brandGuidelines" TEXT,
    "healthScore" REAL NOT NULL DEFAULT 0,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "social_accounts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "username" TEXT,
    "profileUrl" TEXT,
    "profileImage" TEXT,
    "bio" TEXT,
    "followers" INTEGER NOT NULL DEFAULT 0,
    "following" INTEGER NOT NULL DEFAULT 0,
    "totalPosts" INTEGER NOT NULL DEFAULT 0,
    "pageLikes" INTEGER NOT NULL DEFAULT 0,
    "isConnected" BOOLEAN NOT NULL DEFAULT false,
    "accessToken" TEXT,
    "lastSynced" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "social_accounts_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "analytics_snapshots" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "followers" INTEGER NOT NULL DEFAULT 0,
    "reach" INTEGER NOT NULL DEFAULT 0,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "engagement" REAL NOT NULL DEFAULT 0,
    "saves" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "reelsViews" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "analytics_snapshots_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "calendar_entries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "title" TEXT,
    "contentType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "postLink" TEXT,
    "caption" TEXT,
    "notes" TEXT,
    "screenshotPath" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "calendar_entries_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "content_library" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "title" TEXT,
    "caption" TEXT,
    "filePath" TEXT,
    "thumbnailPath" TEXT,
    "postLink" TEXT,
    "platform" TEXT,
    "postedAt" DATETIME,
    "engagementScore" REAL,
    "tags" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "content_library_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ai_reviews" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "contentItemId" TEXT,
    "calendarEntryId" TEXT,
    "screenshotPath" TEXT,
    "overallScore" REAL NOT NULL,
    "designScore" REAL NOT NULL,
    "marketingScore" REAL NOT NULL,
    "contentScore" REAL NOT NULL,
    "strengths" TEXT NOT NULL,
    "weaknesses" TEXT NOT NULL,
    "recommendations" TEXT NOT NULL,
    "rawResponse" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ai_reviews_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "summary" TEXT,
    "insights" TEXT,
    "metrics" TEXT,
    "pdfPath" TEXT,
    "pptxPath" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "reports_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "competitors" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "profileUrl" TEXT NOT NULL,
    "username" TEXT,
    "analysis" TEXT,
    "lastAnalyzed" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "competitors_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "content_ideas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "contentType" TEXT NOT NULL,
    "platform" TEXT,
    "industry" TEXT,
    "goal" TEXT,
    "tags" TEXT,
    "isSaved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "content_ideas_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "app_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "social_accounts_clientId_platform_key" ON "social_accounts"("clientId", "platform");
CREATE INDEX "analytics_snapshots_clientId_platform_date_idx" ON "analytics_snapshots"("clientId", "platform", "date");
CREATE INDEX "calendar_entries_clientId_date_idx" ON "calendar_entries"("clientId", "date");
CREATE INDEX "content_library_clientId_contentType_idx" ON "content_library"("clientId", "contentType");
CREATE INDEX "ai_reviews_clientId_idx" ON "ai_reviews"("clientId");
CREATE INDEX "reports_clientId_year_month_idx" ON "reports"("clientId", "year", "month");
CREATE INDEX "content_ideas_clientId_idx" ON "content_ideas"("clientId");
CREATE INDEX "notifications_isRead_idx" ON "notifications"("isRead");
CREATE UNIQUE INDEX "app_settings_key_key" ON "app_settings"("key");
