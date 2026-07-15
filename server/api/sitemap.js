const BASE = 'https://www.kademedia.com.tr';

const STATIC_PAGES = [
  { loc: '/', changefreq: 'weekly', priority: '1.0' },
  { loc: '/hizmetler', changefreq: 'monthly', priority: '0.9' },
  { loc: '/paketler', changefreq: 'monthly', priority: '0.9' },
  { loc: '/hakkimizda', changefreq: 'monthly', priority: '0.8' },
  { loc: '/iletisim', changefreq: 'yearly', priority: '0.8' },
  { loc: '/teklif-al', changefreq: 'monthly', priority: '0.8' },
  { loc: '/kariyer', changefreq: 'monthly', priority: '0.7' },
  { loc: '/sss', changefreq: 'monthly', priority: '0.7' },
  { loc: '/ekip', changefreq: 'monthly', priority: '0.6' },
  { loc: '/hizmetler/sosyal-medya-yonetimi', changefreq: 'monthly', priority: '0.8' },
  { loc: '/hizmetler/icerik-uretimi', changefreq: 'monthly', priority: '0.8' },
  { loc: '/hizmetler/reklam-yonetimi', changefreq: 'monthly', priority: '0.8' },
  { loc: '/hizmetler/video-produksiyon', changefreq: 'monthly', priority: '0.8' },
  { loc: '/hizmetler/strateji-danismanlik', changefreq: 'monthly', priority: '0.8' },
  { loc: '/hizmetler/web-sitesi-tasarimi', changefreq: 'monthly', priority: '0.8' },
  { loc: '/kvkk', changefreq: 'yearly', priority: '0.3' },
  { loc: '/gizlilik', changefreq: 'yearly', priority: '0.3' },
  { loc: '/cerez-politikasi', changefreq: 'yearly', priority: '0.3' },
];

function escapeXml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function urlEntry({ loc, lastmod, changefreq, priority }) {
  const mod = lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : '';
  return `  <url>\n    <loc>${escapeXml(BASE + loc)}</loc>${mod}\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  try {
    const staticEntries = STATIC_PAGES.map(p => urlEntry(p)).join('\n');
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${staticEntries}\n</urlset>`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).send(xml);
  } catch (err) {
    console.error('Sitemap error:', err);
    return res.status(500).send('Sitemap generation failed');
  }
}
