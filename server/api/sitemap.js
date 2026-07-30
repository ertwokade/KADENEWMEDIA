import { getSupabase } from './_lib/supabase.js';

const DEFAULT_BASE = 'https://kadenewmedia.com';

export const STATIC_PAGES = [
  { loc: '/', changefreq: 'weekly', priority: '1.0' },
  { loc: '/hizmetler', changefreq: 'monthly', priority: '0.9' },
  { loc: '/new-media-ajansi', changefreq: 'monthly', priority: '0.9' },
  { loc: '/paketler', changefreq: 'monthly', priority: '0.9' },
  { loc: '/hakkimizda', changefreq: 'monthly', priority: '0.8' },
  { loc: '/iletisim', changefreq: 'yearly', priority: '0.8' },
  { loc: '/teklif-al', changefreq: 'monthly', priority: '0.8' },
  { loc: '/kariyer', changefreq: 'monthly', priority: '0.7' },
  { loc: '/sss', changefreq: 'monthly', priority: '0.7' },
  { loc: '/ekip', changefreq: 'monthly', priority: '0.6' },
  { loc: '/portfolio', changefreq: 'monthly', priority: '0.7' },
  { loc: '/basin', changefreq: 'monthly', priority: '0.5' },
  { loc: '/neden-biz', changefreq: 'monthly', priority: '0.7' },
  { loc: '/podcast-webinar', changefreq: 'monthly', priority: '0.6' },
  { loc: '/bulten-arsivi', changefreq: 'monthly', priority: '0.6' },
  { loc: '/partnerler', changefreq: 'monthly', priority: '0.7' },
  { loc: '/basari-hikayeleri', changefreq: 'monthly', priority: '0.7' },
  { loc: '/referanslar', changefreq: 'monthly', priority: '0.6' },
  { loc: '/blog', changefreq: 'weekly', priority: '0.9' },
  { loc: '/hizmetler/sosyal-medya-yonetimi', changefreq: 'monthly', priority: '0.8' },
  { loc: '/hizmetler/icerik-uretimi', changefreq: 'monthly', priority: '0.8' },
  { loc: '/hizmetler/reklam-yonetimi', changefreq: 'monthly', priority: '0.8' },
  { loc: '/hizmetler/video-produksiyon', changefreq: 'monthly', priority: '0.8' },
  { loc: '/hizmetler/strateji-danismanlik', changefreq: 'monthly', priority: '0.8' },
  { loc: '/hizmetler/web-sitesi-tasarimi', changefreq: 'monthly', priority: '0.8' },
  { loc: '/kvkk', changefreq: 'yearly', priority: '0.3' },
  { loc: '/gizlilik', changefreq: 'yearly', priority: '0.3' },
  { loc: '/cerez-politikasi', changefreq: 'yearly', priority: '0.3' },
  { loc: '/telif-haklari', changefreq: 'yearly', priority: '0.3' },
];

export function escapeXml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function normalizeSiteBaseUrl(value = process.env.SITE_URL) {
  try {
    const parsed = new URL(value || DEFAULT_BASE);
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) {
      return DEFAULT_BASE;
    }
    return parsed.origin;
  } catch {
    return DEFAULT_BASE;
  }
}

function urlEntry({ loc, lastmod, changefreq, priority }, base = normalizeSiteBaseUrl()) {
  const mod = lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : '';
  return `  <url>\n    <loc>${escapeXml(base + loc)}</loc>${mod}\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  try {
    const base = normalizeSiteBaseUrl();
    const staticEntries = STATIC_PAGES.map(p => urlEntry(p, base));

    // Yayınlanmış blog yazıları ve partnerler — canonical, başarılı yanıt veren
    // URL'ler dışında sitemap'e hiçbir şey eklenmez (şartname §24).
    let dynamicEntries = [];
    try {
      const supabase = getSupabase();
      const [blogsRes, partnersRes, portfolioRes] = await Promise.all([
        supabase.from('kade_blogs').select('slug, updated_at, created_at').or('published.is.null,published.eq.true'),
        supabase.from('kade_partners').select('slug, updated_at'),
        supabase.from('kade_site_content').select('data, updated_at').eq('section', 'portfolio').maybeSingle(),
      ]);
      const blogs = blogsRes.error ? [] : (blogsRes.data || []);
      const partners = partnersRes.error ? [] : (partnersRes.data || []);
      const portfolioItems = portfolioRes.error || !Array.isArray(portfolioRes.data?.data?.items)
        ? []
        : portfolioRes.data.data.items;
      dynamicEntries = [
        ...blogs.filter(b => b.slug).map(b => urlEntry({
          loc: `/blog/${b.slug}`,
          lastmod: String(b.updated_at || b.created_at || '').slice(0, 10) || undefined,
          changefreq: 'monthly',
          priority: '0.7',
        }, base)),
        ...partners.filter(p => p.slug).map(p => urlEntry({
          loc: `/partnerler/${p.slug}`,
          lastmod: String(p.updated_at || '').slice(0, 10) || undefined,
          changefreq: 'monthly',
          priority: '0.6',
        }, base)),
        ...portfolioItems.map((item, index) => String(item.slug || item.id || `proje-${index + 1}`)).filter(Boolean).map(slug => urlEntry({
          loc: `/portfolio/${encodeURIComponent(slug)}`,
          lastmod: String(portfolioRes.data?.updated_at || '').slice(0, 10) || undefined,
          changefreq: 'monthly',
          priority: '0.6',
        }, base)),
      ];
    } catch (dynamicErr) {
      // Supabase erişilemezse sitemap statik sayfalarla devam eder — tamamen
      // başarısız olup 500 dönmek, dinamik URL'lerin eksik kalmasından daha kötü.
      console.error('Sitemap dynamic entries error:', dynamicErr.message);
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...staticEntries, ...dynamicEntries].join('\n')}\n</urlset>`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).send(xml);
  } catch (err) {
    console.error('Sitemap error:', err);
    return res.status(500).send('Sitemap generation failed');
  }
}
