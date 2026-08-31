import { NextRequest, NextResponse } from 'next/server'
import { assertAuthenticatedUser } from '@/lib/auth/server'
import { isAllowedOwnerEmail, isAllowedOwnerUser, isSettingsOwnerUser } from '@/lib/featureAccess'
import { createAdminClient } from '@/lib/supabase/admin'
import { captureApiError } from '@/lib/observability/server'
import { getRateLimitKey, rateLimit, rateLimitHeaders } from '@/lib/rateLimit'
import { getPricingSnapshot } from '@/lib/payments/pricingConfig'

export const dynamic = 'force-dynamic'

const MAX_USERS = 500

type Satir = {
  userId: string
  eposta: string
  ad: string
  alan: string | null
  sahip: boolean
  paket: string
  paketTier: string | null
  paketBitis: string | null
  kayit: string
  sonGiris: string | null
  calisma: number
  sonCalisma: string | null
}

/**
 * Hesap sahibinin kullanıcı listesi: kim kayıt olmuş, hangi paketi var,
 * ne kadar kullanmış.
 *
 * Yalnızca hesap sahibine açık. Kullanıcıların ürettiği içerik, istem
 * metinleri ya da oturum bilgileri DÖNDÜRÜLMEZ; burada yalnızca hesap
 * yönetimi için gereken alanlar var.
 */
export async function GET(request: NextRequest) {
  const limit = rateLimit(getRateLimitKey(request, 'admin-users'), 30, 60_000)
  const headers = { ...rateLimitHeaders(limit), 'Cache-Control': 'private, no-store' }
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Çok fazla istek.' }, { status: 429, headers })
  }

  const user = await assertAuthenticatedUser()
  if (!user || (!isAllowedOwnerUser(user) && !isSettingsOwnerUser(user))) {
    return NextResponse.json(
      { error: 'Bu alan yalnızca hesap sahibine açıktır.' },
      { status: 403, headers },
    )
  }

  try {
    const admin = createAdminClient()
    const etiketler = getPricingSnapshot().tierLabels

    const { data: liste, error: listeHata } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: MAX_USERS,
    })
    if (listeHata) throw listeHata

    const hesaplar = liste.users
    const idler = hesaplar.map((h) => h.id)

    const [alanlar, haklar, kosular] = await Promise.all([
      admin.from('workspaces').select('owner_id, slug').in('owner_id', idler),
      admin
        .from('entitlements')
        .select('user_id, tier, expires_at, status')
        .in('user_id', idler)
        .eq('status', 'active'),
      admin.from('tool_runs').select('user_id, created_at').in('user_id', idler),
    ])

    const alanOf = new Map<string, string>()
    for (const w of alanlar.data ?? []) {
      if (!alanOf.has(w.owner_id)) alanOf.set(w.owner_id, w.slug)
    }

    // Aynı kullanıcının birden çok aktif hakkı varsa en geç bitene bakılır.
    const hakOf = new Map<string, { tier: string; expires_at: string }>()
    for (const e of haklar.data ?? []) {
      const mevcut = hakOf.get(e.user_id)
      if (!mevcut || new Date(e.expires_at) > new Date(mevcut.expires_at)) {
        hakOf.set(e.user_id, { tier: e.tier, expires_at: e.expires_at })
      }
    }

    const kosuOf = new Map<string, { adet: number; son: string }>()
    for (const r of kosular.data ?? []) {
      const mevcut = kosuOf.get(r.user_id)
      if (!mevcut) kosuOf.set(r.user_id, { adet: 1, son: r.created_at })
      else {
        mevcut.adet += 1
        if (r.created_at > mevcut.son) mevcut.son = r.created_at
      }
    }

    const simdi = Date.now()
    const satirlar: Satir[] = hesaplar.map((h) => {
      const sahip = isAllowedOwnerEmail(h.email)
      const hak = hakOf.get(h.id)
      const gecerli = hak && new Date(hak.expires_at).getTime() > simdi
      const kosu = kosuOf.get(h.id)

      const meta = (h.user_metadata ?? {}) as Record<string, unknown>
      const ad = ['display_name', 'full_name', 'name']
        .map((k) => meta[k])
        .find((v): v is string => typeof v === 'string' && v.trim().length > 0)

      return {
        userId: h.id,
        eposta: h.email ?? '—',
        ad: ad ?? (h.email?.split('@')[0] ?? '—'),
        alan: alanOf.get(h.id) ?? null,
        sahip,
        // Sahip paketi satın alma olmadan verilir; listede de böyle görünür.
        paket: sahip ? 'Sahip · Sınırsız' : gecerli ? (etiketler[hak.tier as keyof typeof etiketler] ?? hak.tier) : 'Ücretsiz',
        paketTier: sahip ? 'sinirsiz' : gecerli ? hak.tier : null,
        paketBitis: sahip ? null : gecerli ? hak.expires_at : null,
        kayit: h.created_at,
        sonGiris: h.last_sign_in_at ?? null,
        calisma: kosu?.adet ?? 0,
        sonCalisma: kosu?.son ?? null,
      }
    })

    satirlar.sort((a, b) => new Date(b.kayit).getTime() - new Date(a.kayit).getTime())

    return NextResponse.json(
      {
        kullanicilar: satirlar,
        toplam: satirlar.length,
        // Liste sayfalanmıyor; sınıra dayanıldıysa arayüz bunu söylemeli.
        kirpildi: hesaplar.length >= MAX_USERS,
      },
      { headers },
    )
  } catch (error) {
    captureApiError(error, '/api/admin/users#get')
    return NextResponse.json({ error: 'Kullanıcı listesi okunamadı.' }, { status: 503, headers })
  }
}
