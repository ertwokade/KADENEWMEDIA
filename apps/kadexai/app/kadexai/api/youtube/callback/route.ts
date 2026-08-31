import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getAuthenticatedUser } from '@/lib/auth/server'
import { exchangeCode, fetchChannel, OAUTH_STATE_COOKIE, saveConnection } from '@/lib/youtube/oauth'
import { PUBLIC_APP_URL } from '@/lib/appConfig'

export const dynamic = 'force-dynamic'

function backTo(status: string, detail?: string) {
  const url = new URL(`${PUBLIC_APP_URL.replace(/\/$/, '')}/dashboard/subtitles`)
  url.searchParams.set('youtube', status)
  if (detail) url.searchParams.set('detay', detail.slice(0, 160))
  return NextResponse.redirect(url)
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams
  const error = params.get('error')
  if (error) return backTo('hata', error === 'access_denied' ? 'Yetkilendirme iptal edildi.' : error)

  const code = params.get('code')
  const state = params.get('state')
  const store = await cookies()
  const expected = store.get(OAUTH_STATE_COOKIE)?.value
  store.delete(OAUTH_STATE_COOKIE)

  if (!code || !state || !expected || state !== expected) {
    return backTo('hata', 'Oturum doğrulanamadı, tekrar dene.')
  }

  const user = await getAuthenticatedUser()
  if (!user) return backTo('hata', 'Oturum bulunamadı.')

  try {
    const tokens = await exchangeCode(code)
    if (!tokens.refresh_token) {
      // Google yenileme belirtecini yalnizca ilk onayda dondurur. Kullanici
      // uygulamayi daha once yetkilendirdiyse Google hesap izinlerinden
      // kaldirip tekrar baglamasi gerekir.
      return backTo('hata', 'Yenileme belirteci alınamadı. Google hesap izinlerinden erişimi kaldırıp tekrar bağla.')
    }
    const channel = tokens.access_token ? await fetchChannel(tokens.access_token) : null
    await saveConnection(user, tokens.refresh_token, channel)
    return backTo('baglandi')
  } catch (e) {
    return backTo('hata', e instanceof Error ? e.message : 'Bağlantı tamamlanamadı.')
  }
}
