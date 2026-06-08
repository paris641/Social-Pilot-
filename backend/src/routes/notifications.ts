import { Router } from 'express';
import { prisma } from '../utils/database';

export const notificationRoutes = Router();

// GET all notifications
notificationRoutes.get('/', async (req, res, next) => {
  try {
    const notifs = await prisma.notification.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: notifs });
  } catch (err) {
    next(err);
  }
});

// PATCH mark single as read
notificationRoutes.patch('/:id/read', async (req, res, next) => {
  try {
    await prisma.notification.update({ where: { id: req.params.id }, data: { isRead: true } });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// PATCH mark all read
notificationRoutes.patch('/read-all', async (req, res, next) => {
  try {
    await prisma.notification.updateMany({ where: { isRead: false }, data: { isRead: true } });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// POST check-consistency - stub, returns current notifications
notificationRoutes.post('/check-consistency', async (req, res, next) => {
  try {
    // Placeholder: advanced checks can be added here
    const notifs = await prisma.notification.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: notifs });
  } catch (err) {
    next(err);
  }
});
