import { getSupabase, isValidUuid, isUniqueViolation } from './_lib/supabase.js';
import { requirePermission } from './_lib/auth.js';
import { cors } from './_lib/cors.js';
import { sanitizeBlogHtml, stripHtml } from './_lib/sanitize.js';
import { logActivity } from './notifications.js';

function sanitizePost(post) {
  if (!post) return post;
  return {
    ...post,
    titleTr: stripHtml(post.titleTr, 300),
    titleEn: stripHtml(post.titleEn, 300),
    excerptTr: stripHtml(post.excerptTr, 1000),
    excerptEn: stripHtml(post.excerptEn, 1000),
    category: stripHtml(post.category, 120),
    categoryEn: stripHtml(post.categoryEn, 120),
    contentTr: sanitizeBlogHtml(post.contentTr),
    contentEn: sanitizeBlogHtml(post.contentEn),
  };
}

function sanitizeBlogInput(input) {
  const mutableFields = new Set([
    'titleTr', 'titleEn', 'excerptTr', 'excerptEn', 'contentTr', 'contentEn',
    'category', 'categoryEn', 'image', 'color', 'readTime', 'slug', 'publishAt', 'published',
  ]);
  const clean = Object.fromEntries(Object.entries(input || {}).filter(([key]) => mutableFields.has(key)));
  for (const key of ['titleTr', 'titleEn']) {
    if (clean[key] !== undefined) clean[key] = stripHtml(clean[key], 300);
  }
  for (const key of ['excerptTr', 'excerptEn']) {
    if (clean[key] !== undefined) clean[key] = stripHtml(clean[key], 1000);
  }
  for (const key of ['category', 'categoryEn']) {
    if (clean[key] !== undefined) clean[key] = stripHtml(clean[key], 120);
  }
  if (clean.contentTr !== undefined) clean.contentTr = sanitizeBlogHtml(clean.contentTr);
  if (clean.contentEn !== undefined) clean.contentEn = sanitizeBlogHtml(clean.contentEn);
  return clean;
}

// NOT: Bu fonksiyon artık gerçek sorguda kullanılmıyor (Supabase filtreleri handler
// içinde doğrudan kuruluyor) — eski Mongo filtre şekli, geriye dönük uyumluluk
// (ör. tests/unit/security.test.js) için AYNEN korunuyor.
export function publicBlogFilter(now = new Date()) {
  return {
    published: { $ne: false },
    $or: [
      { publishAt: { $exists: false } },
      { publishAt: null },
      { publishAt: { $lte: now } },
    ],
  };
}

