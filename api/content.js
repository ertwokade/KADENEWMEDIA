import { getDb } from './_lib/mongodb.js';
import { requireAuth } from './_lib/auth.js';
import { cors } from './_lib/cors.js';

export default async function handler(req, res) {
  if (cors(req, res)) return;

  const action = req.query?.action;

  // ── Pageview tracking (POST /api/content?action=pageview) — no auth ──
  if (action === 'pageview' && req.method === 'POST') {
    try {
      const db = await getDb();
      let body = req.body;
      if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
      const { path, referrer } = body || {};
      const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

      // Increment daily counter for this path
      await db.collection('pageviews').updateOne(
        { date: today, path: path || '/' },
        {
          $inc: { count: 1 },
          $setOnInsert: { date: today, path: path || '/' },
          $set: { updatedAt: new Date() },
        },
        { upsert: true }
      );

      // Track referrer source
      if (referrer) {
        let source = 'direct';
        if (referrer.includes('google') || referrer.includes('bing') || referrer.includes('yahoo')) source = 'organic';
        else if (referrer.includes('instagram') || referrer.includes('facebook') || referrer.includes('twitter') || referrer.includes('tiktok') || referrer.includes('linkedin')) source = 'social';
        else if (referrer.trim()) source = 'referral';

        await db.collection('traffic_sources').updateOne(
          { date: today, source },
          { $inc: { count: 1 }, $setOnInsert: { date: today, source } },
          { upsert: true }
        );
      } else {
        await db.collection('traffic_sources').updateOne(
          { date: today, source: 'direct' },
          { $inc: { count: 1 }, $setOnInsert: { date: today, source: 'direct' } },
          { upsert: true }
        );
      }

      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error('Pageview error:', err);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  }

  // ── Analytics summary (GET /api/content?action=analytics) — auth required ──
  if (action === 'analytics' && req.method === 'GET') {
    const user = requireAuth(req);
    if (!user) return res.status(401).json({ error: 'Yetkisiz erişim' });

    try {
      const db = await getDb();
      const period = req.query?.period || 'week';

      // Build date range
      const now = new Date();
      const days = period === 'month' ? 30 : 7;
      const dates = [];
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        dates.push(d.toISOString().slice(0, 10));
      }
      const startDate = dates[0];

      // Daily totals
      const dailyRaw = await db.collection('pageviews')
        .aggregate([
          { $match: { date: { $gte: startDate } } },
          { $group: { _id: '$date', total: { $sum: '$count' } } },
          { $sort: { _id: 1 } },
        ])
        .toArray();

      const dailyMap = {};
      dailyRaw.forEach(d => { dailyMap[d._id] = d.total; });
      const dailyData = dates.map(d => ({ date: d, count: dailyMap[d] || 0 }));

      // Total visits in period
      const totalVisits = dailyData.reduce((s, d) => s + d.count, 0);

      // Page breakdown
      const pageRaw = await db.collection('pageviews')
        .aggregate([
          { $match: { date: { $gte: startDate } } },
          { $group: { _id: '$path', total: { $sum: '$count' } } },
          { $sort: { total: -1 } },
          { $limit: 8 },
        ])
        .toArray();

      // Traffic sources
      const sourceRaw = await db.collection('traffic_sources')
        .aggregate([
          { $match: { date: { $gte: startDate } } },
          { $group: { _id: '$source', total: { $sum: '$count' } } },
          { $sort: { total: -1 } },
        ])
        .toArray();

      const totalSource = sourceRaw.reduce((s, r) => s + r.total, 0) || 1;
      const sources = sourceRaw.map(s => ({
        name: { organic: 'Organik', social: 'Sosyal Medya', direct: 'Direkt', referral: 'Referans' }[s._id] || s._id,
        key: s._id,
        value: Math.round((s.total / totalSource) * 100),
        count: s.total,
      }));

      const maxPage = pageRaw[0]?.total || 1;
      const pages = pageRaw.map(p => ({
        path: p._id,
        views: p.total,
        percent: Math.round((p.total / maxPage) * 100),
      }));

      // Previous period for comparison
      const prevStart = new Date(now);
      prevStart.setDate(prevStart.getDate() - days * 2);
      const prevEnd = new Date(now);
      prevEnd.setDate(prevEnd.getDate() - days);
      const prevStartStr = prevStart.toISOString().slice(0, 10);
      const prevEndStr = prevEnd.toISOString().slice(0, 10);

      const prevRaw = await db.collection('pageviews')
        .aggregate([
          { $match: { date: { $gte: prevStartStr, $lt: prevEndStr } } },
          { $group: { _id: null, total: { $sum: '$count' } } },
        ])
        .toArray();
      const prevTotal = prevRaw[0]?.total || 0;
      const growth = prevTotal > 0 ? Math.round(((totalVisits - prevTotal) / prevTotal) * 100) : null;

      return res.status(200).json({ dailyData, totalVisits, growth, pages, sources, period });
    } catch (err) {
      console.error('Analytics error:', err);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  }

  const db = await getDb();
  const collection = db.collection('siteContent');

  // GET - Get site content (public)
  if (req.method === 'GET') {
    try {
      const section = req.query.section;
      if (section) {
        const content = await collection.findOne({ section });
        return res.status(200).json(content || { section, data: {} });
      }
      const allContent = await collection.find({}).toArray();
      return res.status(200).json(allContent);
    } catch (error) {
      console.error('Content GET error:', error);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  }

  // PUT - Update site content (requires auth)
  if (req.method === 'PUT') {
    const user = requireAuth(req);
    if (!user) {
      return res.status(401).json({ error: 'Yetkisiz erişim' });
    }

    try {
      const { section, data } = req.body;

      if (!section || !data) {
        return res.status(400).json({ error: 'Section ve data gerekli' });
      }

      await collection.updateOne(
        { section },
        {
          $set: {
            section,
            data,
            updatedAt: new Date()
          },
          $setOnInsert: { createdAt: new Date() }
        },
        { upsert: true }
      );

      return res.status(200).json({ message: 'İçerik güncellendi' });
    } catch (error) {
      console.error('Content PUT error:', error);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
