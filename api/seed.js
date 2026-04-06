import bcrypt from 'bcryptjs';
import { getDb } from './_lib/mongodb.js';
import { cors } from './_lib/cors.js';

const defaultPartners = [
  {
    id: 'flavora', name: 'Flavora', category: 'Yiyecek & İçecek', categoryEn: 'Food & Beverage',
    logo: '🍕', color: '#FFD700',
    descTr: 'Flavora, İstanbul\'un en sevilen fast-food zincirlerinden biri. Sosyal medya stratejimizle marka bilinirliğini %300 artırdık.',
    descEn: 'Flavora is one of Istanbul\'s most popular fast-food chains. We increased brand awareness by 300% with our social media strategy.',
    longDescTr: 'Flavora ile 2023 yılından bu yana çalışıyoruz. Instagram, TikTok ve Facebook platformlarında kapsamlı sosyal medya yönetimi hizmeti veriyoruz.',
    longDescEn: 'We have been working with Flavora since 2023. We provide comprehensive social media management services on Instagram, TikTok, and Facebook.',
    servicesTr: ['Sosyal Medya Yönetimi', 'İçerik Üretimi', 'Reklam Yönetimi', 'Video Prodüksiyon'],
    servicesEn: ['Social Media Management', 'Content Production', 'Ad Management', 'Video Production'],
    resultsTr: ['%300 marka bilinirliği artışı', '50K+ yeni takipçi', '%250 etkileşim artışı', '2M+ video görüntülenme'],
    resultsEn: ['300% brand awareness increase', '50K+ new followers', '250% engagement increase', '2M+ video views'],
  },
  {
    id: 'techvibe', name: 'TechVibe', category: 'Teknoloji', categoryEn: 'Technology',
    logo: '💻', color: '#6C63FF',
    descTr: 'TechVibe, yenilikçi bir teknoloji startup\'ı. Lansman kampanyasıyla ilk ayda 100K kullanıcıya ulaştık.',
    descEn: 'TechVibe is an innovative tech startup. We reached 100K users in the first month with our launch campaign.',
    longDescTr: 'TechVibe\'ın ürün lansmanı için 360 derece dijital pazarlama stratejisi oluşturduk.',
    longDescEn: 'We created a 360-degree digital marketing strategy for TechVibe\'s product launch.',
    servicesTr: ['Lansman Stratejisi', 'Sosyal Medya Yönetimi', 'Performance Marketing', 'İçerik Üretimi'],
    servicesEn: ['Launch Strategy', 'Social Media Management', 'Performance Marketing', 'Content Production'],
    resultsTr: ['100K+ kullanıcı (ilk ay)', '5M+ gösterim', '%180 dönüşüm oranı artışı', '500K+ uygulama indirme'],
    resultsEn: ['100K+ users (first month)', '5M+ impressions', '180% conversion rate increase', '500K+ app downloads'],
  },
  {
    id: 'greenlife', name: 'GreenLife', category: 'Sağlık & Wellness', categoryEn: 'Health & Wellness',
    logo: '🌿', color: '#2ECC71',
    descTr: 'GreenLife, organik yaşam ürünleri markası. E-ticaret satışlarını %400 artırdık.',
    descEn: 'GreenLife is an organic lifestyle products brand. We increased e-commerce sales by 400%.',
    longDescTr: 'GreenLife için Instagram odaklı bir strateji geliştirdik.',
    longDescEn: 'We developed an Instagram-focused strategy for GreenLife.',
    servicesTr: ['Instagram Yönetimi', 'UGC Stratejisi', 'Meta Ads', 'İçerik Üretimi'],
    servicesEn: ['Instagram Management', 'UGC Strategy', 'Meta Ads', 'Content Production'],
    resultsTr: ['%400 e-ticaret satış artışı', '80K+ organik takipçi', '%320 web trafiği artışı', '1000+ UGC içerik'],
    resultsEn: ['400% e-commerce sales increase', '80K+ organic followers', '320% web traffic increase', '1000+ UGC content'],
  },
  {
    id: 'urbanstyle', name: 'UrbanStyle', category: 'Moda', categoryEn: 'Fashion',
    logo: '👗', color: '#E91E63',
    descTr: 'UrbanStyle, genç moda markası. TikTok stratejisiyle viral büyüme sağladık.',
    descEn: 'UrbanStyle is a young fashion brand. We achieved viral growth with our TikTok strategy.',
    longDescTr: 'UrbanStyle\'ın hedef kitlesi olan Z kuşağına ulaşmak için TikTok odaklı bir strateji geliştirdik.',
    longDescEn: 'We developed a TikTok-focused strategy to reach UrbanStyle\'s target audience, Gen Z.',
    servicesTr: ['TikTok Yönetimi', 'Video Prodüksiyon', 'Marka Stratejisi', 'Reklam Yönetimi'],
    servicesEn: ['TikTok Management', 'Video Production', 'Brand Strategy', 'Ad Management'],
    resultsTr: ['10M+ TikTok görüntülenme', '200K+ yeni takipçi', '50+ influencer iş birliği', '%500 online satış artışı'],
    resultsEn: ['10M+ TikTok views', '200K+ new followers', '50+ influencer collaborations', '500% online sales increase'],
  },
  {
    id: 'petpal', name: 'PetPal', category: 'Evcil Hayvan', categoryEn: 'Pet Care',
    logo: '🐾', color: '#FFD700',
    descTr: 'PetPal, evcil hayvan ürünleri markası. Topluluk odaklı stratejiyle sadık bir müşteri kitlesi oluşturduk.',
    descEn: 'PetPal is a pet products brand. We built a loyal customer base with a community-focused strategy.',
    longDescTr: 'PetPal için topluluk odaklı bir sosyal medya stratejisi geliştirdik.',
    longDescEn: 'We developed a community-focused social media strategy for PetPal.',
    servicesTr: ['Topluluk Yönetimi', 'İçerik Üretimi', 'Sosyal Medya Yönetimi', 'Reklam Yönetimi'],
    servicesEn: ['Community Management', 'Content Production', 'Social Media Management', 'Ad Management'],
    resultsTr: ['100K+ topluluk üyesi', '%450 etkileşim artışı', '30K+ UGC paylaşım', '%200 tekrar satın alma artışı'],
    resultsEn: ['100K+ community members', '450% engagement increase', '30K+ UGC shares', '200% repeat purchase increase'],
  },
  {
    id: 'fitzone', name: 'FitZone', category: 'Spor & Fitness', categoryEn: 'Sports & Fitness',
    logo: '💪', color: '#00BCD4',
    descTr: 'FitZone, premium spor salonu zinciri. Dijital pazarlamayla üyelik satışlarını %250 artırdık.',
    descEn: 'FitZone is a premium gym chain. We increased membership sales by 250% with digital marketing.',
    longDescTr: 'FitZone\'un dijital dönüşüm sürecini yönettik.',
    longDescEn: 'We managed FitZone\'s digital transformation process.',
    servicesTr: ['Video Prodüksiyon', 'Performance Marketing', 'Marka Stratejisi', 'Sosyal Medya Yönetimi'],
    servicesEn: ['Video Production', 'Performance Marketing', 'Brand Strategy', 'Social Media Management'],
    resultsTr: ['%250 üyelik satış artışı', '15M+ video görüntülenme', '25+ influencer iş birliği', '%180 lead artışı'],
    resultsEn: ['250% membership sales increase', '15M+ video views', '25+ influencer collaborations', '180% lead increase'],
  },
];

