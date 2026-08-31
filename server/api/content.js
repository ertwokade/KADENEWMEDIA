import { getSupabase, isUniqueViolation } from './_lib/supabase.js';
import { requirePermission } from './_lib/auth.js';
import { cors } from './_lib/cors.js';
import { rateLimitCheck } from './_lib/rateLimit.js';
import jwt from 'jsonwebtoken';

// Site yöneticisinin kod değiştirmeden güncellediği içerik bölümleri.
// Listeyi merkezi tutmak hem yazım hatasıyla ölü kayıt oluşmasını hem de
// public GET /api/content çağrısının takvim gibi iç verileri sızdırmasını
// engeller.
export const CONTENT_SECTIONS = new Set([
  'homepage', 'hero', 'stats', 'services', 'faq', 'testimonials', 'packages',
  'priceCalculator', 'about', 'footer', 'careers', 'basin', 'nedenBiz',
  'tesekkur', 'referralProgram', 'podcastWebinar', 'caseStudies',
  'newsletterArchive', 'calendar', 'portfolio', 'site-settings',
]);

export const PUBLIC_CONTENT_SECTIONS = new Set([
  'homepage', 'hero', 'stats', 'services', 'faq', 'testimonials', 'packages',
  'about', 'footer', 'careers', 'tesekkur', 'caseStudies', 'portfolio',
]);

export function isKnownContentSection(section) {
  return typeof section === 'string' && CONTENT_SECTIONS.has(section);
}

