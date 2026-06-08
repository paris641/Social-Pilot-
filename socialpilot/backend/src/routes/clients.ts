import { Router } from 'express';
import { prisma } from '../utils/database';
import { AppError } from '../middleware/errorHandler';
import { z } from 'zod';

export const clientRoutes = Router();

const ClientSchema = z.object({
  name: z.string().min(1),
  brandName: z.string().min(1),
  industry: z.string().optional(),
  contactPerson: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  instagramUrl: z.string().optional(),
  facebookUrl: z.string().optional(),
  notes: z.string().optional(),
  brandGuidelines: z.string().optional(),
});

// GET all clients
clientRoutes.get('/', async (req, res, next) => {
  try {
    const clients = await prisma.client.findMany({
      where: { isArchived: false },
      include: {
        socialAccounts: true,
        _count: { select: { calendarEntries: true, contentLibrary: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Enrich with stats
    const enriched = await Promise.all(
      clients.map(async (client) => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const postsThisMonth = await prisma.calendarEntry.count({
          where: {
            clientId: client.id,
            date: { gte: startOfMonth },
            status: 'posted',
          },
        });

        const latestEntry = await prisma.calendarEntry.findFirst({
          where: { clientId: client.id, status: 'posted' },
          orderBy: { date: 'desc' },
        });

        const latestAnalytics = await prisma.analyticsSnapshot.findFirst({
          where: { clientId: client.id },
          orderBy: { date: 'desc' },
        });

        return {
          ...client,
          postsThisMonth,
          lastPostDate: latestEntry?.date || null,
          engagement: latestAnalytics?.engagement || 0,
          reach: latestAnalytics?.reach || 0,
        };
      })
    );

    res.json({ success: true, data: enriched });
  } catch (err) {
    next(err);
  }
});

// GET single client
clientRoutes.get('/:id', async (req, res, next) => {
  try {
    const client = await prisma.client.findUnique({
      where: { id: req.params.id },
      include: {
        socialAccounts: true,
        _count: {
          select: {
            calendarEntries: true,
            contentLibrary: true,
            aiReviews: true,
            reports: true,
          },
        },
      },
    });

    if (!client) throw new AppError('Client not found', 404);
    res.json({ success: true, data: client });
  } catch (err) {
    next(err);
  }
});

// POST create client
clientRoutes.post('/', async (req, res, next) => {
  try {
    const data = ClientSchema.parse(req.body);

    const client = await prisma.client.create({
      data: {
        ...data,
        healthScore: 50,
      },
    });

    // Auto-create social account records
    if (data.instagramUrl) {
      const username = extractUsername(data.instagramUrl, 'instagram');
      await prisma.socialAccount.create({
        data: {
          clientId: client.id,
          platform: 'instagram',
          username,
          profileUrl: data.instagramUrl,
        },
      });
    }

    if (data.facebookUrl) {
      const username = extractUsername(data.facebookUrl, 'facebook');
      await prisma.socialAccount.create({
        data: {
          clientId: client.id,
          platform: 'facebook',
          username,
          profileUrl: data.facebookUrl,
        },
      });
    }

    res.status(201).json({ success: true, data: client });
  } catch (err) {
    next(err);
  }
});

// PUT update client
clientRoutes.put('/:id', async (req, res, next) => {
  try {
    const data = ClientSchema.partial().parse(req.body);

    const client = await prisma.client.update({
      where: { id: req.params.id },
      data,
    });

    res.json({ success: true, data: client });
  } catch (err) {
    next(err);
  }
});

// PATCH archive client
clientRoutes.patch('/:id/archive', async (req, res, next) => {
  try {
    const client = await prisma.client.update({
      where: { id: req.params.id },
      data: { isArchived: true },
    });
    res.json({ success: true, data: client });
  } catch (err) {
    next(err);
  }
});

// DELETE client
clientRoutes.delete('/:id', async (req, res, next) => {
  try {
    await prisma.client.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Client deleted' });
  } catch (err) {
    next(err);
  }
});

// GET client dashboard stats
clientRoutes.get('/:id/dashboard', async (req, res, next) => {
  try {
    const { id } = req.params;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [postsThisMonth, postsLastMonth, latestAnalytics, prevAnalytics, recentPosts] =
      await Promise.all([
        prisma.calendarEntry.count({
          where: { clientId: id, date: { gte: startOfMonth }, status: 'posted' },
        }),
        prisma.calendarEntry.count({
          where: {
            clientId: id,
            date: { gte: lastMonth, lte: endOfLastMonth },
            status: 'posted',
          },
        }),
        prisma.analyticsSnapshot.findFirst({
          where: { clientId: id },
          orderBy: { date: 'desc' },
        }),
        prisma.analyticsSnapshot.findFirst({
          where: { clientId: id, date: { lte: endOfLastMonth } },
          orderBy: { date: 'desc' },
        }),
        prisma.calendarEntry.findMany({
          where: { clientId: id },
          orderBy: { date: 'desc' },
          take: 10,
        }),
      ]);

    const analyticsHistory = await prisma.analyticsSnapshot.findMany({
      where: { clientId: id },
      orderBy: { date: 'asc' },
      take: 30,
    });

    res.json({
      success: true,
      data: {
        postsThisMonth,
        postsLastMonth,
        followerGrowth: latestAnalytics
          ? latestAnalytics.followers - (prevAnalytics?.followers || 0)
          : 0,
        engagement: latestAnalytics?.engagement || 0,
        reach: latestAnalytics?.reach || 0,
        recentPosts,
        analyticsHistory,
      },
    });
  } catch (err) {
    next(err);
  }
});

function extractUsername(url: string, platform: string): string {
  try {
    const u = new URL(url);
    const parts = u.pathname.split('/').filter(Boolean);
    return parts[0] || '';
  } catch {
    return url;
  }
}
