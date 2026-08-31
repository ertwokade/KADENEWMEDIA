import 'server-only'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function getAuthenticatedUser() {
  if (process.env.NODE_ENV !== 'production' && process.env.KADE_DISABLE_AUTH === '1') return null
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return null
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user
  } catch {
    return null
  }
}

export async function hasAuthenticatedUser() {
  if (process.env.NODE_ENV !== 'production' && process.env.KADE_DISABLE_AUTH === '1') return true
  return Boolean(await getAuthenticatedUser())
}

/**
 * Route Handler'lar için ikinci savunma hattı.
 *
 * Oturum kontrolü proxy.ts'te (middleware) zaten yapılıyor. Ama orada tek bir
 * `matcher` regex'i var: bir rota taşınır, matcher daraltılır ya da bir
 * handler middleware'in kapsamadığı bir yoldan çağrılırsa, korumanın tamamı
 * sessizce düşer. Bu yüzden korunan her handler kendi kontrolünü de yapar.
 *
 * Yetkisizse döndürülecek yanıtı verir, yetkiliyse `null` — böylece çağıran
 * `if (guard) return guard` ile tek satırda kullanabilir. Hata fırlatmaz:
 * generate route'larının hepsi try/catch içinde 500 döndürüyor, fırlatılan
 * hata 401 yerine 500'e dönüşürdü.
 */
export async function requireApiUser(): Promise<NextResponse | null> {
  if (process.env.NODE_ENV !== 'production' && process.env.KADE_DISABLE_AUTH === '1') return null

  // Kimlik sağlayıcısı yapılandırılmamışsa açık değil, KAPALI düşülür.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json({ error: 'Kimlik doğrulama yapılandırılmamış.' }, { status: 503 })
  }

  if (await getAuthenticatedUser()) return null
  return NextResponse.json({ error: 'Oturum açman gerekiyor.' }, { status: 401 })
}

export async function assertAuthenticatedUser() {
  if (process.env.NODE_ENV !== 'production' && process.env.KADE_DISABLE_AUTH === '1') return null
  const user = await getAuthenticatedUser()
  if (!user) throw new Error('Oturum gerekli.')
  return user
}
