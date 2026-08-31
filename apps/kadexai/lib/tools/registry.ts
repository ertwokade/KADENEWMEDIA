export type ToolCategoryId = 'platform' | 'operations' | 'production' | 'media' | 'analysis' | 'planning' | 'owner' | 'settings'
export type ToolStatus = 'active' | 'coming-soon'
export type ProfileField =
  | 'profile.displayName'
  | 'profile.language'
  | 'profile.timezone'
  | 'profile.expertise'
  | 'profile.goals'
  | 'brand.name'
  | 'brand.description'
  | 'brand.niche'
  | 'brand.audience'
  | 'brand.voice'
  | 'brand.products'
  | 'brand.website'
  | 'brand.keywords'
  | 'preferences.language'
  | 'preferences.platforms'
  | 'preferences.tone'

export type IntegrationId = 'youtube' | 'instagram' | 'tiktok' | 'x' | 'analytics' | 'shopier'

export interface ToolDefinition {
  id: string
  name: string
  category: ToolCategoryId
  route: string
  icon: string
  description: string
  status: ToolStatus
  requiredProfileFields: ProfileField[]
  requiredIntegrations: IntegrationId[]
  permissions: Array<'user' | 'owner' | 'settings-owner'>
  historyEnabled: boolean
  enabled: boolean
  comingSoon: boolean
}

export const TOOL_CATEGORIES: Array<{ id: ToolCategoryId; label: string; description: string }> = [
  { id: 'platform', label: 'PLATFORM', description: 'Çalışma alanı özeti' },
  { id: 'operations', label: 'OPERASYON', description: 'İş akışı, ekip ve prodüksiyon yönetimi' },
  { id: 'production', label: 'ÜRETİM', description: 'Metin ve içerik üretimi' },
  { id: 'media', label: 'MEDYA', description: 'Görsel, klip ve ses araçları' },
  { id: 'analysis', label: 'ANALİZ', description: 'İçerik ve performans analizi' },
  { id: 'planning', label: 'PLANLAMA', description: 'Fikir, takvim ve şablonlar' },
  { id: 'owner', label: 'SAHİP', description: 'Yalnızca hesap sahibine açık alanlar' },
  { id: 'settings', label: 'AYARLAR', description: 'Profil, entegrasyon ve sistem ayarları' },
]

const brandBasics: ProfileField[] = ['brand.name', 'brand.niche', 'brand.audience', 'preferences.language', 'preferences.tone']