export function isPublicContentSection(section) {
  return typeof section === 'string' && PUBLIC_CONTENT_SECTIONS.has(section);
}

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
    const rl = await rateLimitCheck(req, { namespace: 'content-heartbeat', windowMs: 60 * 1000, maxRequests: 30 });
    if (!rl.allowed) return res.status(204).end();

    try {
      const supabase = getSupabase();
      let body = req.body;
      if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
      const { sessionId: rawSid, path: rawPath } = body || {};
      const sessionId = typeof rawSid === 'string' ? rawSid.slice(0, 64) : null;
      if (!sessionId) return res.status(400).json({ error: 'sessionId required' });
      const path = typeof rawPath === 'string' ? rawPath.slice(0, 200) : '/';
      const { error } = await supabase.from('kade_visitor_sessions').upsert(
        { session_id: sessionId, last_seen: new Date().toISOString(), path },
        { onConflict: 'session_id' }
      );
      if (error) throw error;
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error('Heartbeat error:', err);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  }

  // ── Active visitors count (GET /api/content?action=active-visitors) — public ──
  // Counts sessions seen in the last 2 minutes. No auth: safe public metric.
  if (action === 'active-visitors' && req.method === 'GET') {
    const rl = await rateLimitCheck(req, { namespace: 'content-active-visitors', windowMs: 60 * 1000, maxRequests: 60 });
    if (!rl.allowed) return res.status(429).json({ error: `Çok fazla istek. ${rl.retryAfter} dakika sonra tekrar deneyin.` });

    try {
      const supabase = getSupabase();
      const cutoff = new Date(Date.now() - 45 * 1000).toISOString();
      const { count, error } = await supabase
        .from('kade_visitor_sessions')
        .select('*', { count: 'exact', head: true })
        .gte('last_seen', cutoff);
      if (error) throw error;
      // Opportunistic cleanup: remove sessions older than 1 hour (fire-and-forget)
      const purge = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      supabase.from('kade_visitor_sessions').delete().lt('last_seen', purge).then(() => {}, () => {});
      return res.status(200).json({ activeUsers: count || 0 });
    } catch (err) {
      console.error('Active visitors error:', err);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  }

  // ── AI usage stats (GET /api/content?action=ai-usage) — auth required ──
  if (action === 'ai-usage' && req.method === 'GET') {
    if (!(await requirePermission(req, res, ['aiContent', 'content']))) return;
    try {
      const supabase = getSupabase();
      const now = Date.now();
      const startOfDay = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
      const startOfMinute = new Date(now - 60 * 1000).toISOString();
      const startOf30d = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();

      const [todayRes, lastMinuteRes, total30dRes, tokensRes] = await Promise.all([
        supabase.from('kadexai_usage').select('*', { count: 'exact', head: true }).gte('created_at', startOfDay),
        supabase.from('kadexai_usage').select('*', { count: 'exact', head: true }).gte('created_at', startOfMinute),
        supabase.from('kadexai_usage').select('*', { count: 'exact', head: true }).gte('created_at', startOf30d),
        supabase.from('kadexai_usage').select('total_tokens').gte('created_at', startOfDay),
      ]);
      if (todayRes.error) throw todayRes.error;
      if (lastMinuteRes.error) throw lastMinuteRes.error;
      if (total30dRes.error) throw total30dRes.error;
      if (tokensRes.error) throw tokensRes.error;

      const tokensToday = (tokensRes.data || []).reduce((sum, row) => sum + (row.total_tokens || 0), 0);

      return res.status(200).json({
        today: todayRes.count || 0,
        lastMinute: lastMinuteRes.count || 0,
        last30Days: total30dRes.count || 0,
        tokensToday,
        limits: { rpm: 10, rpd: 250, tier: 'free' },
      });
    } catch (err) {
      console.error('AI usage error:', err);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  }

  // ── Pageview tracking (POST /api/content?action=pageview) — no auth ──
  if (action === 'pageview' && req.method === 'POST') {
    const rl = await rateLimitCheck(req, { namespace: 'content-pageview', windowMs: 60 * 1000, maxRequests: 60 });
    if (!rl.allowed) return res.status(204).end();

    try {
      const supabase = getSupabase();
      let body = req.body;
      if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
      const { path: rawPath, referrer: rawReferrer } = body || {};
      const path = typeof rawPath === 'string' ? rawPath.slice(0, 200) : '/';
      const referrer = typeof rawReferrer === 'string' ? rawReferrer.slice(0, 500) : '';
      const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      const finalPath = path || '/';

      // Increment daily counter for this path (read-then-write — low traffic, no RPC needed)
      const { data: existingPv, error: pvSelectErr } = await supabase
        .from('kade_pageviews')
        .select('id, count')
        .eq('date', today)
        .eq('path', finalPath)
        .maybeSingle();
      if (pvSelectErr) throw pvSelectErr;
      if (existingPv) {
        const { error: pvUpdateErr } = await supabase
          .from('kade_pageviews')
          .update({ count: (existingPv.count || 0) + 1, updated_at: new Date().toISOString() })
          .eq('id', existingPv.id);
        if (pvUpdateErr) throw pvUpdateErr;
      } else {
        const { error: pvInsertErr } = await supabase
          .from('kade_pageviews')
          .insert({ date: today, path: finalPath, count: 1, updated_at: new Date().toISOString() });
        // (date, path) unique — eşzamanlı iki ziyaret aynı satırı yaratmaya
        // çalıştığında ikincisi reddedilir; bu bir hata değil.
        if (pvInsertErr && !isUniqueViolation(pvInsertErr)) throw pvInsertErr;
      }

      // Track referrer source with platform-level detail.
      // NOT: kade_traffic_sources.detail kolonu şemada `TEXT NOT NULL DEFAULT ''`.
      // Buranın varsayılanı `null` iken referrer'sız (doğrudan) her ziyaret
      // not-null ihlaliyle 500 üretiyordu — yani sitedeki gezinmelerin çoğu.
      // Boş string hem şemaya hem unique index'e (date, source, detail) uyar.
      let source = 'direct';
      let sourceDetail = '';
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

      const { data: existingTs, error: tsSelectErr } = await supabase
        .from('kade_traffic_sources')
        .select('id, count')
        .eq('date', today)
        .eq('source', source)
        .eq('detail', sourceDetail)
        .maybeSingle();
      if (tsSelectErr) throw tsSelectErr;
      if (existingTs) {
        const { error: tsUpdateErr } = await supabase
          .from('kade_traffic_sources')
          .update({ count: (existingTs.count || 0) + 1 })
          .eq('id', existingTs.id);
        if (tsUpdateErr) throw tsUpdateErr;
      } else {
        const { error: tsInsertErr } = await supabase
          .from('kade_traffic_sources')
          .insert({ date: today, source, detail: sourceDetail, count: 1 });
        // Eşzamanlı iki ziyaret aynı (date, source, detail) satırını yaratmaya
        // çalışabilir; unique index ikincisini reddeder. Sayaç bir tık eksik
        // kalır ama bu, isteği hataya düşürmekten iyidir.
        if (tsInsertErr && !isUniqueViolation(tsInsertErr)) throw tsInsertErr;
      }

      return res.status(200).json({ ok: true });
    } catch (err) {
      // Ziyaretçi analitiği "best-effort"tür: sayfanın çalışmasıyla ilgisi yok.
      // 500 döndürmek her ziyaretçinin konsoluna hata basıyordu. Hata sunucu
      // logunda tam olarak kalır; istemciye kaydedilmediği bilgisi gider.
      console.error('Pageview error:', err);
      return res.status(202).json({ ok: false, recorded: false });
    }
  }

  // ── Analytics summary (GET /api/content?action=analytics) — auth required ──
  if (action === 'analytics' && req.method === 'GET') {
    if (!(await requirePermission(req, res, ['analytics', 'dashboard']))) return;

    try {
      const supabase = getSupabase();
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

      // Raw pageview rows for the period — aggregation done in JS (low volume, no SQL needed)
      const { data: pvRows, error: pvErr } = await supabase
        .from('kade_pageviews')
        .select('date, path, count')
        .gte('date', startDate);
      if (pvErr) throw pvErr;

      // Daily totals
      const dailyMap = {};
      (pvRows || []).forEach(r => { dailyMap[r.date] = (dailyMap[r.date] || 0) + (r.count || 0); });
      const dailyData = dates.map(d => ({ date: d, count: dailyMap[d] || 0 }));

      // Total visits in period
      const totalVisits = dailyData.reduce((s, d) => s + d.count, 0);

      // Page breakdown
      const pageMap = {};
      (pvRows || []).forEach(r => { pageMap[r.path] = (pageMap[r.path] || 0) + (r.count || 0); });
      const pageRaw = Object.entries(pageMap)
        .map(([path, total]) => ({ _id: path, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 8);

      // Traffic sources — grouped with platform-level detail
      const { data: tsRows, error: tsErr } = await supabase
        .from('kade_traffic_sources')
        .select('source, detail, count')
        .gte('date', startDate);
      if (tsErr) throw tsErr;

      const sourceMap = new Map();
      (tsRows || []).forEach(r => {
        const key = JSON.stringify([r.source, r.detail]);
        sourceMap.set(key, (sourceMap.get(key) || 0) + (r.count || 0));
      });
      const sourceRaw = Array.from(sourceMap.entries())
        .map(([key, total]) => {
          const [srcKey, detail] = JSON.parse(key);
          return { _id: { source: srcKey, detail }, total };
        })
        .sort((a, b) => b.total - a.total);

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

      const { data: prevRows, error: prevErr } = await supabase
        .from('kade_pageviews')
        .select('count')
        .gte('date', prevStartStr)
        .lt('date', prevEndStr);
      if (prevErr) throw prevErr;
      const prevTotal = (prevRows || []).reduce((s, r) => s + (r.count || 0), 0);
      const growth = prevTotal > 0 ? Math.round(((totalVisits - prevTotal) / prevTotal) * 100) : null;

      return res.status(200).json({ dailyData, totalVisits, growth, pages, sources, period });
    } catch (err) {
      console.error('Analytics error:', err);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  }

  // ── GA4 Data API (GET /api/content?action=ga4) — auth required ──
  if (action === 'ga4' && req.method === 'GET') {
    if (!(await requirePermission(req, res, ['analytics', 'dashboard']))) return;

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
      const supabase2 = getSupabase();
      const [blogsRes, partnersRes] = await Promise.all([
        supabase2.from('kade_blogs').select('slug, updated_at, created_at').or('published.is.null,published.eq.true'),
        supabase2.from('kade_partners').select('slug, updated_at'),
      ]);
      if (blogsRes.error) throw blogsRes.error;
      if (partnersRes.error) throw partnersRes.error;
      const blogs = blogsRes.data || [];
      const partners = partnersRes.data || [];
      const base = 'https://kadenewmedia.com';
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
        { loc: '/sss', priority: '0.6', freq: 'monthly' },
        { loc: '/referanslar', priority: '0.6', freq: 'monthly' },
        { loc: '/teklif-al', priority: '0.8', freq: 'monthly' },
        { loc: '/kvkk', priority: '0.3', freq: 'yearly' },
        { loc: '/gizlilik', priority: '0.3', freq: 'yearly' },
        { loc: '/cerez-politikasi', priority: '0.3', freq: 'yearly' },
        { loc: '/telif-haklari', priority: '0.3', freq: 'yearly' },
      ];
      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
      for (const u of staticUrls) {
        xml += `  <url>\n    <loc>${base}${u.loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${u.freq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>\n`;
      }
      for (const b of blogs) {
        if (!b.slug) continue;
        const lastmod = String(b.updated_at || b.created_at || new Date().toISOString()).slice(0, 10);
        xml += `  <url>\n    <loc>${base}/blog/${b.slug}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
      }
      for (const p of partners) {
        if (!p.slug) continue;
        const lastmod = String(p.updated_at || new Date().toISOString()).slice(0, 10);
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

  const supabase = getSupabase();

  // GET - Get site content (public)
  if (req.method === 'GET') {
    try {
      const section = req.query.section;
      if (section) {
        if (!isKnownContentSection(section)) {
          return res.status(400).json({ error: 'Geçersiz içerik bölümü' });
        }
        if (!isPublicContentSection(section)) {
          if (!(await requirePermission(req, res, 'content'))) return;
        }
        const { data: content, error } = await supabase
          .from('kade_site_content')
          .select('*')
          .eq('section', section)
          .maybeSingle();
        if (error) throw error;
        return res.status(200).json(content || { section, data: {} });
      }
      // Bölümsüz liste yalnız admin içerik ekranı içindir. Önceden anonim
      // çağrı calendar/portfolio dâhil tüm satırları dökebiliyordu.
      if (!(await requirePermission(req, res, 'content'))) return;
      const { data: allContent, error } = await supabase.from('kade_site_content').select('*');
      if (error) throw error;
      return res.status(200).json(allContent);
    } catch (error) {
      console.error('Content GET error:', error);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  }

  // PUT - Update site content (requires auth)
  if (req.method === 'PUT') {
    if (!(await requirePermission(req, res, 'content', { write: true }))) return;

    try {
      const { section, data } = req.body;

      if (!isKnownContentSection(section)) {
        return res.status(400).json({ error: 'Geçersiz içerik bölümü' });
      }
      if (!data || typeof data !== 'object' || Array.isArray(data)) {
        return res.status(400).json({ error: 'Section ve data gerekli' });
      }

      const { error } = await supabase
        .from('kade_site_content')
        .upsert({ section, data, updated_at: new Date().toISOString() }, { onConflict: 'section' });
      if (error) throw error;

      return res.status(200).json({ message: 'İçerik güncellendi' });
    } catch (error) {
      console.error('Content PUT error:', error);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
