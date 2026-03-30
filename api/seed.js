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
    servicesTr: ['Sosyal Medya Yönetimi', 'İçerik Üretimi', 'Reklam Yönetimi', 'Influencer Marketing'],
    servicesEn: ['Social Media Management', 'Content Production', 'Ad Management', 'Influencer Marketing'],
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
    servicesTr: ['TikTok Yönetimi', 'Video Prodüksiyon', 'Influencer Marketing', 'Reklam Yönetimi'],
    servicesEn: ['TikTok Management', 'Video Production', 'Influencer Marketing', 'Ad Management'],
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
    servicesTr: ['Video Prodüksiyon', 'Performance Marketing', 'Influencer Marketing', 'Sosyal Medya Yönetimi'],
    servicesEn: ['Video Production', 'Performance Marketing', 'Influencer Marketing', 'Social Media Management'],
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
    date: '15 Mar 2025', readTime: 8, image: '📱', color: '#6C63FF',
  },
  {
    slug: 'instagram-reels-stratejisi',
    titleTr: 'Instagram Reels ile Etkileşimi 10x Artırmanın Yolları',
    titleEn: '10 Ways to 10x Your Engagement with Instagram Reels',
    excerptTr: 'Reels algoritmasını nasıl çalıştığını ve etkileşim artırma stratejilerini bu rehberde bulacaksınız.',
    excerptEn: 'Learn how the Reels algorithm works and engagement-boosting strategies in this guide.',
    contentTr: '', contentEn: '',
    category: 'İçerik Stratejisi', categoryEn: 'Content Strategy',
    date: '10 Mar 2025', readTime: 6, image: '🎬', color: '#E91E63',
  },
  {
    slug: 'meta-ads-optimizasyon',
    titleTr: 'Meta Ads: Reklam Bütçenizi Nasıl Optimize Edersiniz?',
    titleEn: 'Meta Ads: How to Optimize Your Ad Budget?',
    excerptTr: 'Facebook ve Instagram reklamlarında bütçe optimizasyonu hakkında bilmeniz gereken her şey.',
    excerptEn: 'Everything you need to know about budget optimization in Facebook and Instagram ads.',
    contentTr: '', contentEn: '',
    category: 'Reklam', categoryEn: 'Advertising',
    date: '5 Mar 2025', readTime: 10, image: '📊', color: '#FFD700',
  },
  {
    slug: 'tiktok-marka-buyutme',
    titleTr: 'TikTok\'ta Marka Büyütme: Başlangıçtan İleri Seviyeye',
    titleEn: 'Brand Growth on TikTok: From Beginner to Advanced',
    excerptTr: 'TikTok\'ta sıfırdan marka oluşturma ve viral olma taktikleri rehberi.',
    excerptEn: 'A guide to building a brand from scratch on TikTok and going viral.',
    contentTr: '', contentEn: '',
    category: 'TikTok', categoryEn: 'TikTok',
    date: '28 Şub 2025', readTime: 7, image: '🎵', color: '#2ECC71',
  },
  {
    slug: 'influencer-marketing-rehberi',
    titleTr: 'Influencer Marketing Rehberi: Doğru İş Birliğini Nasıl Kurarsınız?',
    titleEn: 'Influencer Marketing Guide: How to Build the Right Partnership?',
    excerptTr: 'Influencer seçiminden kampanya yönetimine kadar her şeyi kapsayan rehber.',
    excerptEn: 'A comprehensive guide covering everything from influencer selection to campaign management.',
    contentTr: '', contentEn: '',
    category: 'Influencer', categoryEn: 'Influencer',
    date: '20 Şub 2025', readTime: 9, image: '🤝', color: '#00BCD4',
  },
  {
    slug: 'icerik-takvimi-olusturma',
    titleTr: 'Etkili İçerik Takvimi Nasıl Oluşturulur?',
    titleEn: 'How to Create an Effective Content Calendar?',
    excerptTr: 'Sosyal medya için profesyonel bir içerik takvimi oluşturmanın adımları.',
    excerptEn: 'Steps to creating a professional content calendar for social media.',
    contentTr: '', contentEn: '',
    category: 'Strateji', categoryEn: 'Strategy',
    date: '12 Şub 2025', readTime: 5, image: '📅', color: '#9C27B0',
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

  // Simple secret check
  const { secret } = req.body || {};
  if (secret !== 'kademedia-seed-2026') {
    return res.status(403).json({ error: 'Invalid seed secret' });
  }

  try {
    const db = await getDb();

    // Create admin user
    const existingAdmin = await db.collection('users').findOne({ username: 'kade' });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('kade', 10);
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
        admin: !existingAdmin ? 'Oluşturuldu (kade/kade)' : 'Zaten mevcut',
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