function rowToPost(row) {
  if (!row) return row;
  return {
    _id: row.id,
    id: row.id,
    slug: row.slug,
    titleTr: row.title_tr,
    titleEn: row.title_en,
    excerptTr: row.excerpt_tr,
    excerptEn: row.excerpt_en,
    contentTr: row.content_tr,
    contentEn: row.content_en,
    category: row.category,
    categoryEn: row.category_en,
    image: row.image,
    color: row.color,
    readTime: row.read_time,
    published: row.published,
    publishAt: row.publish_at,
    date: row.display_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function postToRow(post) {
  const row = {};
  if (post.titleTr !== undefined) row.title_tr = post.titleTr;
  if (post.titleEn !== undefined) row.title_en = post.titleEn;
  if (post.excerptTr !== undefined) row.excerpt_tr = post.excerptTr;
  if (post.excerptEn !== undefined) row.excerpt_en = post.excerptEn;
  if (post.contentTr !== undefined) row.content_tr = post.contentTr;
  if (post.contentEn !== undefined) row.content_en = post.contentEn;
  if (post.category !== undefined) row.category = post.category;
  if (post.categoryEn !== undefined) row.category_en = post.categoryEn;
  if (post.image !== undefined) row.image = post.image;
  if (post.color !== undefined) row.color = post.color;
  if (post.readTime !== undefined) row.read_time = post.readTime;
  if (post.slug !== undefined) row.slug = post.slug;
  if (post.publishAt !== undefined) row.publish_at = post.publishAt;
  if (post.published !== undefined) row.published = post.published;
  if (post.date !== undefined) row.display_date = post.date;
  return row;
}

export default async function handler(req, res) {
  if (cors(req, res)) return;

  const supabase = getSupabase();

  // GET - List all blog posts (public)
  if (req.method === 'GET') {
    try {
      const now = new Date();
      const { data, error } = await supabase
        .from('kade_blogs')
        .select('*')
        .eq('published', true)
        .or(`publish_at.is.null,publish_at.lte.${now.toISOString()}`)
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return res.status(200).json(data.map(rowToPost).map(sanitizePost));
    } catch (error) {
      console.error('Blog GET error:', error);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  }

  // POST - Create new blog post (requires auth)
  if (req.method === 'POST') {
    const user = await requirePermission(req, res, 'blog', { write: true });
    if (!user) return;

    try {
      const {
        titleTr, titleEn, excerptTr, excerptEn,
        contentTr, contentEn, category, categoryEn,
        image, color, readTime, slug, publishAt
      } = req.body;

      if (!titleTr || !slug) return res.status(400).json({ error: 'Başlık ve slug gerekli' });
      if (titleTr.length > 300) return res.status(400).json({ error: 'Başlık çok uzun (max 300)' });
      if (slug.length > 200) return res.status(400).json({ error: 'Slug çok uzun (max 200)' });
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return res.status(400).json({ error: 'Slug formatı geçersiz' });
      if (contentTr && contentTr.length > 200000) return res.status(400).json({ error: 'İçerik çok uzun (max 200.000 karakter)' });

      const { data: existing, error: existingError } = await supabase.from('kade_blogs').select('id').eq('slug', slug).maybeSingle();
      if (existingError) throw existingError;
      if (existing) return res.status(400).json({ error: 'Bu slug zaten kullanılıyor' });

      const post = sanitizeBlogInput({
        titleTr: titleTr || '', titleEn: titleEn || '',
        excerptTr: excerptTr || '', excerptEn: excerptEn || '',
        contentTr: contentTr || '', contentEn: contentEn || '',
        category: category || '', categoryEn: categoryEn || '',
        image: image || '', color: color || '#eac321',
        readTime: parseInt(readTime) || 5, slug,
        publishAt: publishAt ? new Date(publishAt).toISOString() : null,
        date: new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }),
      });

      const row = postToRow(post);
      const { data, error } = await supabase.from('kade_blogs').insert(row).select().single();
      if (error) {
        if (isUniqueViolation(error)) return res.status(400).json({ error: 'Bu slug zaten kullanılıyor' });
        throw error;
      }
      logActivity({ action: 'Blog yazısı oluşturuldu', detail: `"${titleTr}"`, type: 'create', icon: '📝', user: user.username }).catch(() => {});
      return res.status(201).json(rowToPost(data));
    } catch (error) {
      console.error('Blog POST error:', error);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  }

  // PUT - Update blog post (requires auth)
  if (req.method === 'PUT') {
    const user = await requirePermission(req, res, 'blog', { write: true });
    if (!user) return;

    try {
      const { id, ...rawUpdateData } = req.body;
      if (!id) return res.status(400).json({ error: 'Post ID gerekli' });
      if (!isValidUuid(id)) return res.status(400).json({ error: 'Geçersiz Post ID' });

      const updateData = sanitizeBlogInput(rawUpdateData);
      if (updateData.slug !== undefined && (typeof updateData.slug !== 'string' || updateData.slug.length > 200 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(updateData.slug))) {
        return res.status(400).json({ error: 'Slug formatı geçersiz' });
      }
      if (updateData.contentTr?.length > 200000 || updateData.contentEn?.length > 200000) {
        return res.status(400).json({ error: 'İçerik çok uzun' });
      }
      if (updateData.readTime) updateData.readTime = parseInt(updateData.readTime);
      if (updateData.publishAt !== undefined) {
        updateData.publishAt = updateData.publishAt ? new Date(updateData.publishAt).toISOString() : null;
      }

      const row = postToRow(updateData);
      row.updated_at = new Date().toISOString();

      const { data, error } = await supabase.from('kade_blogs').update(row).eq('id', id).select('id');
      if (error) {
        if (isUniqueViolation(error)) return res.status(400).json({ error: 'Bu slug zaten kullanılıyor' });
        throw error;
      }
      if (!data || data.length === 0) return res.status(404).json({ error: 'Post bulunamadı' });

      logActivity({ action: 'Blog yazısı güncellendi', detail: `"${updateData.titleTr || id}"`, type: 'update', icon: '✏️', user: user.username }).catch(() => {});
      return res.status(200).json({ message: 'Post güncellendi' });
    } catch (error) {
      console.error('Blog PUT error:', error);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  }

  // DELETE - Delete blog post (requires auth)
  if (req.method === 'DELETE') {
    const user = await requirePermission(req, res, 'blog', { write: true });
    if (!user) return;

    try {
      const queryId = req.body?.id || req.query.id;
      if (!queryId) return res.status(400).json({ error: 'Post ID gerekli' });
      if (!isValidUuid(queryId)) return res.status(400).json({ error: 'Geçersiz Post ID' });

      const { data: post, error: findError } = await supabase.from('kade_blogs').select('title_tr').eq('id', queryId).maybeSingle();
      if (findError) throw findError;

      const { data, error } = await supabase.from('kade_blogs').delete().eq('id', queryId).select('id');
      if (error) throw error;
      if (!data || data.length === 0) return res.status(404).json({ error: 'Post bulunamadı' });

      logActivity({ action: 'Blog yazısı silindi', detail: `"${post?.title_tr || queryId}"`, type: 'delete', icon: '🗑️', user: user.username }).catch(() => {});
      return res.status(200).json({ message: 'Post silindi' });
    } catch (error) {
      console.error('Blog DELETE error:', error);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
