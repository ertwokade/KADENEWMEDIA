/**
 * Trend skorlama motoru (saf hesap - veritabanina dokunmaz).
 *
 * Skor = agirlikli birlesim:
 *   hacim      : mutlak buyukluk (izlenme / gonderi sayisi)
 *   hiz        : birim zamanda buyume orani
 *   etkilesim  : begeni+yorum+paylasim / izlenme
 *   siralama   : kaynak listesindeki konumu
 *   capraz     : kac platformda gorunuyor
 *   tazelik    : ne kadar yeni
 *
 * Ayrica yasam dongusu asamasi (emerging -> dead) belirlenir.
 */
import { clamp, hoursBetween } from './util'
import type { ScoreRecord, SnapshotRow, TrendRow, TrendStage } from './types'

export const SCORING = {
  weights: {
    volume: 0.3,
    velocity: 0.28,
    engagement: 0.16,
    rank: 0.14,
    crossPlatform: 0.07,
    freshness: 0.05,
  },
  emergingVelocityThreshold: 0.35,
  decliningVelocityThreshold: -0.12,
  halfLifeHours: 96,
}

const W = SCORING.weights

/** Logaritmik normalizasyon: 0 -> 0, tavan -> ~1 */
export function logNorm(v: number, ceiling = 1e9) {
  if (!v || v <= 0) return 0
  return clamp(Math.log10(v + 1) / Math.log10(ceiling), 0, 1)
}

function primaryVolume(snap: Pick<SnapshotRow, 'views' | 'posts' | 'followers'>) {
  return Math.max(snap.views || 0, (snap.posts || 0) * 900, (snap.followers || 0) * 12)
}

/**
 * Iki snapshot arasindaki gunluk bagil buyume orani.
 * @returns 0.5 = gunde %50 buyume, olculemiyorsa null
 */
export function computeVelocity(snaps: SnapshotRow[]): number | null {
  if (snaps.length < 2) return null
  const last = snaps[snaps.length - 1]
  // Anlamli fark icin en az yarim saat geride bir olcum ara
  let prev: SnapshotRow | null = null
  for (let i = snaps.length - 2; i >= 0; i--) {
    if (hoursBetween(snaps[i].captured_at, last.captured_at) >= 0.5) {
      prev = snaps[i]
      break
    }
  }
  if (!prev) prev = snaps[snaps.length - 2]

  const hours = Math.max(hoursBetween(prev.captured_at, last.captured_at), 0.5)
  const a = primaryVolume(prev)
  const b = primaryVolume(last)
  if (a <= 0) return b > 0 ? 1 : 0
  const dailyGrowth = ((b - a) / a) * (24 / hours)
  return clamp(dailyGrowth, -3, 10)
}

/** Ivme: hiz degisiyor mu (hizlanma / yavaslama). */
function computeAcceleration(snaps: SnapshotRow[]) {
  if (snaps.length < 3) return 0
  const v2 = computeVelocity(snaps) ?? 0
  const v1 = computeVelocity(snaps.slice(0, -1)) ?? 0
  return clamp(v2 - v1, -3, 3)
}

export function computeEngagement(snap: SnapshotRow) {
  const views = snap.views || 0
  if (views < 50) {
    // Izlenme yoksa gonderi sayisina gore notr deger
    return snap.posts ? 0.35 : 0.2
  }
  const weighted = (snap.likes || 0) + (snap.comments || 0) * 3 + (snap.shares || 0) * 5 + (snap.saves || 0) * 4
  const rate = weighted / views
  // %12+ olaganustu kabul
  return clamp(rate / 0.12, 0, 1)
}

function computeFreshness(trend: Pick<TrendRow, 'published_at' | 'first_seen'>) {
  const base = trend.published_at || trend.first_seen
  const ageH = Math.max(hoursBetween(base, new Date()), 0)
  return clamp(Math.pow(0.5, ageH / SCORING.halfLifeHours), 0, 1)
}

