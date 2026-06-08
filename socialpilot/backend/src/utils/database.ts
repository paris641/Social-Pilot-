import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { logger } from './logger';

export const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

export async function initDatabase() {
  // Ensure storage directories exist
  const dirs = [
    '../storage/clients',
    '../storage/screenshots',
    '../storage/reports',
    '../storage/exports',
    '../storage/profile-images',
    '../data',
  ];

  for (const dir of dirs) {
    const fullPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      logger.info(`Created directory: ${fullPath}`);
    }
  }

  try {
    await prisma.$connect();
    logger.info('Database connected successfully');
  } catch (error) {
    logger.error('Database connection failed:', error);
    throw error;
  }
}

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
