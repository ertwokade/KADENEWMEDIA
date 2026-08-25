import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { getSupabase } from './_lib/supabase.js';

const SITE_URL = 'https://kadenewmedia.com';
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function hasProjectContent(item) {
  return Boolean(
    item?.summary?.problem || item?.summary?.goal || item?.summary?.approach || item?.summary?.role ||
    item?.process?.length || item?.media?.length || item?.results?.length,
  );
}

async function resolvePage(type, slug) {
  if (type === 'profile' && slug === 'kadirdemir') {
    return {
      title: 'Kadir Demir | Kade New Media',
      description: 'Kadir Demir — Kade New Media Kurucusu ve CEO’su.',
      image: `${SITE_URL}/kadir.jpg`,
    };
  }

  const supabase = getSupabase();
  if (type === 'blog') {
    const { data, error } = await supabase
      .from('kade_blogs')
      .select('title_tr, excerpt_tr, image, published, publish_at')
      .eq('slug', slug)
      .eq('published', true)
      .maybeSingle();
    if (error) throw error;
    if (!data || (data.publish_at && new Date(data.publish_at) > new Date())) return null;
    return { title: `${data.title_tr} | Kade New Media`, description: data.excerpt_tr, image: data.image };
  }

  if (type === 'partner') {
    const { data, error } = await supabase
      .from('kade_partners')
      .select('name, desc_tr, long_desc_tr, logo')
      .eq('slug', slug)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return { title: `${data.name} | Kade New Media`, description: data.long_desc_tr || data.desc_tr, image: data.logo };
  }

  if (type === 'portfolio') {
    const { data, error } = await supabase
      .from('kade_site_content')
      .select('data')
      .eq('section', 'portfolio')
      .maybeSingle();
    if (error) throw error;
    const item = data?.data?.items?.find((candidate) => candidate?.slug === slug && candidate?.published !== false);
    if (!item || !hasProjectContent(item)) return null;
    return {
      title: `${item.title} | Kade New Media`,
      description: item.seo?.description || item.excerpt,
      image: item.seo?.ogImage || item.cover,
    };
  }

  if (type === 'profile') {
    const { data, error } = await supabase
      .from('kade_link_profiles')
      .select('name, tagline, photo')
      .eq('slug', slug)
      .eq('active', true)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return { title: `${data.name} | Kade New Media`, description: `${data.name} — ${data.tagline || ''}`, image: data.photo };
  }

  return null;
}

async function appShell(req) {
  try {
    return await readFile(join(process.cwd(), 'public', 'app.html'), 'utf8');
  } catch {
    const deploymentUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : SITE_URL;
    const response = await fetch(`${deploymentUrl}/app.html`, {
      headers: { 'User-Agent': req.headers['user-agent'] || 'Kade-Dynamic-Renderer/1.0' },
    });
    if (!response.ok) throw new Error(`Uygulama kabuğu yüklenemedi (${response.status}).`);
    return response.text();
  }
}

function setMeta(html, { title, description, image, canonical, found }) {
  const safeTitle = escapeHtml(title || 'Sayfa Bulunamadı | Kade New Media');
  const safeDescription = escapeHtml(description || (found ? 'Kade New Media.' : 'Aradığınız sayfa bulunamadı.'));
  const safeCanonical = escapeHtml(canonical);
  const safeImage = escapeHtml(image && /^https?:\/\//i.test(image) ? image : `${SITE_URL}${image || '/og-image.png'}`);

  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${safeTitle}</title>`);
  html = html.replace(/<meta\b[^>]*name=["']description["'][^>]*>/i, `<meta name="description" content="${safeDescription}">`);
  html = html.replace(/<meta\b[^>]*name=["']robots["'][^>]*>/i, `<meta name="robots" content="${found ? 'index, follow' : 'noindex, follow'}">`);
  html = html.replace(/<link\b[^>]*rel=["']canonical["'][^>]*>/gi, '');
  html = html.replace('</head>', `<link rel="canonical" href="${safeCanonical}"><meta property="og:title" content="${safeTitle}"><meta property="og:description" content="${safeDescription}"><meta property="og:url" content="${safeCanonical}"><meta property="og:image" content="${safeImage}"></head>`);
  return html;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const type = Array.isArray(req.query?.type) ? req.query.type[0] : req.query?.type;
  const slug = Array.isArray(req.query?.slug) ? req.query.slug[0] : req.query?.slug;
  if (!['blog', 'partner', 'portfolio', 'profile'].includes(type) || typeof slug !== 'string' || !SLUG_RE.test(slug)) {
    return res.status(404).json({ error: 'Sayfa bulunamadı' });
  }

  try {
    const page = await resolvePage(type, slug);
    const routePath = type === 'profile'
      ? `/@${slug}`
      : `/${type === 'partner' ? 'partnerler' : type}/${slug}`;
    const canonical = `${SITE_URL}${routePath}`;
    const html = setMeta(await appShell(req), {
      ...(page || {}),
      canonical,
      found: Boolean(page),
    });
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', page ? 's-maxage=300, stale-while-revalidate=3600' : 'private, no-store, max-age=0');
    return res.status(page ? 200 : 404).send(html);
  } catch (error) {
    console.error('Dynamic page render error:', error instanceof Error ? error.message : error);
    return res.status(503).json({ error: 'Sayfa verisi geçici olarak yüklenemedi.' });
  }
}
