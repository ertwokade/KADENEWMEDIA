import { NextRequest, NextResponse } from 'next/server'
import { assertAuthenticatedUser } from '@/lib/auth/server'
import { isAllowedOwnerUser, isSettingsOwnerUser } from '@/lib/featureAccess'
import { createAdminClient } from '@/lib/supabase/admin'
import { captureApiError } from '@/lib/observability/server'
import { getRateLimitKey, rateLimit, rateLimitHeaders } from '@/lib/rateLimit'
import { getPricingSnapshot } from '@/lib/payments/pricingConfig'
import { recordAuditEvent } from '@/lib/audit/server'
import type { PlanTier } from '@/lib/payments/types'

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
      // Sahiplik e-posta listesi VEYA app_metadata'daki admin rolüyle gelir;
      // yalnızca e-postaya bakmak admin hesaplarını "Ücretsiz" gösteriyordu.
      const sahip = isAllowedOwnerUser({
        email: h.email,
        app_metadata: h.app_metadata as Record<string, unknown> | undefined,
      })
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

const TIERLER: PlanTier[] = ['baslangic', 'pro', 'sinirsiz']
const DONEMLER = new Set(['monthly', 'yearly'])
const AZAMI_AY = 36

/**
 * Kullanıcının paketini elle ver ya da geri al.
 *
 * Liste sayfası yalnızca okuyordu: kimin ne paketi olduğu görünüyor ama
 * değiştirilemiyordu; bir kullanıcıya paket tanımlamak için veritabanına
 * elle girmek gerekiyordu. Bu uç aynı tabloyu satın alma akışıyla AYNI
 * biçimde yazar (tier, period, api_included, features), böylece elle
 * verilen paket ile satın alınan paket sistemde ayrışmaz.
 *
 * Sahip hesapların paketi zaten kod tarafından veriliyor; onlara satır
 * yazmak yanıltıcı olurdu, o yüzden reddediliyor.
 */
export async function PATCH(request: NextRequest) {
  const limit = rateLimit(getRateLimitKey(request, 'admin-users-write'), 20, 60_000)
  const headers = { ...rateLimitHeaders(limit), 'Cache-Control': 'private, no-store' }
  if (!limit.allowed) return NextResponse.json({ error: 'Çok fazla istek.' }, { status: 429, headers })

  const user = await assertAuthenticatedUser()
  if (!user || (!isAllowedOwnerUser(user) && !isSettingsOwnerUser(user))) {
    return NextResponse.json({ error: 'Bu alan yalnızca hesap sahibine açıktır.' }, { status: 403, headers })
  }

  try {
    const govde = await request.json() as {
      userId?: unknown; islem?: unknown; tier?: unknown; donem?: unknown; ay?: unknown
    }
    const hedefId = typeof govde.userId === 'string' ? govde.userId : ''
    if (!hedefId) return NextResponse.json({ error: 'Kullanıcı kimliği gerekli.' }, { status: 400, headers })

    const admin = createAdminClient()
    const { data: hedefVeri, error: hedefHata } = await admin.auth.admin.getUserById(hedefId)
    if (hedefHata || !hedefVeri?.user) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı.' }, { status: 404, headers })
    }
    const hedef = hedefVeri.user

    if (isAllowedOwnerUser({ email: hedef.email, app_metadata: hedef.app_metadata as Record<string, unknown> | undefined })) {
      return NextResponse.json(
        { error: 'Sahip hesapların paketi kod tarafından veriliyor, elle değiştirilemez.' },
        { status: 409, headers },
      )
    }

    if (govde.islem === 'kaldir') {
      const { error } = await admin
        .from('entitlements')
        .update({ status: 'cancelled' })
        .eq('user_id', hedefId)
        .eq('status', 'active')
      if (error) throw error
      void recordAuditEvent({
        actorUserId: user.id, action: 'entitlement.revoked',
        resourceType: 'user', resourceId: hedefId,
      })
      return NextResponse.json({ ok: true, paket: null }, { headers })
    }

    if (govde.islem !== 'ver') {
      return NextResponse.json({ error: 'Geçersiz işlem.' }, { status: 400, headers })
    }

    const tier = govde.tier as PlanTier
    if (!TIERLER.includes(tier)) {
      return NextResponse.json({ error: 'Geçersiz paket.' }, { status: 400, headers })
    }
    const donem = typeof govde.donem === 'string' && DONEMLER.has(govde.donem) ? govde.donem : 'monthly'
    const ay = Math.min(Math.max(Math.round(Number(govde.ay) || 1), 1), AZAMI_AY)

    const anlik = getPricingSnapshot()
    const simdi = new Date()
    const bitis = new Date(simdi)
    bitis.setMonth(bitis.getMonth() + ay)

    // Aynı anda iki aktif hak kalmasın: önce mevcutlar kapatılır.
    const { error: kapatmaHatasi } = await admin
      .from('entitlements')
      .update({ status: 'cancelled' })
      .eq('user_id', hedefId)
      .eq('status', 'active')
    if (kapatmaHatasi) throw kapatmaHatasi

    const { error: yazmaHatasi } = await admin.from('entitlements').insert({
      user_id: hedefId,
      tier,
      period: donem,
      api_included: true,
      features: anlik.tierFeatures[tier],
      status: 'active',
      starts_at: simdi.toISOString(),
      expires_at: bitis.toISOString(),
    })
    if (yazmaHatasi) throw yazmaHatasi

    void recordAuditEvent({
      actorUserId: user.id, action: 'entitlement.granted',
      resourceType: 'user', resourceId: hedefId,
    })

    return NextResponse.json({
      ok: true,
      paket: anlik.tierLabels[tier],
      paketTier: tier,
      paketBitis: bitis.toISOString(),
    }, { headers })
  } catch (error) {
    captureApiError(error, '/api/admin/users#patch')
    return NextResponse.json({ error: 'Paket güncellenemedi.' }, { status: 503, headers })
  }
}
