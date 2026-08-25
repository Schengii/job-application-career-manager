-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "street" TEXT,
    "postalCode" TEXT,
    "city" TEXT,
    "country" TEXT NOT NULL DEFAULT 'Deutschland',
    "website" TEXT,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "notes" TEXT,
    "tags" TEXT,
    "status" TEXT NOT NULL DEFAULT 'LEAD',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "JobPosting" (
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
    "postedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "companyId" TEXT,
    CONSTRAINT "JobPosting_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "position" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "applicationDate" DATETIME,
    "nextStep" TEXT,
    "nextStepDate" DATETIME,
    "meetingUrl" TEXT,
    "rejectionReason" TEXT,
    "tags" TEXT,
    "notes" TEXT,
    "source" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "companyId" TEXT NOT NULL,
    "jobPostingId" TEXT,
    CONSTRAINT "Application_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Application_jobPostingId_fkey" FOREIGN KEY ("jobPostingId") REFERENCES "JobPosting" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ApplicationStatusEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL,
    "note" TEXT,
    "changedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "applicationId" TEXT NOT NULL,
    CONSTRAINT "ApplicationStatusEvent_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

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
CREATE TABLE "Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "fileName" TEXT,
    "fileUrl" TEXT,
    "mimeType" TEXT,
    "fileSize" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ApplicationDocument" (
    "applicationId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "attachedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("applicationId", "documentId"),
    CONSTRAINT "ApplicationDocument_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ApplicationDocument_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CoverLetter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "applicationId" TEXT NOT NULL,
    CONSTRAINT "CoverLetter_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Preferences" (
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
    "weeklyGoal" INTEGER NOT NULL DEFAULT 5,
    "aiProvider" TEXT,
    "aiApiKey" TEXT,
    "aiModel" TEXT,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "EducationEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "institution" TEXT,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "preferencesId" TEXT NOT NULL DEFAULT 'default',
    CONSTRAINT "EducationEntry_preferencesId_fkey" FOREIGN KEY ("preferencesId") REFERENCES "Preferences" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProjectEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "techStack" TEXT,
    "url" TEXT,
    "role" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "preferencesId" TEXT NOT NULL DEFAULT 'default',
    CONSTRAINT "ProjectEntry_preferencesId_fkey" FOREIGN KEY ("preferencesId") REFERENCES "Preferences" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Company_status_idx" ON "Company"("status");

-- CreateIndex
CREATE INDEX "Company_name_idx" ON "Company"("name");

-- CreateIndex
CREATE INDEX "JobPosting_portalSource_idx" ON "JobPosting"("portalSource");

-- CreateIndex
CREATE INDEX "JobPosting_companyId_idx" ON "JobPosting"("companyId");

-- CreateIndex
CREATE INDEX "Application_companyId_idx" ON "Application"("companyId");

-- CreateIndex
CREATE INDEX "Application_jobPostingId_idx" ON "Application"("jobPostingId");

-- CreateIndex
CREATE INDEX "Application_status_idx" ON "Application"("status");

-- CreateIndex
CREATE INDEX "Application_applicationDate_idx" ON "Application"("applicationDate");

-- CreateIndex
CREATE INDEX "Application_nextStepDate_idx" ON "Application"("nextStepDate");

-- CreateIndex
CREATE INDEX "Application_updatedAt_idx" ON "Application"("updatedAt");

-- CreateIndex
CREATE INDEX "ApplicationStatusEvent_applicationId_idx" ON "ApplicationStatusEvent"("applicationId");

-- CreateIndex
CREATE INDEX "ApplicationInteraction_applicationId_idx" ON "ApplicationInteraction"("applicationId");

-- CreateIndex
CREATE INDEX "Document_category_idx" ON "Document"("category");

-- CreateIndex
CREATE INDEX "ApplicationDocument_documentId_idx" ON "ApplicationDocument"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "CoverLetter_applicationId_key" ON "CoverLetter"("applicationId");

-- CreateIndex
CREATE INDEX "EducationEntry_preferencesId_idx" ON "EducationEntry"("preferencesId");

-- CreateIndex
CREATE INDEX "ProjectEntry_preferencesId_idx" ON "ProjectEntry"("preferencesId");

