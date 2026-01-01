import * as fs from 'fs';
import * as path from 'path';
import { Paper, Prisma, PrismaClient } from '@prisma/client';

import { winstonLogger as logger } from '../../src/config/logger.config';

// This function returns the research papers file paths
function getPaperFiles(): string[] {
  const papersDir = path.join(__dirname, 'data', 'papers');

  return fs
    .readdirSync(papersDir)
    .filter((file) => file.endsWith('.json'))
    .map((file) => path.join(papersDir, file));
}

// Given a file ... seed all the researches inside this file
// Can't seed all files at once because of memory limits
async function seedPapersFromFile(
  prisma: PrismaClient,
  filePath: string,
): Promise<{ inserted: number; skipped: number }> {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const papers: Paper[] = JSON.parse(fileContent);

  const paperInputs: Prisma.PaperCreateManyInput[] = papers.map((paper) => ({
    citation: paper.citation,
    title: paper.title,
    abstract: paper.abstract,
    authors: paper.authors,
    categories: paper.categories,
    publishedAt: new Date(paper.publishedAt),
    content: paper.content as Prisma.InputJsonValue,
    fullText: paper.fullText,
  }));

  // Get count before insert
  const countBefore = await prisma.paper.count();

  await prisma.paper.createMany({
    data: paperInputs,
    skipDuplicates: true,
  });

  // Some sort of logging to know the number of inserted and skipped documents
  const countAfter = await prisma.paper.count();
  const inserted = countAfter - countBefore;
  const skipped = papers.length - inserted;

  return { inserted, skipped };
}

export async function seedPapers(prisma: PrismaClient) {
  const paperFiles = getPaperFiles();
  logger.info(`Found ${paperFiles.length} paper files to process`);

  let totalInserted = 0;
  let totalSkipped = 0;

  for (let i = 0; i < paperFiles.length; i++) {
    const file = paperFiles[i];

    let result = { inserted: 0, skipped: 0 };
    result = await seedPapersFromFile(prisma, file as string);

    totalInserted += result.inserted;
    totalSkipped += result.skipped;

    logger.info(
      `Processed file ${i + 1}/${paperFiles.length}: ${result.inserted} inserted, ${result.skipped} skipped`,
    );
  }

  logger.info(
    `Papers seeding completed: ${totalInserted} papers inserted, ${totalSkipped} duplicates skipped`,
  );
}
