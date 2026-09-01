import { NextRequest, NextResponse } from 'next/server'
import { generateContent } from '@/lib/ai/provider'
import { CHANNEL_AUDIT_SYSTEM_PROMPT, buildChannelAuditPrompt } from '@/lib/ai/prompts'
import { extractJsonObject, clampScore } from '@/lib/ai/json'
import { requireApiUser } from '@/lib/auth/server'
import { TOOL_REGISTRY, getToolById } from '@/lib/tools/registry'
import { AIModel } from '@/types'

export const dynamic = 'force-dynamic'

const MAX_FIELD = 12_000

type Boyut = { ad: string; puan: number; durum: string; yorum: string }
type Kazanim = { baslik: string; neden: string; arac: string | null; aracAdi: string | null; rota: string | null }
type Donem = { donem: string; hedef: string; isler: string[] }

function metin(value: unknown, max = 400): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function metinListesi(value: unknown, max = 8): string[] {
  return Array.isArray(value) ? value.map((v) => metin(v)).filter(Boolean).slice(0, max) : []
}

const GECERLI_DURUM = new Set(['iyi', 'orta', 'zayif', 'veri_yok'])

/**
 * Kanal Denetimi.
 *
 * Sosyal Medya Analizi düzyazı bir rapor döndürüyor: okunuyor ama bir şey
 * yaptırmıyor. Bu uç aynı girdiden yapılandırılmış bir iş listesi üretir ve
 * her işi çalıştırılabilir bir araca bağlar.
 *
 * Modelin döndürdüğü araç kimlikleri BURADA doğrulanır; uydurulmuş bir
 * kimlik arayüzde ölü bağlantı olurdu.
 */
export async function POST(req: NextRequest) {
  const guard = await requireApiUser()
  if (guard) return guard

  try {
    const body = await req.json()
    const { accountName, niche, platforms, bio, metrics, recentPosts, goal, model } = body

    if (!accountName?.trim() || !niche?.trim()) {
      return NextResponse.json({ error: 'Hesap adı ve niş gerekli.' }, { status: 400 })
    }
    if ([bio, metrics, recentPosts, goal].some((v) => String(v || '').length > MAX_FIELD)) {
      return NextResponse.json({ error: 'Girdi izin verilen sınırı aşıyor.' }, { status: 413 })
    }

    // Modele yalnızca gerçekten var olan ve kullanıcıya açık araçları veriyoruz.
    const secilebilir = TOOL_REGISTRY
      .filter((t) => t.enabled && !t.comingSoon && t.permissions.includes('user'))
      .map((t) => t.id)

    const result = await generateContent({
      model: model as AIModel,
      systemPrompt: CHANNEL_AUDIT_SYSTEM_PROMPT,
      maxTokens: 2800,
      prompt: buildChannelAuditPrompt({
        accountName: String(accountName),
        niche: String(niche),
        platforms: Array.isArray(platforms) ? platforms.map(String) : [],
        bio: String(bio || ''),
        metrics: String(metrics || ''),
        recentPosts: String(recentPosts || ''),
        goal: String(goal || ''),
        toolIds: secilebilir,
      }),
    }, req)

    const ham = extractJsonObject(result.content) as Record<string, unknown> | null
    if (!ham) {
      return NextResponse.json({ error: 'Denetim çözümlenemedi, tekrar dene.' }, { status: 502 })
    }

    const boyutlar: Boyut[] = (Array.isArray(ham.boyutlar) ? ham.boyutlar : [])
      .slice(0, 6)
      .map((b: Record<string, unknown>) => ({
        ad: metin(b?.ad, 60),
        puan: clampScore(Number(b?.puan)),
        durum: GECERLI_DURUM.has(String(b?.durum)) ? String(b?.durum) : 'veri_yok',
        yorum: metin(b?.yorum, 240),
      }))
      .filter((b: Boyut) => b.ad)

    const hizli: Kazanim[] = (Array.isArray(ham.hizli_kazanimlar) ? ham.hizli_kazanimlar : [])
      .slice(0, 3)
      .map((k: Record<string, unknown>) => {
        const aracId = metin(k?.arac, 64)
        // Uydurulmuş kimlik arayüzde ölü bağlantı olurdu.
        const arac = aracId && secilebilir.includes(aracId) ? getToolById(aracId) : undefined
        return {
          baslik: metin(k?.baslik, 200),
          neden: metin(k?.neden, 240),
          arac: arac?.id ?? null,
          aracAdi: arac?.name ?? null,
          rota: arac?.route ?? null,
        }
      })
      .filter((k: Kazanim) => k.baslik)

    const yol: Donem[] = (Array.isArray(ham.yol_haritasi) ? ham.yol_haritasi : [])
      .slice(0, 4)
      .map((d: Record<string, unknown>) => ({
        donem: metin(d?.donem, 40),
        hedef: metin(d?.hedef, 200),
        isler: metinListesi(d?.isler, 6),
      }))
      .filter((d: Donem) => d.donem)

    return NextResponse.json({
      denetim: {
        saglikSkoru: clampScore(Number(ham.saglik_skoru)),
        skorGerekcesi: metin(ham.skor_gerekcesi, 240),
        veriEksigi: metinListesi(ham.veri_eksigi, 6),
        boyutlar,
        hizliKazanimlar: hizli,
        yolHaritasi: yol,
      },
      model: result.model,
      routingReason: result.routingReason,
      tokensUsed: result.tokensUsed,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Sunucu hatası' },
      { status: 500 },
    )
  }
}
