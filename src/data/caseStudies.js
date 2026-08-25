export const KADE_CASE_STUDIES = {
  summaryStats: [
    { value: '207', labelTr: 'Envanterde Doğrulanan Rota', labelEn: 'Verified Routes in Inventory', ikon: '🧭' },
    { value: '8/8', labelTr: 'AI Tarayıcı Kuralı', labelEn: 'AI Crawler Rules', ikon: '🤖' },
    { value: 'Günlük', labelTr: 'Trend ve İçerik Seçkisi', labelEn: 'Trend and Content Digest', ikon: '📡' },
    { value: '7/24', labelTr: 'Otomatik Sistem Kontrolü', labelEn: 'Automated System Checks', ikon: '🛡️' },
  ],
  cases: [
    {
      id: 'kade-unified-platform', client: 'Kade New Media · Kendi Platformumuz',
      industryTr: 'New Media ve Yazılım', industryEn: 'New Media and Software', logo: 'K/', color: '#eac321',
      durationTr: 'Sürekli geliştiriliyor', durationEn: 'Continuously improved',
      platforms: ['Web', 'Vercel', 'Supabase'],
      challengeTr: 'Kurumsal site, müşteri alanı, yönetim paneli ve KadeAI farklı çalışma biçimlerine sahipti. Tek dağıtımda güvenli biçimde çalışmaları ve yüzlerce rotanın kaybolmadan izlenmesi gerekiyordu.',
      challengeEn: 'The corporate site, customer area, admin panel and KadeAI had different runtime needs. They needed to work safely in one deployment without losing route coverage.',
      solutionTr: 'Uygulamaları tek Vercel dağıtımında birleştirdik; 207 rotalık doğrulama envanteri, güvenlik kontrolleri, sitemap üretimi ve kritik sayfa testleri kurduk.',
      solutionEn: 'We unified the applications in one Vercel deployment and added a 207-route validation inventory, security checks, sitemap generation and critical page tests.',
      metrics: [
        { labelTr: 'Rota envanteri', labelEn: 'Route inventory', before: 'Dağınık', after: '207 rota', change: 'Otomatik doğrulama', ikon: '🧭' },
        { labelTr: 'Canlı dağıtım', labelEn: 'Live deployment', before: 'Ayrı yapılar', after: 'Tek proje', change: 'Tek yayın hattı', ikon: '🚀' },
      ],
    },
    {
      id: 'kadeai-operations', client: 'KadeAI · Kendi Ürünümüz',
      industryTr: 'AI Destekli Operasyon', industryEn: 'AI-assisted Operations', logo: 'AI', color: '#34d399',
      durationTr: 'Sürekli geliştiriliyor', durationEn: 'Continuously improved',
      platforms: ['KadeSearch', 'WhatsApp', 'Operations'],
      challengeTr: 'Trend bulmak tek başına yeterli değildi. İçerik kararının onaylanması, çekime hazır pakete dönüşmesi ve operasyon hareketlerinin sahibine ulaşması gerekiyordu.',
      challengeEn: 'Finding trends was not enough. Content decisions needed approval, production-ready packaging and owner-facing operational reporting.',
      solutionTr: 'KadeSearch trend radarı, kullanıcıya özel onay merkezi, günlük WhatsApp seçkisi, üretim briefi ve haftalık site sağlık raporunu tek iş akışında birleştirdik.',
      solutionEn: 'We combined KadeSearch, a user-specific approval center, daily WhatsApp digest, production briefs and weekly site health reporting in one workflow.',
      metrics: [
        { labelTr: 'İçerik seçimi', labelEn: 'Content selection', before: 'Dağınık', after: 'Tek merkez', change: 'Onay / ret / yayın', ikon: '✅' },
        { labelTr: 'Sistem raporu', labelEn: 'System report', before: 'Manuel kontrol', after: 'Haftalık', change: 'WhatsApp teslimi', ikon: '📲' },
      ],
    },
  ],
}
