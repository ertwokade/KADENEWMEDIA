import 'server-only'

import { timingSafeEqual } from 'node:crypto'
import type { NextRequest } from 'next/server'

const HEADER = 'x-kade-admin-secret'

/**
 * Sunucular-arası paylaşılan sırla korunan admin uç noktaları için tek
 * doğrulama noktası. Legacy site (kademedia admin paneli / Teklif Builder)
 * bu başlıkla server-to-server istek atar; kullanıcı oturumu kullanılmaz.
 *
 * Karşılaştırma sabit zamanlıdır: `provided === secret` ilk farklı baytta
 * kısa devre yapar ve yanıt süresi üzerinden sır bayt bayt tahmin edilebilir.
 * Uzunluk farkı da tek başına bilgi sızdırdığı için önce iki değer de aynı
 * uzunlukta bir özete indirgenmez — bunun yerine uzunluk eşitliği ayrı
 * kontrol edilir ve eşit değilse yine sabit maliyetli bir karşılaştırma
 * yapılır.
 *
 * Sır tanımlı değilse KAPALI düşer: yapılandırma eksikliği uç noktayı
 * herkese açmamalı.
 */
export function hasValidAdminSecret(request: NextRequest): boolean {
  const secret = process.env.KADEAI_ADMIN_API_SECRET
  if (!secret) return false

  const provided = request.headers.get(HEADER) || ''
  if (provided.length === 0) return false

  const expected = Buffer.from(secret, 'utf8')
  const actual = Buffer.from(provided, 'utf8')

  // timingSafeEqual eşit uzunluk şartı koyar. Uzunluk farklıysa yine de
  // karşılaştırma yapılır ki erken dönüş bir zamanlama sinyali üretmesin.
  if (expected.length !== actual.length) {
    timingSafeEqual(expected, expected)
    return false
  }

  return timingSafeEqual(expected, actual)
}