const defaultBlogs = [
  {
    slug: '2025-sosyal-medya-trendleri',
    titleTr: '2025\'te Sosyal Medya Trendleri: Markanız İçin Neler Değişiyor?',
    titleEn: 'Social Media Trends in 2025: What\'s Changing for Your Brand?',
    excerptTr: 'Yapay zeka destekli içeriklerden kısa form videolara, 2025\'in en önemli sosyal medya trendlerini keşfedin.',
    excerptEn: 'From AI-powered content to short-form videos, discover the most important social media trends of 2025.',
    contentTr: '', contentEn: '',
    category: 'Sosyal Medya', categoryEn: 'Social Media',
    date: '15 Mar 2025', readTime: 8, image: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800&q=80', color: '#6C63FF',
  },
  {
    slug: 'instagram-reels-stratejisi',
    titleTr: 'Instagram Reels ile Etkileşimi 10x Artırmanın Yolları',
    titleEn: '10 Ways to 10x Your Engagement with Instagram Reels',
    excerptTr: 'Reels algoritmasını nasıl çalıştığını ve etkileşim artırma stratejilerini bu rehberde bulacaksınız.',
    excerptEn: 'Learn how the Reels algorithm works and engagement-boosting strategies in this guide.',
    contentTr: '', contentEn: '',
    category: 'İçerik Stratejisi', categoryEn: 'Content Strategy',
    date: '10 Mar 2025', readTime: 6, image: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&q=80', color: '#E91E63',
  },
  {
    slug: 'meta-ads-optimizasyon',
    titleTr: 'Meta Ads: Reklam Bütçenizi Nasıl Optimize Edersiniz?',
    titleEn: 'Meta Ads: How to Optimize Your Ad Budget?',
    excerptTr: 'Facebook ve Instagram reklamlarında bütçe optimizasyonu hakkında bilmeniz gereken her şey.',
    excerptEn: 'Everything you need to know about budget optimization in Facebook and Instagram ads.',
    contentTr: '', contentEn: '',
    category: 'Reklam', categoryEn: 'Advertising',
    date: '5 Mar 2025', readTime: 10, image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80', color: '#FFD700',
  },
  {
    slug: 'tiktok-marka-buyutme',
    titleTr: 'TikTok\'ta Marka Büyütme: Başlangıçtan İleri Seviyeye',
    titleEn: 'Brand Growth on TikTok: From Beginner to Advanced',
    excerptTr: 'TikTok\'ta sıfırdan marka oluşturma ve viral olma taktikleri rehberi.',
    excerptEn: 'A guide to building a brand from scratch on TikTok and going viral.',
    contentTr: '', contentEn: '',
    category: 'TikTok', categoryEn: 'TikTok',
    date: '28 Şub 2025', readTime: 7, image: 'https://images.unsplash.com/photo-1611605698323-b1e99cfd37ea?w=800&q=80', color: '#2ECC71',
  },
  {
    slug: 'influencer-marketing-rehberi',
    titleTr: 'Influencer Marketing Rehberi: Doğru İş Birliğini Nasıl Kurarsınız?',
    titleEn: 'Influencer Marketing Guide: How to Build the Right Partnership?',
    excerptTr: 'Influencer seçiminden kampanya yönetimine kadar her şeyi kapsayan rehber.',
    excerptEn: 'A comprehensive guide covering everything from influencer selection to campaign management.',
    contentTr: '', contentEn: '',
    category: 'Influencer', categoryEn: 'Influencer',
    date: '20 Şub 2025', readTime: 9, image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80', color: '#00BCD4',
  },
  {
    slug: 'icerik-takvimi-olusturma',
    titleTr: 'Etkili İçerik Takvimi Nasıl Oluşturulur?',
    titleEn: 'How to Create an Effective Content Calendar?',
    excerptTr: 'Sosyal medya için profesyonel bir içerik takvimi oluşturmanın adımları.',
    excerptEn: 'Steps to creating a professional content calendar for social media.',
    contentTr: `İçerik takvimi, sosyal medya yönetiminin bel kemiğidir. Düzenli ve tutarlı paylaşımlar yapabilmek için sistematik bir plan şarttır.\n\n**İçerik Takvimi Neden Önemli?**\nTutarsız paylaşımlar algoritma tarafından cezalandırılır. Düzenli içerik paylaşan hesaplar, Instagram ve TikTok algoritmalarında çok daha fazla gösterim alır. Araştırmalar, haftada en az 4-5 kez paylaşım yapan markaların organik erişiminin 3 kat daha yüksek olduğunu göstermektedir.\n\n**Adım 1: Hedeflerinizi Belirleyin**\nHer ay için net hedefler koyun: Takipçi artışı, etkileşim oranı, web sitesi trafiği veya satış dönüşümü. Hedeflerinize göre içerik türünüzü belirleyin.\n\n**Adım 2: Platform ve Format Seçimi**\nHer platform farklı içerik formatı gerektirir. Instagram için Reels ve carousel gönderiler; TikTok için trend sesler ve duet formatları; LinkedIn için uzun form içerikler tercih edilmelidir.\n\n**Adım 3: İçerik Kategorileri Oluşturun**\n80/20 kuralını uygulayın: %80 eğitici/eğlenceli içerik, %20 tanıtım içeriği. Örnek kategoriler: Eğitici içerik, Müşteri hikayeleri, Perde arkası, Kullanıcı içerikleri (UGC), Trend tepkileri.\n\n**Adım 4: Planlama Araçları**\nBuffer, Later, Hootsuite veya Meta Business Suite gibi planlama araçlarını kullanarak içeriklerinizi önceden planlayın ve otomatik olarak yayınlayın.\n\n**Adım 5: Analiz ve Optimizasyon**\nHer ay performans verilerini analiz edin. Hangi içerikler en fazla etkileşim aldı? Bu öğrenimleri bir sonraki aya taşıyın.\n\n**Kade Media'nın Önerisi:** İçerik takvimini başarıyla uygulayan markalar, ortalama %150 daha fazla organik erişim ve %200 daha yüksek etkileşim oranı elde etmektedir.`,
    contentEn: `A content calendar is the backbone of social media management. A systematic plan is essential for making regular and consistent posts.\n\n**Why Is a Content Calendar Important?**\nInconsistent posting is penalized by algorithms. Accounts that post regularly get significantly more impressions on Instagram and TikTok algorithms. Research shows that brands posting at least 4-5 times per week have 3x higher organic reach.\n\n**Step 1: Set Your Goals**\nSet clear monthly goals: follower growth, engagement rate, website traffic, or sales conversion. Choose your content type based on your goals.\n\n**Step 2: Platform and Format Selection**\nEach platform requires different content formats. Instagram needs Reels and carousel posts; TikTok needs trending sounds and duet formats; LinkedIn prefers long-form content.\n\n**Step 3: Create Content Categories**\nApply the 80/20 rule: 80% educational/entertaining content, 20% promotional content. Example categories: Educational content, Customer stories, Behind the scenes, User-generated content (UGC), Trend reactions.\n\n**Step 4: Planning Tools**\nUse planning tools like Buffer, Later, Hootsuite, or Meta Business Suite to plan your content in advance and publish automatically.\n\n**Step 5: Analysis and Optimization**\nAnalyze performance data monthly. Which content got the most engagement? Carry these learnings into the next month.\n\n**Kade Media's Recommendation:** Brands that successfully implement a content calendar achieve an average of 150% more organic reach and 200% higher engagement rates.`,
    category: 'Strateji', categoryEn: 'Strategy',
    date: '12 Şub 2025', readTime: 5, image: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=800&q=80', color: '#9C27B0',
  },
  {
    slug: 'kade-media-sosyal-medya-ajans-istanbul',
    titleTr: 'Kade Media: İstanbul\'un Yükselen Sosyal Medya Ajansı',
    titleEn: 'Kade Media: Istanbul\'s Rising Social Media Agency',
    excerptTr: 'Kade Media olarak markaları dijital dünyada büyütüyor, sosyal medya stratejileriyle fark yaratıyoruz. İstanbul\'dan Türkiye\'ye ve dünyaya.',
    excerptEn: 'At Kade Media, we grow brands in the digital world and make a difference with social media strategies. From Istanbul to Turkey and the world.',
    contentTr: `Kade Media, 2023 yılında İstanbul Biruni Teknopark'ta kurulmuş, sosyal medya yönetimi ve dijital pazarlama alanında uzmanlaşmış bir medya ajansıdır.\n\n**Neden Kade Media?**\nSosyal medya ajansı seçimi, markanızın dijital kimliğini şekillendirecek en kritik kararlardan biridir. Kade Media olarak fark yaratan üç temel özelliğimiz var:\n\n1. **Veri Odaklı Strateji:** Her karar, veriye dayalı içgörülerle alınır. Sezgiyle değil, analizle hareket ediyoruz.\n2. **Yaratıcı İçerik Üretimi:** Takipçilerin duraksayıp izlemek isteyeceği içerikler üretiyoruz. Dikkat ekonomisinde dikkat çekmek sanatımız.\n3. **Şeffaf Raporlama:** Aylık ve haftalık raporlarla her metriği paylaşıyoruz. Paranızın nereye gittiğini her zaman biliyorsunuz.\n\n**Kade Media Hizmetleri**\n- Sosyal medya yönetimi (Instagram, TikTok, YouTube, LinkedIn)\n- İçerik üretimi (grafik tasarım, video prodüksiyon, copywriting)\n- Performance marketing (Meta Ads, Google Ads, TikTok Ads)\n- Influencer marketing\n- Marka stratejisi ve danışmanlık\n\n**Biruni Teknopark'ta Konumlanmanın Avantajı**\nİstanbul'un teknoloji üssü Biruni Teknopark'ta yer almak, bize en güncel teknoloji ve pazarlama trendlerine anında erişim sağlıyor. İnovasyon odaklı ekibimiz, markanızı geleceğe taşıyor.\n\n**Ücretsiz Keşif Görüşmesi**\nMarkanızın dijital potansiyelini keşfetmek için ücretsiz keşif görüşmesi talep edin. 30 dakikalık bu görüşmede markanız için özel bir strateji taslağı sunuyoruz.`,
    contentEn: `Kade Media is a media agency founded in 2023 at Istanbul Biruni Technopark, specializing in social media management and digital marketing.\n\n**Why Kade Media?**\nChoosing a social media agency is one of the most critical decisions that will shape your brand's digital identity. At Kade Media, we have three key differentiating features:\n\n1. **Data-Driven Strategy:** Every decision is made with data-driven insights. We act on analysis, not intuition.\n2. **Creative Content Production:** We produce content that followers will stop to watch. Getting attention in the attention economy is our art.\n3. **Transparent Reporting:** We share every metric with monthly and weekly reports. You always know where your money is going.\n\n**Kade Media Services**\n- Social media management (Instagram, TikTok, YouTube, LinkedIn)\n- Content production (graphic design, video production, copywriting)\n- Performance marketing (Meta Ads, Google Ads, TikTok Ads)\n- Influencer marketing\n- Brand strategy and consulting\n\n**The Advantage of Being at Biruni Technopark**\nBeing located at Biruni Technopark, Istanbul's technology hub, gives us immediate access to the most up-to-date technology and marketing trends. Our innovation-focused team takes your brand into the future.\n\n**Free Discovery Meeting**\nRequest a free discovery meeting to discover your brand's digital potential. In this 30-minute meeting, we present a custom strategy outline for your brand.`,
    category: 'Kade Media', categoryEn: 'Kade Media',
    date: '1 Nis 2025', readTime: 6, image: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&q=80', color: '#eac321',
  },
  {
    slug: 'sosyal-medya-yonetimi-ne-kadar-tutar',
    titleTr: 'Sosyal Medya Yönetimi Ne Kadar Tutar? 2025 Türkiye Fiyatları',
    titleEn: 'How Much Does Social Media Management Cost? 2025 Turkey Prices',
    excerptTr: '2025 yılında sosyal medya ajansı fiyatları, ne dahil, ne değil ve nasıl doğru ajansı seçersiniz? Kapsamlı rehber.',
    excerptEn: 'Social media agency prices in 2025, what\'s included, what\'s not, and how to choose the right agency? Comprehensive guide.',
    contentTr: `Sosyal medya yönetimi fiyatları, hizmet kapsamı ve ajansın deneyimine göre büyük farklılıklar gösterebilir. Bu rehberde 2025 Türkiye piyasasındaki gerçek fiyatları paylaşıyoruz.\n\n**Sosyal Medya Yönetim Fiyatları (2025)**\n\n**Başlangıç Paket:** 7.000 - 10.000 ₺/ay\n- 2-3 platform yönetimi\n- Aylık 16-20 içerik\n- Temel grafik tasarım\n- Aylık rapor\n\n**Büyüme Paketi:** 12.000 - 20.000 ₺/ay\n- 3-4 platform yönetimi\n- Aylık 30-40 içerik\n- Profesyonel grafik tasarım\n- Reels/video içerik\n- Haftalık rapor\n- Temel reklam yönetimi\n\n**Kurumsal Paket:** 25.000 - 40.000+ ₺/ay\n- Tüm platformlar\n- Sınırsız içerik\n- Premium tasarım\n- Gelişmiş reklam yönetimi\n- Influencer marketing\n- Anlık raporlama\n- Özel strateji danışmanı\n\n**Dikkat: Reklam Bütçesi Ayrı!**\nTüm bu fiyatlar yönetim ücretidir. Reklam harcaması (Meta Ads, Google Ads, vb.) bunların üzerine eklenir. Küçük işletmeler için aylık 2.000-5.000 ₺ reklam bütçesi genellikle yeterli başlangıç noktasıdır.\n\n**Fiyat Dışında Ne Sormalısınız?**\n1. Kaç müşteriyle çalışıyorlar? (20'den fazla marka = dikkat)\n2. Referans verebilirler mi?\n3. Raporlama sıklığı nedir?\n4. Acil durumlarda nasıl iletişim kurulur?\n5. Sözleşme koşulları nedir?\n\n**Kade Media Fiyatları**\nBizimle çalışmak için ücretsiz keşif görüşmesi talep edin. İhtiyaçlarınıza göre özel fiyat teklifi sunuyoruz.`,
    contentEn: `Social media management prices can vary greatly depending on the scope of service and the agency's experience. In this guide, we share real prices in the 2025 Turkey market.\n\n**Social Media Management Prices (2025)**\n\n**Starter Package:** 7,000 - 10,000 ₺/month\n- 2-3 platform management\n- 16-20 monthly content pieces\n- Basic graphic design\n- Monthly report\n\n**Growth Package:** 12,000 - 20,000 ₺/month\n- 3-4 platform management\n- 30-40 monthly content pieces\n- Professional graphic design\n- Reels/video content\n- Weekly report\n- Basic ad management\n\n**Enterprise Package:** 25,000 - 40,000+ ₺/month\n- All platforms\n- Unlimited content\n- Premium design\n- Advanced ad management\n- Influencer marketing\n- Real-time reporting\n- Dedicated strategy consultant\n\n**Note: Ad Budget is Separate!**\nAll these prices are management fees. Ad spending (Meta Ads, Google Ads, etc.) is added on top. For small businesses, a monthly ad budget of 2,000-5,000 ₺ is generally sufficient as a starting point.\n\n**What Should You Ask Beyond Price?**\n1. How many clients do they work with? (More than 20 brands = caution)\n2. Can they provide references?\n3. What is the reporting frequency?\n4. How is communication handled in emergencies?\n5. What are the contract terms?\n\n**Kade Media Prices**\nRequest a free discovery meeting to work with us. We provide custom pricing based on your needs.`,
    category: 'Rehber', categoryEn: 'Guide',
    date: '25 Mar 2025', readTime: 7, image: 'https://images.unsplash.com/photo-1553729459-uj68e2c73f3?w=800&q=80', color: '#2ECC71',
  },
  {
    slug: 'instagram-algoritma-2025',
    titleTr: 'Instagram Algoritması 2025: Hesabınızı Öne Çıkaran 10 Taktik',
    titleEn: 'Instagram Algorithm 2025: 10 Tactics to Boost Your Account',
    excerptTr: 'Instagram algoritması nasıl çalışıyor ve hesabınızı organik olarak büyütmenin 2025\'te işe yarayan yolları neler?',
    excerptEn: 'How does the Instagram algorithm work and what are the ways that actually work in 2025 to organically grow your account?',
    contentTr: `Instagram algoritması her yıl değişiyor ve 2025'te birçok önemli güncelleme hayata geçirildi. Organik erişiminizi artırmak için şu taktikleri uygulayın:\n\n**1. Reels'e Öncelik Verin**\nInstagram, video içerikleri görsellere göre %38 daha fazla öne çıkarıyor. Haftada en az 3 Reels paylaşımı hedefleyin.\n\n**2. İlk 30 Dakika Kritik**\nBir içeriği paylaştıktan sonra ilk 30 dakikada gelen etkileşimler, içeriğin başarısını belirliyor. Bu sürede aktif olun ve gelen yorumlara yanıt verin.\n\n**3. Carousel Gönderileri Kullanın**\nCarousel gönderiler, tek görsel paylaşımlara göre 3 kat daha fazla etkileşim alıyor. "Kaydet" ve "paylaş" gibi derinlemesine etkileşimleri teşvik ediyor.\n\n**4. Hashtag Stratejisi**\n2025'te 5-10 adet niş hashtag, 30 genel hashtag'den çok daha etkili. Hesabınızın büyüklüğüne uygun hashtag'ler kullanın.\n\n**5. Stories ile Günlük Görünürlük**\nGünde en az 3-5 Story paylaşımı, profilinizin takipçilerin önünde kalmasını sağlar. Anketler ve sorular etkileşimi artırır.\n\n**6. Profilinizi Optimize Edin**\nBiyografinizde anahtar kelimeler kullanın. "Sosyal medya ajansı Istanbul" gibi ifadeler arama sonuçlarında öne çıkmanızı sağlar.\n\n**7. Ses (Audio) Trendlerini Takip Edin**\nTrend sesler kullanmak, içeriğinizin Keşfet sayfasına düşme ihtimalini %70 artırıyor.\n\n**8. Düzenli Yayınlama Saati**\nHer gün aynı saatler civarında paylaşım yapın. Türkiye için ideal saatler: 12:00-14:00 ve 19:00-21:00.\n\n**9. Kapsamlı Açıklama Yazın**\nInstagram artık açıklamaları okuyor ve içeriği buna göre kategorize ediyor. 150-300 kelimelik açıklamalar, SEO etkisi yaratıyor.\n\n**10. Cross-Platform Paylaşım**\nInstagram içeriklerinizi TikTok, Facebook ve LinkedIn'de de paylaşın. Bu kross-platform varlığı marka bilinirliğini katlar.`,
    contentEn: `The Instagram algorithm changes every year and many important updates have been implemented in 2025. Apply these tactics to increase your organic reach:\n\n**1. Prioritize Reels**\nInstagram promotes video content 38% more than images. Aim for at least 3 Reels posts per week.\n\n**2. The First 30 Minutes Are Critical**\nInteractions in the first 30 minutes after posting determine a content's success. Be active during this period and respond to incoming comments.\n\n**3. Use Carousel Posts**\nCarousel posts get 3x more engagement than single image posts. They encourage deep interactions like "saves" and "shares."\n\n**4. Hashtag Strategy**\nIn 2025, 5-10 niche hashtags are much more effective than 30 general hashtags. Use hashtags appropriate for your account size.\n\n**5. Daily Visibility with Stories**\nPosting at least 3-5 Stories per day keeps your profile in front of followers. Polls and questions increase engagement.\n\n**6. Optimize Your Profile**\nUse keywords in your bio. Phrases like "Social media agency Istanbul" help you appear in search results.\n\n**7. Follow Audio (Sound) Trends**\nUsing trending sounds increases the chance of your content landing on the Explore page by 70%.\n\n**8. Regular Posting Time**\nPost around the same times every day. Ideal times for Turkey: 12:00-14:00 and 19:00-21:00.\n\n**9. Write Comprehensive Captions**\nInstagram now reads captions and categorizes content accordingly. Captions of 150-300 words create an SEO effect.\n\n**10. Cross-Platform Sharing**\nShare your Instagram content on TikTok, Facebook, and LinkedIn too. This cross-platform presence multiplies brand awareness.`,
    category: 'Instagram', categoryEn: 'Instagram',
    date: '18 Mar 2025', readTime: 9, image: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=800&q=80', color: '#E91E63',
  },
  {
    slug: 'kade-media-ajans-neden-secmeli',
    titleTr: 'Sosyal Medya Ajansı Seçerken Dikkat Edilmesi Gereken 7 Kriter',
    titleEn: '7 Criteria to Consider When Choosing a Social Media Agency',
    excerptTr: 'Yanlış ajans seçimi hem para hem zaman kaybettirir. Doğru kararı vermeniz için 7 kritik kriteri paylaşıyoruz.',
    excerptEn: 'Choosing the wrong agency wastes both money and time. We share 7 critical criteria to help you make the right decision.',
    contentTr: `Türkiye'de yüzlerce sosyal medya ajansı faaliyet gösteriyor. Doğru seçimi yapmak için şu 7 kriteri göz önünde bulundurun:\n\n**1. Portföy ve Referans**\nAjansin daha önce çalıştığı markalar ve başardığı sonuçlar en güvenilir kanıttır. Gerçek rakamlar isteyin: "Takipçi artışı %300" yerine "Takipçi sayısı 5.000'den 20.000'e çıktı" gibi somut veriler.\n\n**2. Sektör Deneyimi**\nKendi sektörünüzde deneyimi olan bir ajans, hedef kitlenizi ve rakiplerinizi zaten tanıyor. Bu avantaj, stratejinin kurulum süresini kısaltır.\n\n**3. İçerik Kalitesi**\nAjansin kendi sosyal medya hesaplarına bakın. Kendi markalarını nasıl yönetiyor? Paylaştıkları içerikler kaliteliyse, sizin için de kaliteli içerik üreteceklerdir.\n\n**4. Raporlama Şeffaflığı**\nAylık raporlama mı, haftalık mı? Hangi metrikler takip ediliyor? Şeffaf raporlama yapan ajanslar güvenilirdir.\n\n**5. İletişim Hızı**\nWhatsApp'tan veya e-posta ile mesaj attığınızda ne kadar sürede yanıt alıyorsunuz? Müşteri hizmetleri kalitesi, çalışma sürecinin de kalitesini yansıtır.\n\n**6. Fiyatlandırma Şeffaflığı**\nNet fiyatlar mı veriyorlar, yoksa görüşmeden önce fiyat vermiyor mu? Şeffaf fiyatlandırma, dürüst iş ilişkisinin işaretidir.\n\n**7. Sözleşme Koşulları**\nMinimum sözleşme süresi, fesih koşulları ve fikri mülkiyet hakları mutlaka netleştirilmeli.\n\n**Kade Media Farkı**\nBu 7 kriterin hepsinde güçlü olduğumuzu iddia ediyoruz. Bunu kanıtlamak için ücretsiz keşif görüşmesinde referanslarımızı, çalışma sürecimizi ve fiyatlarımızı şeffaf biçimde paylaşıyoruz.`,
    contentEn: `Hundreds of social media agencies operate in Turkey. Consider these 7 criteria to make the right choice:\n\n**1. Portfolio and References**\nThe brands an agency has previously worked with and the results they've achieved is the most reliable evidence. Ask for real numbers: concrete data like "Follower count grew from 5,000 to 20,000" rather than "300% follower growth."\n\n**2. Industry Experience**\nAn agency with experience in your industry already knows your target audience and competitors. This advantage shortens the strategy setup time.\n\n**3. Content Quality**\nLook at the agency's own social media accounts. How do they manage their own brand? If the content they share is high quality, they'll produce quality content for you too.\n\n**4. Reporting Transparency**\nMonthly reporting or weekly? Which metrics are tracked? Agencies that report transparently are trustworthy.\n\n**5. Communication Speed**\nHow quickly do you get a response when you message via WhatsApp or email? Customer service quality reflects the quality of the working process.\n\n**6. Pricing Transparency**\nDo they give clear prices, or do they not give prices before a meeting? Transparent pricing is a sign of an honest business relationship.\n\n**7. Contract Terms**\nMinimum contract duration, termination conditions, and intellectual property rights must be clarified.\n\n**The Kade Media Difference**\nWe claim to be strong in all 7 of these criteria. To prove it, in our free discovery meeting we transparently share our references, work process, and prices.`,
    category: 'Rehber', categoryEn: 'Guide',
    date: '5 Nis 2025', readTime: 8, image: 'https://images.unsplash.com/photo-1553484771-8bbd5e485ce0?w=800&q=80', color: '#00BCD4',
  },
];

