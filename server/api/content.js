import { getDb } from './_lib/mongodb.js';
import { requireAuth } from './_lib/auth.js';
import { cors } from './_lib/cors.js';
import jwt from 'jsonwebtoken';

// ── GA4 helpers (kept in this file to stay within Vercel 12-function limit) ──
let _ga4Token = null;
let _ga4Exp = 0;

async function ga4Token() {
  const email = process.env.GA4_CLIENT_EMAIL;
  const key = (process.env.GA4_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  if (!email || !key) return null;
  if (_ga4Token && Date.now() < _ga4Exp - 60000) return _ga4Token;
  const now = Math.floor(Date.now() / 1000);
  const assertion = jwt.sign(
    { iss: email, scope: 'https://www.googleapis.com/auth/analytics.readonly', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 },
    key, { algorithm: 'RS256' }
  );
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${assertion}`,
  });
  if (!r.ok) { console.error('GA4 token error:', await r.text()); return null; }
  const d = await r.json();
  _ga4Token = d.access_token;
  _ga4Exp = Date.now() + d.expires_in * 1000;
  return _ga4Token;
}

async function ga4Report(propId, token, body) {
  const r = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propId}:runReport`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) { console.error('GA4 report error:', await r.text()); return null; }
  return r.json();
}

export default async function handler(req, res) {
  if (cors(req, res)) return;

  const action = req.query?.action;

  // ── Heartbeat (POST /api/content?action=heartbeat) — no auth ──
  // Tracks active visitor sessions. Frontend sends every ~30s while tab is visible.
  if (action === 'heartbeat' && req.method === 'POST') {
    try {
      const db = await getDb();
      let body = req.body;
      if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
      const { sessionId: rawSid, path: rawPath } = body || {};
      const sessionId = typeof rawSid === 'string' ? rawSid.slice(0, 64) : null;
      if (!sessionId) return res.status(400).json({ error: 'sessionId required' });
      const path = typeof rawPath === 'string' ? rawPath.slice(0, 200) : '/';
      await db.collection('visitor_sessions').updateOne(
        { sessionId },
        { $set: { sessionId, lastSeen: new Date(), path } },
        { upsert: true }
      );
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error('Heartbeat error:', err);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  }

  // ── Active visitors count (GET /api/content?action=active-visitors) — public ──
  // Counts sessions seen in the last 2 minutes. No auth: safe public metric.
  if (action === 'active-visitors' && req.method === 'GET') {
    try {
      const db = await getDb();
      const cutoff = new Date(Date.now() - 2 * 60 * 1000);
      const count = await db.collection('visitor_sessions').countDocuments({ lastSeen: { $gte: cutoff } });
      // Opportunistic cleanup: remove sessions older than 1 hour
      const purge = new Date(Date.now() - 60 * 60 * 1000);
      db.collection('visitor_sessions').deleteMany({ lastSeen: { $lt: purge } }).catch(() => {});
      return res.status(200).json({ activeUsers: count });
    } catch (err) {
      console.error('Active visitors error:', err);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  }

  // ── Pageview tracking (POST /api/content?action=pageview) — no auth ──
  if (action === 'pageview' && req.method === 'POST') {
    try {
      const db = await getDb();
      let body = req.body;
      if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
      const { path: rawPath, referrer: rawReferrer } = body || {};
      const path = typeof rawPath === 'string' ? rawPath.slice(0, 200) : '/';
      const referrer = typeof rawReferrer === 'string' ? rawReferrer.slice(0, 500) : '';
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

      // Track referrer source with platform-level detail
      let source = 'direct';
      let sourceDetail = null;
      const ref = (referrer || '').toLowerCase();

      if (ref.trim()) {
        if (ref.includes('google.') || ref.includes('/search?') && ref.includes('google')) { source = 'organic'; sourceDetail = 'google'; }
        else if (ref.includes('bing.com')) { source = 'organic'; sourceDetail = 'bing'; }
        else if (ref.includes('yahoo.com')) { source = 'organic'; sourceDetail = 'yahoo'; }
        else if (ref.includes('yandex.')) { source = 'organic'; sourceDetail = 'yandex'; }
        else if (ref.includes('duckduckgo.com')) { source = 'organic'; sourceDetail = 'duckduckgo'; }
        else if (ref.includes('instagram.com') || ref.includes('l.instagram.com')) { source = 'social'; sourceDetail = 'instagram'; }
        else if (ref.includes('tiktok.com') || ref.includes('vm.tiktok.com')) { source = 'social'; sourceDetail = 'tiktok'; }
        else if (ref.includes('facebook.com') || ref.includes('fb.com') || ref.includes('m.facebook.com')) { source = 'social'; sourceDetail = 'facebook'; }
        else if (ref.includes('linkedin.com')) { source = 'social'; sourceDetail = 'linkedin'; }
        else if (ref.includes('twitter.com') || ref.includes('t.co') || ref.includes('x.com')) { source = 'social'; sourceDetail = 'twitter'; }
        else if (ref.includes('youtube.com') || ref.includes('youtu.be')) { source = 'social'; sourceDetail = 'youtube'; }
        else if (ref.includes('whatsapp.com') || ref.includes('wa.me')) { source = 'social'; sourceDetail = 'whatsapp'; }
        else {
          source = 'referral';
          try {
            const u = new URL(referrer.startsWith('http') ? referrer : `https://${referrer}`);
            sourceDetail = u.hostname.replace(/^www\./, '');
          } catch { sourceDetail = referrer.slice(0, 100); }
        }
      }

      await db.collection('traffic_sources').updateOne(
        { date: today, source, detail: sourceDetail },
        { $inc: { count: 1 }, $setOnInsert: { date: today, source, detail: sourceDetail } },
        { upsert: true }
      );

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
      const days = period === 'quarter' ? 90 : period === 'month' ? 30 : 7;
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

      // Traffic sources — grouped with platform-level detail
      const sourceRaw = await db.collection('traffic_sources')
        .aggregate([
          { $match: { date: { $gte: startDate } } },
          { $group: { _id: { source: '$source', detail: '$detail' }, total: { $sum: '$count' } } },
          { $sort: { total: -1 } },
        ])
        .toArray();

      // Group by source, collect details
      const srcGroups = {};
      for (const r of sourceRaw) {
        const src = r._id.source || 'direct';
        const det = r._id.detail || null;
        if (!srcGroups[src]) srcGroups[src] = { total: 0, details: {} };
        srcGroups[src].total += r.total;
        if (det) {
          srcGroups[src].details[det] = (srcGroups[src].details[det] || 0) + r.total;
        }
      }

      const SOURCE_NAMES = { organic: 'Organik Arama', social: 'Sosyal Medya', direct: 'Direkt', referral: 'Referans' };
      const totalSource = Object.values(srcGroups).reduce((s, g) => s + g.total, 0) || 1;

      const sources = Object.entries(srcGroups)
        .sort((a, b) => b[1].total - a[1].total)
        .map(([key, group]) => ({
          name: SOURCE_NAMES[key] || key,
          key,
          count: group.total,
          value: Math.round((group.total / totalSource) * 100),
          details: Object.entries(group.details)
            .sort((a, b) => b[1] - a[1])
            .map(([det, cnt]) => ({ key: det, name: det, count: cnt })),
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

  // ── GA4 Data API (GET /api/content?action=ga4) — auth required ──
  if (action === 'ga4' && req.method === 'GET') {
    const user = requireAuth(req);
    if (!user) return res.status(401).json({ error: 'Yetkisiz erişim' });

    const propertyId = process.env.GA4_PROPERTY_ID;
    if (!propertyId || !process.env.GA4_CLIENT_EMAIL || !process.env.GA4_PRIVATE_KEY) {
      return res.status(200).json({ configured: false, error: 'GA4 yapılandırılmamış' });
    }
    try {
      const token = await ga4Token();
      if (!token) return res.status(200).json({ configured: false, error: 'GA4 token alınamadı' });

      const period = req.query?.period || 'week';
      const days = period === 'quarter' ? 90 : period === 'month' ? 30 : 7;
      const startDate = `${days}daysAgo`;

      const [dailyReport, pageReport, sourceReport, prevReport, activeReport] = await Promise.all([
        ga4Report(propertyId, token, { dateRanges: [{ startDate, endDate: 'today' }], dimensions: [{ name: 'date' }], metrics: [{ name: 'screenPageViews' }], orderBys: [{ dimension: { dimensionName: 'date' } }] }),
        ga4Report(propertyId, token, { dateRanges: [{ startDate, endDate: 'today' }], dimensions: [{ name: 'pagePath' }], metrics: [{ name: 'screenPageViews' }], orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }], limit: 8 }),
        ga4Report(propertyId, token, { dateRanges: [{ startDate, endDate: 'today' }], dimensions: [{ name: 'sessionDefaultChannelGroup' }], metrics: [{ name: 'sessions' }], orderBys: [{ metric: { metricName: 'sessions' }, desc: true }] }),
        ga4Report(propertyId, token, { dateRanges: [{ startDate: `${days * 2}daysAgo`, endDate: `${days + 1}daysAgo` }], metrics: [{ name: 'screenPageViews' }] }),
        ga4Report(propertyId, token, { dateRanges: [{ startDate: 'today', endDate: 'today' }], metrics: [{ name: 'activeUsers' }] }),
      ]);

      const dailyData = (dailyReport?.rows || []).map(r => ({ date: r.dimensionValues[0].value.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'), count: parseInt(r.metricValues[0].value, 10) || 0 }));
      const totalVisits = dailyData.reduce((s, d) => s + d.count, 0);
      const maxPV = parseInt(pageReport?.rows?.[0]?.metricValues?.[0]?.value || '1', 10) || 1;
      const pages = (pageReport?.rows || []).map(r => ({ path: r.dimensionValues[0].value, views: parseInt(r.metricValues[0].value, 10) || 0, percent: Math.round((parseInt(r.metricValues[0].value, 10) / maxPV) * 100) }));
      const srcMap = { 'Organic Search': 'organic', 'Organic Social': 'social', Direct: 'direct', Referral: 'referral', 'Paid Search': 'paid', 'Paid Social': 'paid_social' };
      const srcNames = { organic: 'Organik Arama', social: 'Sosyal Medya', direct: 'Direkt', referral: 'Referans', paid: 'Ücretli Arama', paid_social: 'Ücretli Sosyal' };
      const totalSess = (sourceReport?.rows || []).reduce((s, r) => s + (parseInt(r.metricValues[0].value, 10) || 0), 0) || 1;
      const sources = (sourceReport?.rows || []).map(r => { const n = r.dimensionValues[0].value; const k = srcMap[n] || n.toLowerCase().replace(/\s+/g, '_'); const c = parseInt(r.metricValues[0].value, 10) || 0; return { name: srcNames[k] || n, key: k, count: c, value: Math.round((c / totalSess) * 100) }; });
      const prevTotal = parseInt(prevReport?.rows?.[0]?.metricValues?.[0]?.value || '0', 10);
      const growth = prevTotal > 0 ? Math.round(((totalVisits - prevTotal) / prevTotal) * 100) : null;
      const activeUsers = parseInt(activeReport?.rows?.[0]?.metricValues?.[0]?.value || '0', 10);

      return res.status(200).json({ configured: true, source: 'google_analytics', dailyData, totalVisits, growth, pages, sources, activeUsers, period });
    } catch (err) {
      console.error('GA4 error:', err);
      return res.status(500).json({ error: 'GA4 verisi alınamadı.' });
    }
  }

  // ── Dynamic sitemap (GET /api/content?action=sitemap) — no auth ──
  if (action === 'sitemap' && req.method === 'GET') {
    try {
      const db2 = await getDb();
      const [blogs, partners] = await Promise.all([
        db2.collection('blogs').find({ published: { $ne: false } }, { projection: { slug: 1, updatedAt: 1, createdAt: 1 } }).toArray(),
        db2.collection('partners').find({}, { projection: { slug: 1, updatedAt: 1 } }).toArray(),
      ]);
      const base = 'https://kademedia.com.tr';
      const today = new Date().toISOString().slice(0, 10);
      const staticUrls = [
        { loc: '/', priority: '1.0', freq: 'weekly' },
        { loc: '/hizmetler', priority: '0.9', freq: 'monthly' },
        { loc: '/paketler', priority: '0.9', freq: 'monthly' },
        { loc: '/hakkimizda', priority: '0.8', freq: 'monthly' },
        { loc: '/blog', priority: '0.9', freq: 'weekly' },
        { loc: '/iletisim', priority: '0.8', freq: 'yearly' },
        { loc: '/partnerler', priority: '0.7', freq: 'monthly' },
        { loc: '/kariyer', priority: '0.7', freq: 'monthly' },
        { loc: '/portfolio', priority: '0.7', freq: 'monthly' },
        { loc: '/ekip', priority: '0.6', freq: 'monthly' },
        { loc: '/hizmetler/sosyal-medya-yonetimi', priority: '0.8', freq: 'monthly' },
        { loc: '/hizmetler/icerik-uretimi', priority: '0.8', freq: 'monthly' },
        { loc: '/hizmetler/reklam-yonetimi', priority: '0.8', freq: 'monthly' },
        { loc: '/hizmetler/video-produksiyon', priority: '0.8', freq: 'monthly' },
        { loc: '/hizmetler/strateji-danismanlik', priority: '0.8', freq: 'monthly' },
        { loc: '/basari-hikayeleri', priority: '0.7', freq: 'monthly' },
        { loc: '/roi-hesaplayici', priority: '0.7', freq: 'monthly' },
        { loc: '/kvkk', priority: '0.3', freq: 'yearly' },
        { loc: '/gizlilik', priority: '0.3', freq: 'yearly' },
        { loc: '/cerez-politikasi', priority: '0.3', freq: 'yearly' },
      ];
      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
      for (const u of staticUrls) {
        xml += `  <url>\n    <loc>${base}${u.loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${u.freq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>\n`;
      }
      for (const b of blogs) {
        if (!b.slug) continue;
        const lastmod = (b.updatedAt || b.createdAt || new Date()).toISOString().slice(0, 10);
        xml += `  <url>\n    <loc>${base}/blog/${b.slug}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
      }
      for (const p of partners) {
        if (!p.slug) continue;
        const lastmod = (p.updatedAt || new Date()).toISOString().slice(0, 10);
        xml += `  <url>\n    <loc>${base}/partnerler/${p.slug}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;
      }
      xml += '</urlset>';
      res.setHeader('Content-Type', 'application/xml');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.status(200).send(xml);
    } catch (err) {
      console.error('Sitemap error:', err);
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
