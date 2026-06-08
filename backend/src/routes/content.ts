import { Router } from 'express';
import { prisma } from '../utils/database';

// --- Content Routes ---
export const contentRoutes = Router();

contentRoutes.get('/client/:clientId', async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const { contentType, search } = req.query;
    const where: any = { clientId };
    if (contentType) where.contentType = contentType;
    if (search) where.OR = [
      { title: { contains: search as string } },
      { caption: { contains: search as string } },
    ];
    const items = await prisma.contentItem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { aiReviews: { take: 1 } },
    });
    res.json({ success: true, data: items });
  } catch (err) { next(err); }
});

contentRoutes.post('/', async (req, res, next) => {
  try {
    const item = await prisma.contentItem.create({ data: req.body });
    res.status(201).json({ success: true, data: item });
  } catch (err) { next(err); }
});

contentRoutes.delete('/:id', async (req, res, next) => {
  try {
    await prisma.contentItem.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) { next(err); }
});

// Content Ideas
contentRoutes.get('/ideas/:clientId', async (req, res, next) => {
  try {
    const ideas = await prisma.contentIdea.findMany({
      where: { clientId: req.params.clientId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: ideas });
  } catch (err) { next(err); }
});

contentRoutes.patch('/ideas/:id/save', async (req, res, next) => {
  try {
    const idea = await prisma.contentIdea.update({
      where: { id: req.params.id },
      data: { isSaved: req.body.isSaved },
    });
    res.json({ success: true, data: idea });
  } catch (err) { next(err); }
});

// Competitors
contentRoutes.get('/competitors/:clientId', async (req, res, next) => {
  try {
    const competitors = await prisma.competitor.findMany({
      where: { clientId: req.params.clientId },
      orderBy: { lastAnalyzed: 'desc' },
    });
    res.json({ success: true, data: competitors });
  } catch (err) { next(err); }
});

// --- Notification Routes ---
export const notificationRoutes = Router();

notificationRoutes.get('/', async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { isRead: false },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { client: { select: { name: true } } },
    });
    res.json({ success: true, data: notifications });
  } catch (err) { next(err); }
});

notificationRoutes.patch('/:id/read', async (req, res, next) => {
  try {
    await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true },
    });
    res.json({ success: true });
  } catch (err) { next(err); }
});

notificationRoutes.patch('/read-all', async (req, res, next) => {
  try {
    await prisma.notification.updateMany({ data: { isRead: true } });
    res.json({ success: true });
  } catch (err) { next(err); }
});

// Auto-generate consistency alerts
notificationRoutes.post('/check-consistency', async (req, res, next) => {
  try {
    const clients = await prisma.client.findMany({ where: { isArchived: false } });
    const alerts: any[] = [];

    for (const client of clients) {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentPost = await prisma.calendarEntry.findFirst({
        where: { clientId: client.id, status: 'posted', date: { gte: sevenDaysAgo } },
      });

      if (!recentPost) {
        const existing = await prisma.notification.findFirst({
          where: { clientId: client.id, type: 'missing_content', isRead: false },
        });

        if (!existing) {
          const notification = await prisma.notification.create({
            data: {
              clientId: client.id,
              type: 'missing_content',
              title: 'No Recent Content',
              message: `${client.name} hasn't posted in over 7 days`,
            },
          });
          alerts.push(notification);
        }
      }
    }

    res.json({ success: true, data: alerts });
  } catch (err) { next(err); }
});

// --- Settings Routes ---
export const settingsRoutes = Router();

settingsRoutes.get('/', async (req, res, next) => {
  try {
    const settings = await prisma.appSettings.findMany();
    const obj = Object.fromEntries(settings.map((s) => [s.key, s.value]));
    res.json({ success: true, data: obj });
  } catch (err) { next(err); }
});

settingsRoutes.put('/:key', async (req, res, next) => {
  try {
    const setting = await prisma.appSettings.upsert({
      where: { key: req.params.key },
      create: { key: req.params.key, value: req.body.value },
      update: { value: req.body.value },
    });
    res.json({ success: true, data: setting });
  } catch (err) { next(err); }
});
