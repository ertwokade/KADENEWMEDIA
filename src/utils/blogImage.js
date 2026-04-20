const CATEGORY_IMAGES = {
  // Turkish categories
  'instagram': 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=80',
  'tiktok': 'https://images.unsplash.com/photo-1611605698335-8b1569810432?w=800&q=80',
  'sosyal medya': 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80',
  'dijital pazarlama': 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
  'reklam': 'https://images.unsplash.com/photo-1533750349088-cd871a92f312?w=800&q=80',
  'içerik': 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&q=80',
  'strateji': 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80',
  'video': 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&q=80',
  'web': 'https://images.unsplash.com/photo-1547658719-da2b51169166?w=800&q=80',
  'seo': 'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=800&q=80',
  'e-ticaret': 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&q=80',
  'marka': 'https://images.unsplash.com/photo-1493421419110-74f4e85ba126?w=800&q=80',
  // English categories
  'social media': 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80',
  'digital marketing': 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
  'advertising': 'https://images.unsplash.com/photo-1533750349088-cd871a92f312?w=800&q=80',
  'content': 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&q=80',
  'strategy': 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80',
  'branding': 'https://images.unsplash.com/photo-1493421419110-74f4e85ba126?w=800&q=80',
}

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80'

function isValidImage(src) {
  if (!src || typeof src !== 'string') return false
  const s = src.trim()
  if (!s) return false
  return s.startsWith('http://') || s.startsWith('https://') || s.startsWith('data:') || s.startsWith('/')
}

export function getBlogImage(post) {
  if (post?.image && isValidImage(post.image)) return post.image
  if (post?.coverImage && isValidImage(post.coverImage)) return post.coverImage
  const cat = (post?.category || post?.categoryEn || '').toLowerCase()
  for (const [key, url] of Object.entries(CATEGORY_IMAGES)) {
    if (cat.includes(key)) return url
  }
  return DEFAULT_IMAGE
}

export function getBlogFallback(post) {
  const cat = (post?.category || post?.categoryEn || '').toLowerCase()
  for (const [key, url] of Object.entries(CATEGORY_IMAGES)) {
    if (cat.includes(key)) return url
  }
  return DEFAULT_IMAGE
}
