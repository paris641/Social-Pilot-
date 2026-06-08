import { Router } from 'express';
import { prisma } from '../utils/database';
import { z } from 'zod';

export const analyticsRoutes = Router();

// GET analytics for a client
analyticsRoutes.get('/client/:clientId', async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const { platform, period = '30' } = req.query;

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period as string));

    const where: any = { clientId, date: { gte: daysAgo } };
    if (platform) where.platform = platform;

    const snapshots = await prisma.analyticsSnapshot.findMany({
      where,
      orderBy: { date: 'asc' },
    });

    res.json({ success: true, data: snapshots });
  } catch (err) {
    next(err);
  }
});

// POST add analytics snapshot (manual or from sync)
analyticsRoutes.post('/client/:clientId', async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const snapshot = await prisma.analyticsSnapshot.create({
      data: { clientId, ...req.body },
    });

    // Update client health score
    await updateHealthScore(clientId);

    res.status(201).json({ success: true, data: snapshot });
  } catch (err) {
    next(err);
  }
});

// GET aggregated stats
analyticsRoutes.get('/client/:clientId/summary', async (req, res, next) => {
  try {
    const { clientId } = req.params;

    const latest = await prisma.analyticsSnapshot.findFirst({
      where: { clientId },
      orderBy: { date: 'desc' },
    });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const history = await prisma.analyticsSnapshot.findMany({
      where: { clientId, date: { gte: thirtyDaysAgo } },
      orderBy: { date: 'asc' },
    });

    const avgEngagement =
      history.length > 0
        ? history.reduce((sum, s) => sum + s.engagement, 0) / history.length
        : 0;

    const totalReach = history.reduce((sum, s) => sum + s.reach, 0);

    res.json({
      success: true,
      data: {
        latest,
        history,
        avgEngagement,
        totalReach,
        dataPoints: history.length,
      },
    });
  } catch (err) {
    next(err);
  }
});

// Bulk import analytics (for demo/seeding)
analyticsRoutes.post('/client/:clientId/bulk', async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const { snapshots } = req.body;

    await prisma.analyticsSnapshot.createMany({
      data: snapshots.map((s: any) => ({ ...s, clientId })),
      skipDuplicates: true,
    });

    res.json({ success: true, message: `Imported ${snapshots.length} snapshots` });
  } catch (err) {
    next(err);
  }
});

async function updateHealthScore(clientId: string) {
  const snapshots = await prisma.analyticsSnapshot.findMany({
    where: { clientId },
    orderBy: { date: 'desc' },
    take: 7,
  });

  if (snapshots.length === 0) return;

  const avgEngagement = snapshots.reduce((sum, s) => sum + s.engagement, 0) / snapshots.length;
  const postsThisMonth = await prisma.calendarEntry.count({
    where: {
      clientId,
      date: { gte: new Date(new Date().setDate(1)) },
      status: 'posted',
    },
  });

  // Health score formula
  let score = 50;
  if (avgEngagement > 5) score += 20;
  else if (avgEngagement > 2) score += 10;
  if (postsThisMonth >= 12) score += 20;
  else if (postsThisMonth >= 6) score += 10;
  if (snapshots[0].followers > (snapshots[snapshots.length - 1]?.followers || 0)) score += 10;

  await prisma.client.update({
    where: { id: clientId },
    data: { healthScore: Math.min(100, score) },
  });
}
