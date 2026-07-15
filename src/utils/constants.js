import { BRAND } from '../config/brand'

export const CONTACT = {
  phone: BRAND.phone,
  phoneDisplay: BRAND.phone,
  email: BRAND.email,
  address: BRAND.address || BRAND.city,
  whatsapp: BRAND.whatsapp,
  maps: '',
}

export const SOCIAL = BRAND.social

export const SITE = {
  name: 'Kade Media',
  url: 'https://kademedia.com.tr',
  tagline: 'Sosyal Medya Ajansı',
}
