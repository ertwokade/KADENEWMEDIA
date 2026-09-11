const SERVICES = {
  social: 'Sosyal Medya Yönetimi', 'sosyal-medya': 'Sosyal Medya Yönetimi', 'sosyal-medya-yonetimi': 'Sosyal Medya Yönetimi',
  content: 'İçerik Üretimi', 'icerik-uretimi': 'İçerik Üretimi',
  ads: 'Reklam Yönetimi', 'reklam-yonetimi': 'Reklam Yönetimi',
  video: 'Video Prodüksiyon', 'video-produksiyon': 'Video Prodüksiyon',
  web: 'Web Sitesi', 'web-tasarim': 'Web Sitesi', 'web-sitesi': 'Web Sitesi',
  consult: 'Danışmanlık', danismanlik: 'Danışmanlık',
}

export function serviceLabel(value) {
  const values = Array.isArray(value) ? value : String(value || '').split(',')
  return values.map(item => String(item).trim()).filter(item => item && item !== '-')
    .map(item => SERVICES[item.toLowerCase()] || item).join(', ') || '—'
}

/** A non-destructive review hint, never a claim that the person is fake. */
export function hasTestMarker(lead) {
  if (lead.isTest === true || lead.is_test === true) return true
  if (/^(test|demo|seed|e2e)(?:[-_ ]|$)/i.test(String(lead.source || ''))) return true
  const email = String(lead.email || '').trim().toLowerCase()
  return /@(?:example\.(?:com|org|net)|[^@]+\.(?:test|invalid))$/.test(email)
    || /^(test|demo|e2e)(?:[-_+\d]|@)/i.test(email)
    || /^(test|demo|deneme)(?:\s|$)/i.test(String(lead.name || '').trim())
}

export function filterLeadRecords(leads, filter) {
  if (filter === 'test') return leads.filter(hasTestMarker)
  if (filter === 'unmarked') return leads.filter(lead => !hasTestMarker(lead))
  return leads
}
