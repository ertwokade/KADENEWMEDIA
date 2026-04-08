import { requireAuth } from './_lib/auth.js';
import { cors } from './_lib/cors.js';
import jwt from 'jsonwebtoken';

// Google Analytics 4 Data API proxy
// Requires env vars: GA4_PROPERTY_ID, GA4_CLIENT_EMAIL, GA4_PRIVATE_KEY
// Setup: https://developers.google.com/analytics/devguides/reporting/data/v1/quickstart-client-libraries

let cachedToken = null;
let tokenExpiry = 0;

async function getAccessToken() {
  const email = process.env.GA4_CLIENT_EMAIL;
  const key = (process.env.GA4_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  if (!email || !key) return null;

  if (cachedToken && Date.now() < tokenExpiry - 60000) return cachedToken;

  const now = Math.floor(Date.now() / 1000);
  const assertion = jwt.sign(
    {
      iss: email,
      scope: 'https://www.googleapis.com/auth/analytics.readonly',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    },
    key,
    { algorithm: 'RS256' }
  );

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${assertion}`,
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('GA4 token error:', err);
    return null;
  }

  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + data.expires_in * 1000;
  return cachedToken;
}

async function runReport(propertyId, token, body) {
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) {
    const err = await res.text();
    console.error('GA4 report error:', err);
    return null;
  }
  return res.json();
}

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const user = requireAuth(req);
  if (!user) return res.status(401).json({ error: 'Yetkisiz erişim' });

  const propertyId = process.env.GA4_PROPERTY_ID;
  if (!propertyId || !process.env.GA4_CLIENT_EMAIL || !process.env.GA4_PRIVATE_KEY) {
    return res.status(200).json({ configured: false, error: 'GA4 yapılandırılmamış. .env dosyasına GA4_PROPERTY_ID, GA4_CLIENT_EMAIL ve GA4_PRIVATE_KEY ekleyin.' });
  }

  try {
    const token = await getAccessToken();
    if (!token) return res.status(200).json({ configured: false, error: 'GA4 token alınamadı' });

    const period = req.query?.period || 'week';
    const days = period === 'month' ? 30 : 7;
    const startDate = `${days}daysAgo`;

    // 1) Daily pageviews
    const dailyReport = await runReport(propertyId, token, {
      dateRanges: [{ startDate, endDate: 'today' }],
      dimensions: [{ name: 'date' }],
      metrics: [{ name: 'screenPageViews' }],
      orderBys: [{ dimension: { dimensionName: 'date' } }],
    });

    // 2) Page breakdown
    const pageReport = await runReport(propertyId, token, {
      dateRanges: [{ startDate, endDate: 'today' }],
      dimensions: [{ name: 'pagePath' }],
      metrics: [{ name: 'screenPageViews' }],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: 8,
    });

    // 3) Traffic sources
    const sourceReport = await runReport(propertyId, token, {
      dateRanges: [{ startDate, endDate: 'today' }],
      dimensions: [{ name: 'sessionDefaultChannelGroup' }],
      metrics: [{ name: 'sessions' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    });

    // 4) Previous period for growth
    const prevReport = await runReport(propertyId, token, {
      dateRanges: [{ startDate: `${days * 2}daysAgo`, endDate: `${days + 1}daysAgo` }],
      metrics: [{ name: 'screenPageViews' }],
    });

    // 5) Active users (realtime-like — last 30 min uses different API, use daily instead)
    const activeReport = await runReport(propertyId, token, {
      dateRanges: [{ startDate: 'today', endDate: 'today' }],
      metrics: [{ name: 'activeUsers' }],
    });

    // Parse daily data
    const dailyData = (dailyReport?.rows || []).map(row => ({
      date: row.dimensionValues[0].value.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'),
      count: parseInt(row.metricValues[0].value, 10) || 0,
    }));
    const totalVisits = dailyData.reduce((s, d) => s + d.count, 0);

    // Parse pages
    const maxPageViews = parseInt(pageReport?.rows?.[0]?.metricValues?.[0]?.value || '1', 10) || 1;
    const pages = (pageReport?.rows || []).map(row => ({
      path: row.dimensionValues[0].value,
      views: parseInt(row.metricValues[0].value, 10) || 0,
      percent: Math.round((parseInt(row.metricValues[0].value, 10) / maxPageViews) * 100),
    }));

    // Parse sources
    const sourceMap = { 'Organic Search': 'organic', 'Organic Social': 'social', 'Direct': 'direct', 'Referral': 'referral', 'Paid Search': 'paid', 'Paid Social': 'paid_social' };
    const sourceNames = { organic: 'Organik Arama', social: 'Sosyal Medya', direct: 'Direkt', referral: 'Referans', paid: 'Ücretli Arama', paid_social: 'Ücretli Sosyal' };
    const totalSessions = (sourceReport?.rows || []).reduce((s, r) => s + (parseInt(r.metricValues[0].value, 10) || 0), 0) || 1;
    const sources = (sourceReport?.rows || []).map(row => {
      const rawName = row.dimensionValues[0].value;
      const key = sourceMap[rawName] || rawName.toLowerCase().replace(/\s+/g, '_');
      const count = parseInt(row.metricValues[0].value, 10) || 0;
      return {
        name: sourceNames[key] || rawName,
        key,
        count,
        value: Math.round((count / totalSessions) * 100),
      };
    });

    // Growth
    const prevTotal = parseInt(prevReport?.rows?.[0]?.metricValues?.[0]?.value || '0', 10);
    const growth = prevTotal > 0 ? Math.round(((totalVisits - prevTotal) / prevTotal) * 100) : null;

    // Active users today
    const activeUsers = parseInt(activeReport?.rows?.[0]?.metricValues?.[0]?.value || '0', 10);

    return res.status(200).json({
      configured: true,
      source: 'google_analytics',
      dailyData,
      totalVisits,
      growth,
      pages,
      sources,
      activeUsers,
      period,
    });
  } catch (err) {
    console.error('GA4 error:', err);
    return res.status(500).json({ error: 'GA4 verisi alınamadı: ' + err.message });
  }
}
