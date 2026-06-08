import { Router } from 'express';
import { prisma } from '../utils/database';

export const settingsRoutes = Router();

// GET all settings
settingsRoutes.get('/', async (req, res, next) => {
  try {
    const settings = await prisma.appSettings.findMany();
    res.json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
});

// PUT set a setting by key
settingsRoutes.put('/:key', async (req, res, next) => {
  try {
    const key = req.params.key;
    const value = req.body.value;
    if (typeof value === 'undefined') return res.status(400).json({ error: 'value required' });

    const existing = await prisma.appSettings.findUnique({ where: { key } });
    if (existing) {
      const updated = await prisma.appSettings.update({ where: { key }, data: { value } });
      res.json({ success: true, data: updated });
    } else {
      const created = await prisma.appSettings.create({ data: { key, value } });
      res.json({ success: true, data: created });
    }
  } catch (err) {
    next(err);
  }
});