export const TOOL_REGISTRY: ToolDefinition[] = [
  tool('overview', 'Genel Bakış', 'platform', '/dashboard', 'layout-dashboard', 'Araçlara ve çalışma alanına genel bakış.', [], false),
  tool('packages', 'Paketler', 'platform', '/dashboard/packages', 'circle-dollar', 'Abonelik paketleri ve satın alma.', [], false),
  tool('api-keys', 'Kendi API Anahtarların', 'platform', '/dashboard/api-keys', 'key-round', 'BYOK sağlayıcı anahtarlarını şifreli olarak yönet.', [], false),
  tool('quote', 'Teklif Al', 'platform', '/dashboard/quote', 'file-text', 'İhtiyacına özel paket ve fiyat talep et.', [], false),
  tool('orchestrate', 'Akışlar', 'platform', '/dashboard/orchestrate', 'git-branch', 'Araçları zincirleyerek uçtan uca çalıştır.', [], false),
  tool('operations', 'Operasyon Merkezi', 'operations', '/dashboard/operations?view=dashboard', 'layout-dashboard', 'Bütçe, görev ve üretim özeti.', [], false),
  tool('sentscan', 'SentScan', 'operations', '/dashboard/operations?view=comments', 'message-square', 'Yorum ve transkript analizi.', [], false),
  tool('production-crm', 'Prodüksiyon CRM', 'operations', '/dashboard/operations?view=crm', 'clapperboard', 'Prodüksiyon, görev, bütçe ve envanter.', [], false),
  tool('banana-studio', 'Banana Studio', 'operations', '/dashboard/operations?view=banana', 'image-plus', 'Görsel üretimi ve prompt çalışma alanı.', ['brand.name'], false),
  tool('vibe-coding', 'Vibe Coding', 'operations', '/dashboard/operations?view=vibe', 'file-code', 'Uygulama briefi ve geliştirme rehberi.', [], false),
  tool('ai-radar', 'AI Radar', 'operations', '/dashboard/operations?view=radar', 'radio', 'AI kaynakları ve kişisel notlar.', [], false),
  tool('notes', 'Notlar', 'operations', '/dashboard/operations?view=pages', 'book-open', 'Ekip notları ve dokümanlar.', [], false),
  tool('operations-settings', 'Operasyon Ayarları', 'operations', '/dashboard/operations?view=settings', 'settings', 'Operasyon alanı ayarları.', [], false),

  tool('content-studio', 'İçerik Stüdyosu', 'production', '/dashboard/content-studio', 'copy', 'Bir kaynaktan marka sesine uygun haftalık yayın paketi üretir ve saklar.', [], false),
  tool('title', 'Başlık Üretici', 'production', '/dashboard/title', 'wand', 'Platforma uygun başlıklar üretir.', brandBasics),
  tool('text-generator', 'Metin Oluşturucu', 'production', '/dashboard/text-generator', 'file-text', 'Marka bağlamıyla kullanıma hazır metin üretir.', brandBasics),
  tool('description', 'Video Açıklama', 'production', '/dashboard/description', 'file-text', 'Video açıklaması ve CTA üretir.', brandBasics),
  tool('hook', 'Hook Jeneratörü', 'production', '/dashboard/hook', 'zap', 'İlk saniyeler için güçlü açılışlar üretir.', brandBasics),
  tool('hashtag', 'Hashtag AI', 'production', '/dashboard/hashtag', 'hash', 'Platform ve nişe uygun hashtag önerir.', ['brand.niche', 'preferences.platforms']),
  tool('thread', 'Thread Yazarı', 'production', '/dashboard/thread', 'git-branch', 'X ve Threads için seri içerik üretir.', brandBasics),
  tool('carousel', 'Carousel İçeriği', 'production', '/dashboard/carousel', 'layout-grid', 'Slayt bazlı carousel metni üretir.', brandBasics),
  tool('collab-mail', 'Kolaborasyon Maili', 'production', '/dashboard/collab-mail', 'mail', 'Marka iş birliği e-postası üretir.', ['profile.displayName', 'brand.name', 'brand.niche']),
  tool('bulk', 'Toplu İçerik', 'production', '/dashboard/bulk', 'copy', 'Birden fazla platform için toplu içerik üretir.', brandBasics),

  tool('video-factory', 'Video Fabrikası', 'media', '/dashboard/video-factory', 'clapperboard', 'Konu veya senaryodan otomatik video üretir.', ['brand.name']),
  tool('ai-thumbnail', 'AI Thumbnail', 'media', '/dashboard/ai-thumbnail', 'image-plus', 'Görsel arka plan ve thumbnail kompozisyonu üretir.', ['brand.name']),
  tool('clip-generator', 'Klip Üretici', 'media', '/dashboard/clip-generator', 'scissors', 'Video veya transkriptten klip önerileri çıkarır.', [], false),
  tool('subtitles', 'Altyazı Stüdyosu', 'media', '/dashboard/subtitles', 'captions', 'Videodan altyazı üretir, çevirir ve YouTube’a yükler.', [], false),
  tool('dubbing', 'Dublaj Stüdyosu', 'media', '/dashboard/dubbing', 'mic', 'Videoyu otomatik olarak başka dillerde seslendirir.', [], false),

  tool('viral-score', 'Viral Skor', 'analysis', '/dashboard/viral-score', 'trending-up', 'Viral potansiyeli puanlar, iki başlığı karşılaştırır, thumbnail verilirse CTR tahmini ekler.', ['brand.niche', 'brand.audience']),
  tool('clickbait-detector', 'Clickbait Dedektörü', 'analysis', '/dashboard/clickbait-detector', 'alert-circle', 'Başlığın vaat ve yanıltıcılık riskini analiz eder.', [], false),
  tool('youtube-seo', 'YouTube SEO', 'analysis', '/dashboard/youtube-seo', 'search', 'Girilen video verilerini SEO açısından inceler.', ['brand.niche']),
  tool('retention-analysis', 'İzlenme Analizi', 'analysis', '/dashboard/retention-analysis', 'bar-chart', 'Girilen akış ve metriklerden izleyici tutma analizi.', ['brand.audience']),
  tool('social-audit', 'Sosyal Medya Analizi', 'analysis', '/dashboard/social-audit', 'users', 'Girilen profil ve metrikleri denetler.', brandBasics),
  tool('trend-radar', 'Trend Radar', 'analysis', '/dashboard/trend-radar', 'radar', 'TikTok, Reels, Shorts, YouTube ve Google’da ölçülmüş canlı trend verisi.', [], false),
  tool('materyal', 'Materyal Kütüphanesi', 'analysis', '/dashboard/materyal', 'image-plus', 'Video ve fotoğraf materyallerini ara, izle ve indir.', [], false),
  tool('competitor', 'Rakip Analizi', 'analysis', '/dashboard/competitor', 'users', 'Kullanıcının sağladığı rakip bilgilerini analiz eder.', ['brand.niche']),
  tool('comment-analysis', 'Yorum Analizi', 'analysis', '/dashboard/comment-analysis', 'message-square', 'Yapıştırılan gerçek yorumları analiz eder.', [], false),
  tool('analytics', 'Analitik', 'analysis', '/dashboard/analytics', 'bar-chart', 'Kullanıcının girdiği metriklerden performans özeti çıkarır.', ['brand.niche']),
  tool('faq', 'FAQ Üretici', 'analysis', '/dashboard/faq', 'bookmark', 'İçerikten soru ve cevaplar çıkarır.', ['brand.audience']),
  tool('quote-extractor', 'Alıntı Çıkarıcı', 'analysis', '/dashboard/quote-extractor', 'book-open', 'Verilen metinden kullanılabilir alıntılar çıkarır.', [], false),

  tool('ideas', 'İçerik Fikirleri', 'planning', '/dashboard/ideas', 'lightbulb', 'Marka bağlamında içerik fikirleri üretir.', brandBasics),
  tool('kade-search', 'KadeSearch Onay', 'planning', '/dashboard/kade-search', 'list-checks', 'Günlük trend adaylarını onayla, üretim paketini hazırla ve WhatsApp’tan al.', [], false),
  tool('content-plan', '30 Günlük Plan', 'planning', '/dashboard/content-plan', 'calendar-days', 'Hedef ve sıklığa göre içerik planı üretir.', brandBasics),
  tool('bio-link', 'Bağlantı Bio', 'planning', '/dashboard/bio-link', 'link', 'Profil ve bağlantı sayfası metni üretir.', ['profile.displayName', 'brand.name', 'brand.niche']),
  tool('calendar', 'İçerik Takvimi', 'planning', '/dashboard/calendar', 'calendar', 'Yayın planını saklar ve yönetir.', [], false),
  tool('templates', 'Şablon Kütüphanesi', 'planning', '/dashboard/templates', 'library', 'Kişisel içerik şablonlarını yönetir.', [], false),
  tool('history', 'Geçmiş', 'planning', '/dashboard/history', 'history', 'Araç çalıştırmalarını arar, filtreler ve yeniden açar.', [], false),

  { ...tool('shopier', 'Satış Merkezi', 'owner', '/dashboard/shopier', 'circle-dollar', 'Teklif ve satış takibi.', [], false), permissions: ['owner'] },
  { ...tool('admin-cost', 'Platform Yönetimi', 'owner', '/dashboard/admin', 'bar-chart', 'AI maliyeti, brüt marj ve teklif pipeline\'ı.', [], false), permissions: ['owner'] },
  { ...tool('settings', 'Ayarlar', 'settings', '/dashboard/settings', 'settings', 'Profil, marka, entegrasyon ve sistem ayarları.', [], false), permissions: ['settings-owner'] },
]

function tool(
  id: string,
  name: string,
  category: ToolCategoryId,
  route: string,
  icon: string,
  description: string,
  requiredProfileFields: ProfileField[] = brandBasics,
  historyEnabled = true,
  status: ToolStatus = 'active'
): ToolDefinition {
  return {
    id,
    name,
    category,
    route,
    icon,
    description,
    status,
    requiredProfileFields,
    requiredIntegrations: [],
    permissions: ['user'],
    historyEnabled,
    enabled: status === 'active',
    comingSoon: status === 'coming-soon',
  }
}

export function getToolByRoute(pathname: string) {
  return TOOL_REGISTRY.find((tool) => tool.route.split('?')[0] === pathname)
}

export function getToolById(id: string) {
  return TOOL_REGISTRY.find((tool) => tool.id === id)
}
