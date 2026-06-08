import { Router, Response } from 'express';
import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import OpenAI from 'openai';

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OpenAI API key not configured');
  return new OpenAI({ apiKey });
}

// POST generate and save monthly report (can be called by a scheduler)
reportRoutes.post('/generate', async (req, res, next) => {
  try {
    const { clientId, month, year } = req.body;
    if (!clientId || !month || !year) return res.status(400).json({ error: 'clientId, month and year required' });

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const [client, posts, analytics] = await Promise.all([
      prisma.client.findUnique({ where: { id: clientId }, include: { socialAccounts: true } }),
      prisma.calendarEntry.findMany({ where: { clientId, date: { gte: startDate, lte: endDate } } }),
      prisma.analyticsSnapshot.findMany({ where: { clientId, date: { gte: startDate, lte: endDate } }, orderBy: { date: 'asc' } }),
    ]);

    const postedPosts = posts.filter((p) => p.status === 'posted');
    const reelsCount = postedPosts.filter((p) => p.contentType === 'reel').length;
    const storiesCount = postedPosts.filter((p) => p.contentType === 'story').length;
    const postsCount = postedPosts.filter((p) => p.contentType === 'post').length;

    const avgEngagement = analytics.length > 0 ? analytics.reduce((sum, a) => sum + a.engagement, 0) / analytics.length : 0;
    const totalReach = analytics.reduce((sum, a) => sum + a.reach, 0);
    const followerGrowth = analytics.length > 1 ? analytics[analytics.length - 1].followers - analytics[0].followers : 0;

    const prompt = `Write a professional social media monthly report executive summary.

Client: ${client?.name} (${client?.brandName})
Industry: ${client?.industry}
Month: ${new Date(year, month - 1).toLocaleString('default', { month: 'long' })} ${year}

Stats:
- Total posts published (all formats): ${postedPosts.length}
- Feed posts published: ${postsCount}
- Stories published: ${storiesCount}
- Reels published: ${reelsCount}
- Average engagement rate: ${avgEngagement.toFixed(2)}%
- Total reach: ${totalReach.toLocaleString()}
- Follower growth: ${followerGrowth > 0 ? '+' : ''}${followerGrowth}

Write:
1. Executive summary (2-3 sentences)
2. What worked well (3 bullet points)
3. What needs improvement (2 bullet points)
4. Strategy recommendations for next month (3 bullet points)

Be specific and data-driven. Professional agency tone.`;

    const openai = getOpenAI();
    const response = await openai.chat.completions.create({ model: 'gpt-4o', messages: [{ role: 'user', content: prompt }], max_tokens: 600 });
    const summary = response.choices[0].message.content;

    const report = await prisma.report.create({
      data: {
        clientId,
        title: `${new Date(year, month - 1).toLocaleString('default', { month: 'long' })} ${year} Report`,
        month,
        year,
        summary,
        insights: JSON.stringify({}),
        metrics: JSON.stringify({ postedPosts: postedPosts.length, postsCount, storiesCount, reelsCount, avgEngagement, totalReach, followerGrowth }),
      },
    });

    res.status(201).json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
});

export const reportRoutes = Router();

// GET reports for a client
reportRoutes.get('/client/:clientId', async (req, res, next) => {
  try {
    const reports = await prisma.report.findMany({
      where: { clientId: req.params.clientId },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
    res.json({ success: true, data: reports });
  } catch (err) {
    next(err);
  }
});

// POST create report
reportRoutes.post('/', async (req, res, next) => {
  try {
    const { clientId, month, year, summary, insights, metrics } = req.body;

    const report = await prisma.report.create({
      data: {
        clientId,
        title: `${new Date(year, month - 1).toLocaleString('default', { month: 'long' })} ${year} Report`,
        month,
        year,
        summary,
        insights: typeof insights === 'string' ? insights : JSON.stringify(insights),
        metrics: typeof metrics === 'string' ? metrics : JSON.stringify(metrics),
      },
    });

    res.status(201).json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
});

// GET export report as PDF
reportRoutes.get('/:id/pdf', async (req, res: Response, next) => {
  try {
    const report = await prisma.report.findUnique({
      where: { id: req.params.id },
      include: { client: true },
    });

    if (!report) return res.status(404).json({ error: 'Report not found' });

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const filename = `report-${report.id}.pdf`;
    const outputPath = path.join(process.cwd(), '../storage/reports', filename);

    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    // Header
    doc
      .fillColor('#6366f1')
      .fontSize(28)
      .font('Helvetica-Bold')
      .text('SocialPilot', 50, 50);

    doc
      .fillColor('#1a1a2e')
      .fontSize(20)
      .font('Helvetica-Bold')
      .text(report.title, 50, 90);

    doc
      .fillColor('#666')
      .fontSize(12)
      .font('Helvetica')
      .text(`Client: ${report.client.name}`, 50, 120)
      .text(`Brand: ${report.client.brandName}`, 50, 138)
      .text(`Generated: ${new Date().toLocaleDateString()}`, 50, 156);

    doc.moveTo(50, 180).lineTo(545, 180).strokeColor('#e5e7eb').stroke();

    // Metrics
    if (report.metrics) {
      try {
        const metrics = JSON.parse(report.metrics);
        doc.fillColor('#1a1a2e').fontSize(16).font('Helvetica-Bold').text('Performance Overview', 50, 200);

        const metricY = 230;
        const metricItems = [
          ['Posts Published', metrics.postedPosts || 0],
          ['Feed Posts', metrics.postsCount || 0],
          ['Stories', metrics.storiesCount || 0],
          ['Reels', metrics.reelsCount || 0],
          ['Avg Engagement', `${(metrics.avgEngagement || 0).toFixed(2)}%`],
          ['Total Reach', (metrics.totalReach || 0).toLocaleString()],
          ['Follower Growth', `${metrics.followerGrowth > 0 ? '+' : ''}${metrics.followerGrowth || 0}`],
        ];

        metricItems.forEach(([label, value], i) => {
          const x = 50 + (i % 3) * 165;
          const y = metricY + Math.floor(i / 3) * 70;
          doc.fillColor('#f3f4f6').roundedRect(x, y, 150, 55, 5).fill();
          doc.fillColor('#6366f1').fontSize(20).font('Helvetica-Bold').text(String(value), x + 10, y + 8);
          doc.fillColor('#666').fontSize(10).font('Helvetica').text(String(label), x + 10, y + 34);
        });
      } catch {}
    }

    // Summary
    if (report.summary) {
      doc.fillColor('#1a1a2e').fontSize(16).font('Helvetica-Bold').text('AI Executive Summary', 50, 380);
      doc
        .fillColor('#374151')
        .fontSize(11)
        .font('Helvetica')
        .text(report.summary, 50, 405, { width: 495, lineGap: 4 });
    }

    doc.end();

    stream.on('finish', () => {
      res.download(outputPath, filename, () => {
        // Keep file for later
      });
    });
  } catch (err) {
    next(err);
  }
});

// DELETE report
reportRoutes.delete('/:id', async (req, res, next) => {
  try {
    await prisma.report.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});
