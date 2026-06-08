import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import OpenAI from 'openai';
import { prisma } from '../utils/database';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export const aiRoutes = Router();

// Setup multer for screenshot uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.cwd(), '../storage/screenshots');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new AppError('OpenAI API key not configured', 400);
  return new OpenAI({ apiKey });
}

// POST analyze screenshot with Vision API
aiRoutes.post('/review-screenshot', upload.single('screenshot'), async (req, res, next) => {
  try {
    const { clientId, calendarEntryId, contentItemId } = req.body;
    if (!req.file) throw new AppError('No screenshot uploaded', 400);

    const openai = getOpenAI();
    const imageBuffer = fs.readFileSync(req.file.path);
    const base64Image = imageBuffer.toString('base64');
    const mimeType = req.file.mimetype as 'image/jpeg' | 'image/png' | 'image/webp';

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${base64Image}` },
            },
            {
              type: 'text',
              text: `You are a social media content analyst. Analyze this social media post screenshot and return ONLY a JSON object with this exact structure:
{
  "overallScore": <number 0-100>,
  "designScore": <number 0-100>,
  "marketingScore": <number 0-100>,
  "contentScore": <number 0-100>,
  "strengths": [<string>, <string>, <string>],
  "weaknesses": [<string>, <string>, <string>],
  "recommendations": [<string>, <string>, <string>]
}

Evaluate:
- Design: branding, readability, layout, visual hierarchy
- Marketing: hook quality, CTA, engagement potential  
- Content: clarity, relevance, value

Return ONLY the JSON, no other text.`,
            },
          ],
        },
      ],
    });

    const raw = response.choices[0].message.content || '{}';
    let parsed;
    try {
      parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
    } catch {
      throw new AppError('Failed to parse AI response', 500);
    }

    const review = await prisma.aIReview.create({
      data: {
        clientId,
        contentItemId: contentItemId || null,
        calendarEntryId: calendarEntryId || null,
        screenshotPath: req.file.filename,
        overallScore: parsed.overallScore,
        designScore: parsed.designScore,
        marketingScore: parsed.marketingScore,
        contentScore: parsed.contentScore,
        strengths: JSON.stringify(parsed.strengths),
        weaknesses: JSON.stringify(parsed.weaknesses),
        recommendations: JSON.stringify(parsed.recommendations),
        rawResponse: raw,
      },
    });

    res.json({ success: true, data: { ...review, parsed } });
  } catch (err) {
    next(err);
  }
});

// POST AI chat assistant
aiRoutes.post('/chat', async (req, res, next) => {
  try {
    const { message, clientId, history = [] } = req.body;
    const openai = getOpenAI();

    // Gather context from DB
    let context = '';
    if (clientId) {
      const client = await prisma.client.findUnique({
        where: { id: clientId },
        include: { socialAccounts: true },
      });

      const recentAnalytics = await prisma.analyticsSnapshot.findMany({
        where: { clientId },
        orderBy: { date: 'desc' },
        take: 7,
      });

      const recentPosts = await prisma.calendarEntry.findMany({
        where: { clientId },
        orderBy: { date: 'desc' },
        take: 10,
      });

      context = `
CLIENT CONTEXT:
Name: ${client?.name} | Brand: ${client?.brandName} | Industry: ${client?.industry}
Health Score: ${client?.healthScore}/100

RECENT ANALYTICS (last 7 days):
${recentAnalytics.map((a) => `- ${a.date.toISOString().split('T')[0]}: ${a.followers} followers, ${a.engagement.toFixed(2)}% engagement, ${a.reach} reach`).join('\n')}

RECENT CONTENT:
${recentPosts.map((p) => `- ${p.date.toISOString().split('T')[0]}: ${p.contentType} (${p.status})`).join('\n')}
      `.trim();
    }

    const systemPrompt = `You are an expert social media strategist AI assistant for a client management platform. You help social media managers analyze performance, identify trends, and create content strategies.

${context ? `\n${context}\n` : ''}

Be concise, actionable, and data-driven. Format responses clearly with bullet points when listing items.`;

    const messages: any[] = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-10),
      { role: 'user', content: message },
    ];

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      max_tokens: 800,
    });

    const reply = response.choices[0].message.content;
    res.json({ success: true, data: { reply } });
  } catch (err) {
    next(err);
  }
});

// POST generate content ideas
aiRoutes.post('/content-ideas', async (req, res, next) => {
  try {
    const { industry, goal, platform, contentType, clientId, count = 5 } = req.body;
    const openai = getOpenAI();

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: `Generate ${count} creative social media content ideas as JSON array.
Industry: ${industry || 'general'}
Goal: ${goal || 'engagement'}
Platform: ${platform || 'instagram'}
Content Type: ${contentType || 'mixed'}

Return ONLY a JSON array with objects:
[{
  "title": "Idea title",
  "description": "Brief description of the content",
  "contentType": "post|reel|story|carousel",
  "hook": "Opening line/hook",
  "tags": ["tag1", "tag2"]
}]

Make them specific, creative, and immediately actionable.`,
        },
      ],
    });

    const raw = response.choices[0].message.content || '[]';
    let ideas;
    try {
      ideas = JSON.parse(raw.replace(/```json|```/g, '').trim());
    } catch {
      ideas = [];
    }

    // Save to DB
    if (clientId && ideas.length > 0) {
      await prisma.contentIdea.createMany({
        data: ideas.map((idea: any) => ({
          clientId,
          title: idea.title,
          description: idea.description,
          contentType: idea.contentType || contentType || 'post',
          platform: platform || 'instagram',
          industry,
          goal,
          tags: JSON.stringify(idea.tags || []),
        })),
      });
    }

    res.json({ success: true, data: ideas });
  } catch (err) {
    next(err);
  }
});

// POST generate monthly AI report summary
aiRoutes.post('/report-summary', async (req, res, next) => {
  try {
    const { clientId, month, year } = req.body;
    const openai = getOpenAI();

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const [client, posts, analytics] = await Promise.all([
      prisma.client.findUnique({ where: { id: clientId }, include: { socialAccounts: true } }),
      prisma.calendarEntry.findMany({
        where: { clientId, date: { gte: startDate, lte: endDate } },
      }),
      prisma.analyticsSnapshot.findMany({
        where: { clientId, date: { gte: startDate, lte: endDate } },
        orderBy: { date: 'asc' },
      }),
    ]);

    const postedPosts = posts.filter((p) => p.status === 'posted');
    const reelsCount = postedPosts.filter((p) => p.contentType === 'reel').length;
    const avgEngagement =
      analytics.length > 0
        ? analytics.reduce((sum, a) => sum + a.engagement, 0) / analytics.length
        : 0;

    const totalReach = analytics.reduce((sum, a) => sum + a.reach, 0);

    const followerGrowth =
      analytics.length > 1
        ? analytics[analytics.length - 1].followers - analytics[0].followers
        : 0;

    const prompt = `Write a professional social media monthly report executive summary.

Client: ${client?.name} (${client?.brandName})
Industry: ${client?.industry}
Month: ${new Date(year, month - 1).toLocaleString('default', { month: 'long' })} ${year}

Stats:
- Total posts published: ${postedPosts.length}
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

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 600,
    });

    const summary = response.choices[0].message.content;

    res.json({
      success: true,
      data: {
        summary,
        metrics: { postedPosts: postedPosts.length, reelsCount, avgEngagement, totalReach, followerGrowth },
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST analyze competitor
aiRoutes.post('/competitor-analysis', async (req, res, next) => {
  try {
    const { competitorUrl, clientId, platform } = req.body;
    const openai = getOpenAI();

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: `Perform a strategic social media competitor analysis for: ${competitorUrl} on ${platform}.

Return a JSON object:
{
  "contentThemes": ["theme1", "theme2", "theme3"],
  "postingFrequency": "description",
  "engagementPatterns": "description",
  "topFormats": ["format1", "format2"],
  "strengths": ["strength1", "strength2"],
  "gaps": ["gap1", "gap2"],
  "opportunities": ["opp1", "opp2", "opp3"]
}

Return ONLY the JSON.`,
        },
      ],
      max_tokens: 800,
    });

    const raw = response.choices[0].message.content || '{}';
    let analysis;
    try {
      analysis = JSON.parse(raw.replace(/```json|```/g, '').trim());
    } catch {
      analysis = {};
    }

    // Save competitor analysis
    if (clientId) {
      await prisma.competitor.upsert({
        where: {
          id: req.body.competitorId || 'new',
        },
        create: {
          clientId,
          name: competitorUrl,
          platform,
          profileUrl: competitorUrl,
          analysis: JSON.stringify(analysis),
          lastAnalyzed: new Date(),
        },
        update: {
          analysis: JSON.stringify(analysis),
          lastAnalyzed: new Date(),
        },
      });
    }

    res.json({ success: true, data: analysis });
  } catch (err) {
    next(err);
  }
});

// GET saved AI reviews for a client
aiRoutes.get('/reviews/:clientId', async (req, res, next) => {
  try {
    const reviews = await prisma.aIReview.findMany({
      where: { clientId: req.params.clientId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: reviews });
  } catch (err) {
    next(err);
  }
});
