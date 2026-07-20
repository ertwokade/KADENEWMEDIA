export const organizationKitSummary = {
  nextMeeting: '18 Temmuz 2026, 10:30',
  consultant: 'Kade New Media',
  consultingModel: 'Aylık stratejik yönetim ortaklığı',
  period: 'Temmuz - Eylül 2026',
  roadmapCompletion: 64,
  mediaOperationScore: 78,
}

export const roadmapFocus = [
  'LinkedIn ve Instagram icin yonetici perspektifli 12 ana icerik temasi',
  'Haftalik video ritmini sabitleyen cekim, kurgu ve onay akisi',
  'Creator is birlikleri icin marka guvenligi ve tekliflendirme kriterleri',
  'Meta reklamlarinda yeniden hedefleme ve lead kalite optimizasyonu',
]

export const strategicDecisions = [
  { title: 'Temmuz kampanya ana mesaji', status: 'Onay bekliyor', owner: 'Yonetim' },
  { title: 'Creator shortlist secimi', status: 'Karar gerekli', owner: 'Kade New Media' },
  { title: 'Q3 medya butce dagilimi', status: 'Taslak hazir', owner: 'Finans + Pazarlama' },
]

export const teamHealth = {
  activeMembers: 7,
  openTasks: 18,
  delayedApprovals: 3,
  bottlenecks: ['Video onay sureleri', 'Haftalik rapor girdileri', 'Creator brief revizyonlari'],
}

export const managementMeetings = [
  {
    title: 'Temmuz Yonetim Ritmi',
    date: '18 Temmuz 2026',
    agenda: ['Kampanya onaylari', 'Performans kontrolu', '30 gunluk aksiyon listesi'],
  },
  {
    title: 'Haziran Kapanis Notlari',
    date: '27 Haziran 2026',
    agenda: ['Reklam kalite skoru iyilestirildi', 'Icerik takvimi haftalik ritme alindi'],
  },
]

export const operationScores = [
  { label: 'Icerik duzeni', score: 82 },
  { label: 'Yayin ritmi', score: 76 },
  { label: 'Reklam performansi', score: 74 },
  { label: 'Creator operasyonu', score: 69 },
  { label: 'Onay surecleri', score: 88 },
]

export const aiPrompts = [
  'Bu ay en kritik medya kararlarımız neler?',
  'Ekipte hangi süreçler aksıyor?',
  'Önümüzdeki 30 gün için öncelik planı oluştur.',
  'İçerik operasyonumuzda en büyük risk nedir?',
  'Yönetim toplantısı için gündem hazırla.',
]

export const organizationKitSections = {
  'medya-yol-haritasi': {
    title: 'Medya Yol Haritası',
    eyebrow: '90 Günlük Plan',
    description: 'Hedefler, kanal öncelikleri, reklam aksiyonları ve creator operasyonunu tek stratejik planda takip edin.',
    stats: [
      ['Dönem', organizationKitSummary.period],
      ['Tamamlanma', `${organizationKitSummary.roadmapCompletion}%`],
      ['Öncelikli kanal', 'LinkedIn + Instagram'],
    ],
    items: roadmapFocus,
  },
  'yonetim-toplantilari': {
    title: 'Yönetim Toplantıları',
    eyebrow: 'Karar Ritmi',
    description: 'Aylık yönetim toplantılarını gündem, karar, aksiyon sahibi ve takip notlarıyla yönetin.',
    stats: [
      ['Sıradaki toplantı', organizationKitSummary.nextMeeting],
      ['Açık karar', '3'],
      ['Aksiyon sahibi', '5'],
    ],
    items: managementMeetings.flatMap((meeting) => [meeting.title, ...meeting.agenda]),
  },
  'ekip-surecler': {
    title: 'Ekip ve Süreçler',
    eyebrow: 'Operasyon Sağlığı',
    description: 'İç ekip, ajans, creator ve yönetim onay süreçlerindeki darboğazları görünür hale getirin.',
    stats: [
      ['Aktif ekip', String(teamHealth.activeMembers)],
      ['Açık görev', String(teamHealth.openTasks)],
      ['Geciken onay', String(teamHealth.delayedApprovals)],
    ],
    items: teamHealth.bottlenecks,
  },
  'stratejik-kararlar': {
    title: 'Stratejik Kararlar',
    eyebrow: 'Yönetici Onayı',
    description: 'Medya, içerik ve büyüme kararlarını öncelik, sahiplik ve onay durumuyla takip edin.',
    stats: [
      ['Bekleyen karar', '3'],
      ['Onay bekleyen kampanya', '1'],
      ['Öncelikli aksiyon', '4'],
    ],
    items: strategicDecisions.map((decision) => `${decision.title} - ${decision.status}`),
  },
  notlar: {
    title: 'Danışmanlık Notları',
    eyebrow: 'Kade New Media',
    description: 'Toplantı çıktıları, gözlemler, riskler ve önerilen yönetim aksiyonları için merkezi not alanı.',
    stats: [
      ['Son not', '27 Haziran 2026'],
      ['Açık takip', '6'],
      ['Risk başlığı', '2'],
    ],
    items: [
      'Video üretim akışında tek onay sorumlusu netleştirilmeli.',
      'Yayın ritmi korunurken kampanya kreatifleri ayrı sprintte ele alınmalı.',
      'Q3 raporlamasında lead kalitesi ve içerik katkısı birlikte okunmalı.',
    ],
  },
}

export const fractionalDirectorPlan = {
  title: 'Fractional New Media Director',
  description: 'Kade New Media ekibinin markanızın içerik, medya ve büyüme kararlarında stratejik yönetim partneri olarak çalıştığı danışmanlık modeli.',
  badges: ['Özel Danışmanlık Planı', 'Aktif', 'Premium Erişim'],
  services: [
    'Aylık yönetim toplantıları',
    'İç ekip ve dış ajans koordinasyonu',
    'İçerik ve medya kararlarının değerlendirilmesi',
    'Performans kontrolü',
    'Stratejik onay sistemi',
    '90 günlük medya yol haritası',
    'Yönetici seviyesinde raporlama',
    'Kade Organizasyon Kiti erişimi',
    'Kade Kit Business erişimi',
    'Kade Radar erişimi',
    'Marka özelinde AI bilgi merkezi',
  ],
}