const defaultContent = [
  {
    section: 'hero',
    data: {
      tr: { title1: 'Dijital Dünyada', title2: 'Markanızı Büyütün', subtitle: 'Kade Media olarak sosyal medya stratejileri, kreatif içerik üretimi ve dijital pazarlama çözümleriyle markanızı zirveye taşıyoruz.' },
      en: { title1: 'Grow Your Brand', title2: 'In The Digital World', subtitle: 'At Kade Media, we take your brand to the top with social media strategies, creative content production, and digital marketing solutions.' },
    }
  },
  {
    section: 'stats',
    data: {
      clients: '150+',
      followers: '2M+',
      campaigns: '500+',
      satisfaction: '98%',
    }
  },
  {
    section: 'footer',
    data: {
      email: 'hello@kademedia.com',
      phone: '0 506 729 34 23',
      address: 'Biruni Teknopark, Zeytinburnu/İstanbul',
      instagram: 'https://instagram.com/kademediacom',
      twitter: 'https://x.com/kademediacom',
      youtube: 'https://www.youtube.com/@kademediacom',
      tiktok: 'https://tiktok.com/@kademediacom',
      linkedin: 'https://www.linkedin.com/company/kademediaagency',
      whatsapp: 'https://wa.me/905067293423',
    }
  },
];

