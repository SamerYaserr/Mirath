-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CreateTable
CREATE TABLE "Paper" (
    "id" UUID NOT NULL,
    "citation" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "abstract" TEXT NOT NULL,
    "authors" TEXT[],
    "categories" TEXT[],
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "content" JSONB NOT NULL,
    "fullText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Paper_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Paper_citation_key" ON "Paper"("citation");

-- CreateIndex
CREATE INDEX "Paper_publishedAt_idx" ON "Paper"("publishedAt");

-- CreateIndex
CREATE INDEX "Paper_authors_idx" ON "Paper" USING GIN ("authors");

-- CreateIndex
CREATE INDEX "Paper_categories_idx" ON "Paper" USING GIN ("categories");

-- CreateIndex
CREATE INDEX "Paper_fullText_idx" ON "Paper" USING GIN ("fullText" gin_trgm_ops);
