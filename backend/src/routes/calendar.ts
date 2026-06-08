import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { prisma } from '../utils/database';
import { z } from 'zod';

export const calendarRoutes = Router();

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(process.cwd(), '../storage/screenshots');
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const EntrySchema = z.object({
  clientId: z.string(),
  date: z.string(),
  title: z.string().optional(),
  contentType: z.enum(['post', 'reel', 'story', 'facebook']),
  status: z.enum(['posted', 'pending', 'no-content']).default('pending'),
  postLink: z.string().optional(),
  caption: z.string().optional(),
  notes: z.string().optional(),
});

// GET entries for a client (with month filter)
calendarRoutes.get('/client/:clientId', async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const { month, year } = req.query;

    let where: any = { clientId };

    if (month && year) {
      const startDate = new Date(parseInt(year as string), parseInt(month as string) - 1, 1);
      const endDate = new Date(parseInt(year as string), parseInt(month as string), 0);
      where.date = { gte: startDate, lte: endDate };
    }

    const entries = await prisma.calendarEntry.findMany({
      where,
      orderBy: { date: 'asc' },
      include: { aiReviews: { take: 1, orderBy: { createdAt: 'desc' } } },
    });

    res.json({ success: true, data: entries });
  } catch (err) {
    next(err);
  }
});

// POST create entry
calendarRoutes.post('/', upload.single('screenshot'), async (req, res, next) => {
  try {
    const data = EntrySchema.parse({
      ...req.body,
      date: new Date(req.body.date).toISOString(),
    });

    const entry = await prisma.calendarEntry.create({
      data: {
        ...data,
        date: new Date(data.date),
        screenshotPath: req.file?.filename,
      },
    });

    res.status(201).json({ success: true, data: entry });
  } catch (err) {
    next(err);
  }
});

// PUT update entry
calendarRoutes.put('/:id', upload.single('screenshot'), async (req, res, next) => {
  try {
    const updateData: any = { ...req.body };
    if (req.body.date) updateData.date = new Date(req.body.date);
    if (req.file) updateData.screenshotPath = req.file.filename;

    const entry = await prisma.calendarEntry.update({
      where: { id: req.params.id },
      data: updateData,
    });

    res.json({ success: true, data: entry });
  } catch (err) {
    next(err);
  }
});

// DELETE entry
calendarRoutes.delete('/:id', async (req, res, next) => {
  try {
    await prisma.calendarEntry.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// GET posting consistency stats
calendarRoutes.get('/client/:clientId/consistency', async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const entries = await prisma.calendarEntry.findMany({
      where: { clientId, date: { gte: thirtyDaysAgo } },
    });

    const posted = entries.filter((e) => e.status === 'posted').length;
    const lastPosted = entries
      .filter((e) => e.status === 'posted')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

    const daysSinceLastPost = lastPosted
      ? Math.floor((Date.now() - new Date(lastPosted.date).getTime()) / (1000 * 60 * 60 * 24))
      : null;

    const reelsCount = entries.filter((e) => e.contentType === 'reel' && e.status === 'posted').length;

    const alerts = [];
    if (daysSinceLastPost && daysSinceLastPost > 7) {
      alerts.push({ type: 'warning', message: `No content posted in ${daysSinceLastPost} days` });
    }
    if (reelsCount === 0) {
      alerts.push({ type: 'info', message: 'No reels posted this month' });
    }
    if (posted < 8) {
      alerts.push({ type: 'warning', message: `Only ${posted} posts this month - below recommended frequency` });
    }

    res.json({
      success: true,
      data: { posted, total: entries.length, daysSinceLastPost, reelsCount, alerts },
    });
  } catch (err) {
    next(err);
  }
});