export default async function handler(req, res) {
  if (cors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Use POST to seed the database' });
  }

  const seedSecret = process.env.SEED_SECRET;
  if (!seedSecret) {
    return res.status(500).json({ error: 'SEED_SECRET environment variable is not set' });
  }

  const { secret } = req.body || {};
  if (secret !== seedSecret) {
    return res.status(403).json({ error: 'Invalid seed secret' });
  }

  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!adminPassword) {
    return res.status(500).json({ error: 'SEED_ADMIN_PASSWORD environment variable is not set' });
  }

  try {
    const db = await getDb();

    // Create admin user
    const existingAdmin = await db.collection('users').findOne({ username: 'kade' });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      await db.collection('users').insertOne({
        username: 'kade',
        password: hashedPassword,
        role: 'admin',
        createdAt: new Date(),
      });
    }

    // Seed partners
    const partnerCount = await db.collection('partners').countDocuments();
    if (partnerCount === 0) {
      const partners = defaultPartners.map(p => ({ ...p, createdAt: new Date(), updatedAt: new Date() }));
      await db.collection('partners').insertMany(partners);
    }

    // Seed blogs
    const blogCount = await db.collection('blogs').countDocuments();
    if (blogCount === 0) {
      const blogs = defaultBlogs.map(b => ({ ...b, createdAt: new Date(), updatedAt: new Date() }));
      await db.collection('blogs').insertMany(blogs);
    }

    // Seed site content
    const contentCount = await db.collection('siteContent').countDocuments();
    if (contentCount === 0) {
      const content = defaultContent.map(c => ({ ...c, createdAt: new Date(), updatedAt: new Date() }));
      await db.collection('siteContent').insertMany(content);
    }

    return res.status(200).json({
      message: 'Veritabanı başarıyla oluşturuldu!',
      seeded: {
        admin: !existingAdmin ? 'Oluşturuldu' : 'Zaten mevcut',
        partners: partnerCount === 0 ? `${defaultPartners.length} partner eklendi` : 'Zaten mevcut',
        blogs: blogCount === 0 ? `${defaultBlogs.length} blog eklendi` : 'Zaten mevcut',
        content: contentCount === 0 ? `${defaultContent.length} içerik eklendi` : 'Zaten mevcut',
      }
    });
  } catch (error) {
    console.error('Seed error:', error);
    return res.status(500).json({ error: 'Seed hatası: ' + error.message });
  }
}
