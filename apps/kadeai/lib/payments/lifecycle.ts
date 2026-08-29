import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { captureServerAnalytics } from '@/lib/analytics/server'
import { recordAuditEvent } from '@/lib/audit/server'
import { notifyOperation } from '@/lib/notifications/operationFeed'

/**
 * Abonelik yaşam döngüsü süpürücüsü.
 *
 * `entitlements.status` bugüne kadar hiçbir yerde 'expired'a çekilmiyordu;
 * sorgular `expires_at`'e baktığı için davranış doğruydu ama veri kayıyordu ve
 * "churn" olayı hiç tetiklenmiyordu.
 *
 * Süpürme idempotenttir: yalnız `status='active'` ve süresi geçmiş satırlara
 * dokunur, güncellenen satır için bir kez churn yazar.
 */
export interface SweepResult {
  expired: number
  churned: number
}

export async function sweepExpiredEntitlements(): Promise<SweepResult> {
  const admin = createAdminClient()
  const now = new Date().toISOString()

  // Süresi geçmiş aktif yetkileri tek adımda kapat ve KİMLERİ kapattığını al.
  // `.select()` sayesinde güncelleme ile okuma aynı işlemde olur; iki kez
  // çalışsa bile ikinci koşuda eşleşen satır kalmaz.
  const { data, error } = await admin
    .from('entitlements')
    .update({ status: 'expired', updated_at: now })
    .eq('status', 'active')
    .lt('expires_at', now)
    .select('id, user_id, tier, period')

  if (error) throw new Error(`Süresi dolan abonelikler kapatılamadı: ${error.message}`)

  const rows = data || []
  if (rows.length === 0) return { expired: 0, churned: 0 }

  const userIds = [...new Set(rows.map((row) => row.user_id))]

  // Aynı kullanıcının hemen yenilenmiş başka bir aktif yetkisi varsa bu bir
  // churn DEĞİL, sürüm geçişidir. Yenilemeyi churn saymamak için kontrol edilir.
  const { data: stillActive } = await admin
    .from('entitlements')
    .select('user_id')
    .eq('status', 'active')
    .gt('expires_at', now)
    .in('user_id', userIds)

  const renewed = new Set((stillActive || []).map((row) => row.user_id))
  const churnedUsers = userIds.filter((userId) => !renewed.has(userId))

  for (const userId of churnedUsers) {
    // Analytics rızası abonelik kaydında tutulmuyor; sunucu tarafı olay
    // gönderimi rıza olmadan çalışmaz, bu yüzden consent=false geçilir ve
    // olay yalnızca audit trail'e yazılır.
    void captureServerAnalytics('churn', userId, false)
    void notifyOperation({
      kind: 'subscription_churned',
      title: 'Abonelik yenilenmedi',
      detail: 'Süresi doldu, yeni yetki yok',
      userId,
    })
    void recordAuditEvent({
      actorUserId: userId,
      action: 'subscription.churned',
      resourceType: 'entitlement',
      metadata: { reason: 'expired_without_renewal' },
    })
  }

  return { expired: rows.length, churned: churnedUsers.length }
}
