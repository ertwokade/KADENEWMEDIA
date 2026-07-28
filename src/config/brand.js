// Merkezi marka & iletişim bilgisi — statik TABAN kaynak.
// Aynı bilgi sayfalarda farklı/eski marka adıyla tekrarlanmasın diye buradan
// kullanılır ve ön-render edilen HTML'e bu değerler girer.
//
// Çalışma anında Admin > İçerik Yönetimi > Footer ekranındaki değerler
// bunların üzerine yazılır (bkz. src/hooks/useSiteContent.js). Buradaki
// değerler API erişilemediğinde geçerli kalır.
export const BRAND = {
  name: 'Kade New Media',
  alternateNames: ['Kade Media', 'Kademedia', 'Kadenewmedia', 'Kade'],
  legalName: 'Kade New Media',
  email: 'thekademedia@gmail.com',
  city: 'İstanbul',
  address: 'Biruni Teknopark, Zeytinburnu/İstanbul',
  phone: '+90 506 729 34 23',
  whatsapp: 'https://wa.me/905067293423',
  social: {},
}

// Doğrulanmış resmi hesaplar sağlandığında merkezi olarak buraya eklenir.
// Admin panelinden girilen adresler bu listeye çalışma anında eklenir.
export const SOCIAL_LINKS = []

// Admin footer formundaki alan adları → görünen etiket.
// Sıra, footer'da gösterim sırasını belirler.
const SOCIAL_FIELDS = [
  ['instagram', 'INSTAGRAM'],
  ['youtube', 'YOUTUBE'],
  ['tiktok', 'TIKTOK'],
  ['linkedin', 'LINKEDIN'],
  ['whatsapp', 'WHATSAPP'],
]

/** Yalnız http(s) adreslerine izin verilir — `javascript:` gibi şemalar elenir. */
function isSafeExternalUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return false
  try {
    const url = new URL(value.trim())
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Admin footer içeriğinden görüntülenebilir sosyal medya listesi üretir.
 * Statik listedeki hesaplar korunur, aynı etiket iki kez eklenmez.
 */
export function buildSocialLinks(content = {}, staticLinks = SOCIAL_LINKS) {
  const seen = new Set()
  const links = []

  for (const { label, href } of staticLinks) {
    if (!isSafeExternalUrl(href) || seen.has(label)) continue
    seen.add(label)
    links.push({ label, href })
  }

  for (const [field, label] of SOCIAL_FIELDS) {
    const href = content?.[field]
    if (!isSafeExternalUrl(href) || seen.has(label)) continue
    seen.add(label)
    links.push({ label, href: href.trim() })
  }

  return links
}

export default BRAND
