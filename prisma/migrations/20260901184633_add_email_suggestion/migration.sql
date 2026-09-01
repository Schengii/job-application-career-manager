-- AlterTable
ALTER TABLE "Application" ADD COLUMN "interviewStage" TEXT;
ALTER TABLE "Application" ADD COLUMN "meetingUrl" TEXT;
ALTER TABLE "Application" ADD COLUMN "rejectionReason" TEXT;
ALTER TABLE "Application" ADD COLUMN "tags" TEXT;
ALTER TABLE "Application" ADD COLUMN "timeSpentMinutes" INTEGER DEFAULT 0;

-- AlterTable
ALTER TABLE "Company" ADD COLUMN "letterTemplate" TEXT;
ALTER TABLE "Company" ADD COLUMN "preferredTone" TEXT;
ALTER TABLE "Company" ADD COLUMN "tags" TEXT;

-- CreateTable
CREATE TABLE "ApplicationInteraction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "interactionDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "applicationId" TEXT NOT NULL,
    CONSTRAINT "ApplicationInteraction_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CoverLetterSnippet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SentPushNotification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "EmailSuggestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "emailId" TEXT NOT NULL,
    "emailFrom" TEXT NOT NULL,
    "emailSubject" TEXT NOT NULL,
    "emailSnippet" TEXT NOT NULL,
    "emailDate" DATETIME NOT NULL,
    "detectedStatus" TEXT NOT NULL,
    "suggestedStatus" TEXT,
    "statusLabel" TEXT NOT NULL,
    "reasoning" TEXT NOT NULL,
    "confidence" INTEGER NOT NULL,
    "extractedDate" TEXT,
    "extractedTime" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" DATETIME,
    "applicationId" TEXT NOT NULL,
    CONSTRAINT "EmailSuggestion_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "fileName" TEXT,
    "fileUrl" TEXT,
    "mimeType" TEXT,
    "fileSize" INTEGER,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Document" ("category", "createdAt", "description", "fileName", "fileSize", "fileUrl", "id", "mimeType", "name", "updatedAt") SELECT "category", "createdAt", "description", "fileName", "fileSize", "fileUrl", "id", "mimeType", "name", "updatedAt" FROM "Document";
DROP TABLE "Document";
ALTER TABLE "new_Document" RENAME TO "Document";
CREATE INDEX "Document_category_idx" ON "Document"("category");
CREATE TABLE "new_JobPosting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "portalSource" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "location" TEXT,
    "remote" BOOLEAN NOT NULL DEFAULT false,
    "requirementsProfile" TEXT,
    "techStack" TEXT,
    "salaryInfo" TEXT,
    "matchScore" INTEGER,
    "isDismissed" BOOLEAN NOT NULL DEFAULT false,
    "dismissReason" TEXT,
    "dismissedAt" DATETIME,
    "postedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "companyId" TEXT,
    CONSTRAINT "JobPosting_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_JobPosting" ("companyId", "createdAt", "description", "id", "location", "matchScore", "portalSource", "postedAt", "remote", "requirementsProfile", "salaryInfo", "sourceUrl", "techStack", "title", "updatedAt") SELECT "companyId", "createdAt", "description", "id", "location", "matchScore", "portalSource", "postedAt", "remote", "requirementsProfile", "salaryInfo", "sourceUrl", "techStack", "title", "updatedAt" FROM "JobPosting";
DROP TABLE "JobPosting";
ALTER TABLE "new_JobPosting" RENAME TO "JobPosting";
CREATE INDEX "JobPosting_portalSource_idx" ON "JobPosting"("portalSource");
CREATE INDEX "JobPosting_companyId_idx" ON "JobPosting"("companyId");
CREATE INDEX "JobPosting_isDismissed_idx" ON "JobPosting"("isDismissed");
CREATE TABLE "new_Preferences" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "fullName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "street" TEXT,
    "postalCode" TEXT,
    "city" TEXT,
    "desiredRole" TEXT NOT NULL DEFAULT 'Fachinformatiker für Anwendungsentwicklung',
    "techStack" TEXT NOT NULL DEFAULT 'TypeScript,JavaScript,CSS,React,Next.js,HTML',
    "preferredLocations" TEXT NOT NULL DEFAULT 'Bonn,Dortmund,Remote',
    "searchRadiusKm" INTEGER NOT NULL DEFAULT 50,
    "remotePreference" TEXT NOT NULL DEFAULT 'HYBRID',
    "minSalary" INTEGER,
    "profileSummary" TEXT,
    "standardCoverLetterBody" TEXT,
    "coverLetterOpeningSentence" TEXT,
    "weeklyGoal" INTEGER NOT NULL DEFAULT 5,
    "minMatchScore" INTEGER NOT NULL DEFAULT 0,
    "excludedCompanies" TEXT,
    "excludedKeywords" TEXT,
    "excludedTechStack" TEXT,
    "aiProvider" TEXT,
    "aiApiKey" TEXT,
    "aiModel" TEXT,
    "portfolioShareToken" TEXT,
    "portfolioTokenExpiresAt" DATETIME,
    "portfolioViewCount" INTEGER NOT NULL DEFAULT 0,
    "portfolioActive" BOOLEAN NOT NULL DEFAULT true,
    "imapHost" TEXT,
    "imapPort" INTEGER,
    "imapUser" TEXT,
    "imapPassword" TEXT,
    "imapFolder" TEXT DEFAULT 'INBOX',
    "imapEnabled" BOOLEAN NOT NULL DEFAULT false,
    "backgroundSchedulerEnabled" BOOLEAN NOT NULL DEFAULT true,
    "lastSchedulerErrorSource" TEXT,
    "lastSchedulerErrorMessage" TEXT,
    "lastSchedulerErrorAt" DATETIME,
    "digestEnabled" BOOLEAN NOT NULL DEFAULT true,
    "lastDigestSentAt" DATETIME,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Preferences" ("city", "desiredRole", "email", "fullName", "id", "minSalary", "phone", "postalCode", "preferredLocations", "profileSummary", "remotePreference", "searchRadiusKm", "street", "techStack", "updatedAt") SELECT "city", "desiredRole", "email", "fullName", "id", "minSalary", "phone", "postalCode", "preferredLocations", "profileSummary", "remotePreference", "searchRadiusKm", "street", "techStack", "updatedAt" FROM "Preferences";
DROP TABLE "Preferences";
ALTER TABLE "new_Preferences" RENAME TO "Preferences";
CREATE UNIQUE INDEX "Preferences_portfolioShareToken_key" ON "Preferences"("portfolioShareToken");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "ApplicationInteraction_applicationId_idx" ON "ApplicationInteraction"("applicationId");

-- CreateIndex
CREATE INDEX "CoverLetterSnippet_title_idx" ON "CoverLetterSnippet"("title");

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");

-- CreateIndex
CREATE INDEX "EmailSuggestion_status_idx" ON "EmailSuggestion"("status");

-- CreateIndex
CREATE INDEX "EmailSuggestion_applicationId_idx" ON "EmailSuggestion"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailSuggestion_applicationId_emailId_key" ON "EmailSuggestion"("applicationId", "emailId");

-- CreateIndex
CREATE INDEX "Application_applicationDate_idx" ON "Application"("applicationDate");

-- CreateIndex
CREATE INDEX "Application_nextStepDate_idx" ON "Application"("nextStepDate");

-- CreateIndex
CREATE INDEX "Application_updatedAt_idx" ON "Application"("updatedAt");