function determineStage(input: {
  velocity: number
  acceleration: number
  volume: number
  snapCount: number
  freshness: number
}): TrendStage {
  const { velocity, acceleration, volume, snapCount, freshness } = input
  const EMERGE = SCORING.emergingVelocityThreshold
  const DECLINE = SCORING.decliningVelocityThreshold

  if (velocity <= -0.5 && freshness < 0.2) return 'dead'
  if (velocity <= DECLINE) return 'declining'
  if (velocity >= EMERGE && volume < 0.55) return 'emerging'
  if (velocity >= EMERGE) return 'rising'
  if (velocity > 0.08 && volume >= 0.72) return 'peak'
  if (velocity > 0.08) return 'rising'
  if (snapCount <= 1) return freshness >= 0.25 ? 'emerging' : 'plateau'
  if (acceleration < -0.2) return 'declining'
  return 'plateau'
}

/**
 * Tek bir trend icin skor hesaplar.
 *
 * `inferred` kayitlar (cerez/anahtar olmadigi icin baska platformdan turetilmis
 * tahminler) hem hiz hem skor tarafinda kisilir: olcumler arasi "buyume" gercek
 * degil, kaynak havuzunun degismesinin yan etkisidir.
 */
export function scoreTrend(trend: TrendRow, snaps: SnapshotRow[], linkCount = 0): ScoreRecord | null {
  if (!snaps?.length) return null
  const last = snaps[snaps.length - 1]
  const inferred = Boolean(trend.inferred)

  const volume_score = logNorm(primaryVolume(last), 5e8)
  const measuredVelocity = computeVelocity(snaps)
  const velocityMeasured = measuredVelocity !== null
  let velocity = measuredVelocity ?? 0
  // Olculemeyen hiz sinirlanir - tahmin kaydi "gunde %1000 buyuyor" diyemez
  if (inferred) velocity = clamp(velocity, -0.2, 0.3)
  const acceleration = computeAcceleration(snaps)
  const engagement = computeEngagement(last)
  const rank_score = last.rank ? clamp(1 - (last.rank - 1) / 60, 0, 1) : 0.45
  const cross_score = clamp(linkCount / 3, 0, 1)
  const freshness = computeFreshness(trend)

  // Hizi 0-1 araligina sikistir (0 = duragan, 1 = gunde %200+)
  const velocityNorm = clamp((velocity + 0.3) / 2.3, 0, 1)
  // Cok kucuk hacimde yuzde degisimi gurultudur (200 -> 2000 arama "%1000 buyume" degildir).
  const volumeConfidence = clamp(Math.log10(primaryVolume(last) + 1) / 4, 0.3, 1)

  const availableWeight = velocityMeasured ? 1 : 1 - W.velocity
  let score =
    ((W.volume * volume_score +
      (velocityMeasured ? W.velocity * velocityNorm * volumeConfidence : 0) +
      W.engagement * engagement +
      W.rank * rank_score +
      W.crossPlatform * cross_score +
      W.freshness * freshness) / availableWeight) *
    100

  // Ivme bonusu/cezasi
  score *= 1 + clamp(acceleration * 0.06, -0.15, 0.15)

  // Olculmus veriyle ayni siraya cikmasin
  if (inferred) score *= 0.72

  score = clamp(score, 0, 100)

  let stage = determineStage({
    velocity,
    acceleration,
    volume: volume_score,
    snapCount: snaps.length,
    freshness,
  })
  // Tahmini kayit "zirvede" olarak etiketlenemez - olcum yok
  if (inferred && stage === 'peak') stage = 'rising'

  return {
    trend_id: trend.id,
    score: Number(score.toFixed(2)),
    velocity: Number(velocity.toFixed(4)),
    acceleration: Number(acceleration.toFixed(4)),
    engagement: Number(engagement.toFixed(4)),
    volume_score: Number(volume_score.toFixed(4)),
    rank_score: Number(rank_score.toFixed(4)),
    cross_score: Number(cross_score.toFixed(4)),
    freshness: Number(freshness.toFixed(4)),
    stage,
    breakdown: {
      hacim: Math.round(W.volume * volume_score * 100),
      hiz: velocityMeasured ? Math.round(W.velocity * velocityNorm * volumeConfidence * 100) : 0,
      etkilesim: Math.round(W.engagement * engagement * 100),
      siralama: Math.round(W.rank * rank_score * 100),
      caprazPlatform: Math.round(W.crossPlatform * cross_score * 100),
      tazelik: Math.round(W.freshness * freshness * 100),
      hizTahmini: false,
      hizOlculdu: velocityMeasured,
      olcumSayisi: snaps.length,
      cikarim: inferred,
    },
  }
}
