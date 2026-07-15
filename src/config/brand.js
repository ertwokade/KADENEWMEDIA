// Merkezi marka & iletişim bilgisi — TEK kaynak.
// Aynı bilgi sayfalarda farklı/eski marka adıyla tekrarlanmasın diye buradan kullanılır.
export const BRAND = {
  name: 'Kade Media',
  legalName: 'Kade Media',
  email: 'thekademedia@gmail.com',
  address: 'Biruni Teknopark, Zeytinburnu / İstanbul',
  city: 'İstanbul',
  social: {
    instagram: 'https://instagram.com/kadenewmedia',
    tiktok: 'https://tiktok.com/@kadenewmedia',
    youtube: 'https://www.youtube.com/@kadenewmedia',
    linkedin: 'https://www.linkedin.com/company/kadenewmedia',
    x: 'https://x.com/kadenewmedia',
  },
}

// Sıralı liste (footer/iletişim için)
export const SOCIAL_LINKS = [
  { label: 'Instagram', href: BRAND.social.instagram },
  { label: 'X', href: BRAND.social.x },
  { label: 'YouTube', href: BRAND.social.youtube },
  { label: 'TikTok', href: BRAND.social.tiktok },
  { label: 'LinkedIn', href: BRAND.social.linkedin },
]

export default BRAND
