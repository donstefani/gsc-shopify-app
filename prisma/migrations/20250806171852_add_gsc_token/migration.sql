-- CreateTable
CREATE TABLE "gsc_tokens" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "scope" TEXT,
    "tokenType" TEXT,
    "expiryDate" DATETIME NOT NULL,
    "isExpired" BOOLEAN NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "lastUpdated" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
