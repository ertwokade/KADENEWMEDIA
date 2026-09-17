/** Satış Merkezi'ndeki güvenlik kayıtlarının okunur adları; bilinmeyen kod olduğu gibi kalmaz, sadeleştirilir. */
const ACTIONS: Record<string, string> = {
  'cms.updated': 'Site içeriği güncellendi',
  'content_studio.generated': 'İçerik Stüdyosu paketi üretildi',
  'content_studio.voice_saved': 'İçerik Stüdyosu ses kaydı saklandı',
  'content_studio.whatsapp_sent': 'İçerik Stüdyosu WhatsApp’a gönderildi',
  'custom_offer.created': 'Özel teklif oluşturuldu',
  'entitlement.grant_failed': 'Paket yetkisi verilemedi',
  'entitlement.grant_skipped': 'Paket yetkisi atlandı',
  'entitlement.granted': 'Paket yetkisi verildi',
  'entitlement.revoked': 'Paket yetkisi kaldırıldı',
  'orchestration.denied': 'Akış çalıştırma izni reddedildi',
  'orchestration.step_completed': 'Akış adımı tamamlandı',
  'orchestration.step_failed': 'Akış adımı başarısız',
  'orchestration.step_timeout': 'Akış adımı zaman aşımına uğradı',
  'pricing.updated': 'Fiyatlar güncellendi',
  'provider_key.deleted': 'Sağlayıcı anahtarı silindi',
  'provider_key.saved': 'Sağlayıcı anahtarı kaydedildi',
  'quote_request.created': 'Teklif talebi alındı',
  'quote_request.payment_created': 'Teklif için ödeme bağlantısı oluşturuldu',
  'quote_request.updated': 'Teklif talebi güncellendi',
  'subscription.churned': 'Abonelik sona erdi',
}

const OUTCOMES: Record<string, string> = {
  success: 'başarılı', succeeded: 'başarılı', ok: 'başarılı',
  failure: 'başarısız', failed: 'başarısız', error: 'hata',
  denied: 'reddedildi', skipped: 'atlandı', timeout: 'zaman aşımı',
}

export function auditActionLabel(action: string) {
  return ACTIONS[action] ?? action.replace(/[._]+/g, ' ').replace(/^\w/, (c) => c.toLocaleUpperCase('tr-TR'))
}

export function auditOutcomeLabel(outcome: string) {
  return OUTCOMES[outcome] ?? outcome
}
