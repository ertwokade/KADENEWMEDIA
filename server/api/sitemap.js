import { getSupabase } from './_lib/supabase.js';

const DEFAULT_BASE = 'https://kadenewmedia.com';

// Sitemap yalnız indekslenebilir URL'leri içerir.
// `/portfolio`, `/partnerler`, `/blog`, `/referanslar`, `/basari-hikayeleri`
// sayfaları içerik doğrulanana kadar `noindex` servis ediliyor; sitemap'te
// bırakıldıklarında Search Console "Submitted URL marked 'noindex'" hatası
// üretiyor ve sitemap'in tamamına olan güveni düşürüyordu. İçerik yayına
// alındığında hem burada hem scripts/generate-static-routes.mjs içinde açılmalı.
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

/**
 * Sitemap'e girecek proje slug'ları.
 *
 * Ölçüt: yayında olmalı VE gösterilecek gerçek bir içeriği bulunmalı
 * (özet, süreç, medya veya sonuç). İçeriksiz bir kayıt detay sayfasında
 * 404 gösterildiği için sitemap'e alınmaz — aksi hâlde Google'a var
 * olmayan sayfa bildirilir.
 */
export function sitemapProjects(items) {
  if (!Array.isArray(items)) return [];
  const seen = new Set();
  const slugs = [];
  for (const item of items) {
    if (!item || typeof item !== 'object') continue;
    if (item.published === false) continue;
    const slug = typeof item.slug === 'string' ? item.slug.trim() : '';
    if (!slug || seen.has(slug)) continue;
    const summary = item.summary || {};
    const hasContent = Boolean(
      summary.problem || summary.goal || summary.approach || summary.role ||
      (Array.isArray(item.process) && item.process.length) ||
      (Array.isArray(item.media) && item.media.length) ||
      (Array.isArray(item.results) && item.results.length),
    );
    if (!hasContent) continue;
    seen.add(slug);
    slugs.push(slug);
  }
  return slugs;
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
        // Portfolyo, içerik tablosunda tek satır olarak tutulur.
        supabase.from('kade_site_content').select('data, updated_at').eq('section', 'portfolio').maybeSingle(),
      ]);
      const blogs = blogsRes.error ? [] : (blogsRes.data || []);
      const partners = partnersRes.error ? [] : (partnersRes.data || []);
      // Yalnızca YAYINDAKİ ve gerçekten detay içeriği olan projeler girer;
      // boş bir detay sayfası indekslenmemeli.
      const projects = portfolioRes.error ? [] : sitemapProjects(portfolioRes.data?.data?.items);
      const portfolioLastmod = String(portfolioRes.data?.updated_at || '').slice(0, 10) || undefined;
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
        ...projects.map(slug => urlEntry({
          loc: `/portfolio/${slug}`,
          lastmod: portfolioLastmod,
          changefreq: 'monthly',
          priority: '0.7',
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
