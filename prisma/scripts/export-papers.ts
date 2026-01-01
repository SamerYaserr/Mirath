import * as fs from 'fs';
import * as path from 'path';

import { Paper } from '@prisma/client';
import { prisma } from '../prisma-client';
import { winstonLogger as logger } from '../../src/config/logger.config';

const PAPERS_PER_FILE = 40;
const OUTPUT_DIR = path.join(__dirname, 'exported-papers');

async function exportPapers() {
  logger.info('Starting paper export...');

  // If no output directory ... create one
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const totalPapers = await prisma.paper.count();
  logger.info(`Total papers in database: ${totalPapers}`);

  const totalFiles = Math.ceil(totalPapers / PAPERS_PER_FILE);
  logger.info(
    `Will create ${totalFiles} files with ${PAPERS_PER_FILE} papers each`,
  );

  let exportedCount = 0;
  let fileNumber = 1;
  let cursor: string | undefined = undefined;

  while (exportedCount < totalPapers) {
    // Use cursor-based pagination ... no duplications
    const papers: Paper[] = await prisma.paper.findMany({
      take: PAPERS_PER_FILE,
      ...(cursor && { skip: 1, cursor: { id: cursor } }),
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });

    if (!papers || papers.length === 0) break;

    // Update cursor
    cursor = papers[papers.length - 1]?.id;

    // Write to file
    const fileName = `papers-${fileNumber}.json`;
    const filePath = path.join(OUTPUT_DIR, fileName);

    fs.writeFileSync(filePath, JSON.stringify(papers, null, 2), 'utf-8');

    logger.info(
      `Created ${fileName} with ${papers.length} papers (${exportedCount + papers.length}/${totalPapers})`,
    );

    exportedCount += papers.length;
    fileNumber++;
  }

  logger.info(`\nExport completed :)`);
  logger.info(`Total papers exported: ${exportedCount}`);
  logger.info(`Total files created: ${fileNumber - 1}`);
  logger.info(`Output directory: ${OUTPUT_DIR}`);
}

exportPapers()
  .catch((error) => {
    logger.error('Error exporting papers:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
