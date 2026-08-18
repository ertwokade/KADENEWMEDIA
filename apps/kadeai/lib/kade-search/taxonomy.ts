/**
 * Kategori ve icerik formati taksonomisi.
 * Anahtar kelimeler Turkce + Ingilizce; normalizeText() ile karsilastirilir.
 */

export interface CategoryDef { label: string; emoji: string; keywords: string[] }

export const CATEGORIES: Record<string, CategoryDef> = {
  dans: {
    label: 'Dans & Koreografi',
    emoji: '💃',
    keywords: ['dans', 'dance', 'koreografi', 'choreography', 'dancing', 'dancer', 'halay', 'zeybek', 'twerk', 'shuffle', 'kbop dance', 'dance challenge', 'akim dans', 'step', 'moves'],
  },
  muzik: {
    label: 'Müzik & Ses',
    emoji: '🎵',
    keywords: ['muzik', 'music', 'song', 'sarki', 'sound', 'ses', 'remix', 'cover', 'beat', 'nakarat', 'lyrics', 'sozleri', 'rap', 'pop', 'arabesk', 'slowed', 'sped up', 'mashup', 'audio', 'siir', 'nostalji sarki'],
  },
  komedi: {
    label: 'Komedi & Skeç',
    emoji: '😂',
    keywords: ['komik', 'komedi', 'funny', 'comedy', 'skec', 'sketch', 'meme', 'mizah', 'espri', 'prank', 'saka', 'troll', 'kahkaha', 'gulme', 'absurt', 'parodi', 'parody', 'stand up', 'caps'],
  },
  yemek: {
    label: 'Yemek & Mutfak',
    emoji: '🍳',
    keywords: ['yemek', 'tarif', 'recipe', 'food', 'cooking', 'mutfak', 'tatli', 'dessert', 'kahvalti', 'breakfast', 'asmr yemek', 'mukbang', 'restoran', 'restaurant', 'cafe', 'kahve', 'coffee', 'baking', 'hamur', 'kek', 'pasta', 'street food', 'sokak lezzetleri', 'diyet tarif'],
  },
  guzellik: {
    label: 'Güzellik & Makyaj',
    emoji: '💄',
    keywords: ['makyaj', 'makeup', 'guzellik', 'beauty', 'cilt', 'skincare', 'skin care', 'ruj', 'far', 'kirpik', 'sac', 'hair', 'hairstyle', 'kuafor', 'manikur', 'nail', 'tirnak', 'grwm', 'get ready', 'kozmetik', 'parfum', 'glow up', 'rutin'],
  },
  moda: {
    label: 'Moda & Stil',
    emoji: '👗',
    keywords: ['moda', 'fashion', 'kombin', 'outfit', 'ootd', 'stil', 'style', 'giyim', 'kiyafet', 'haul', 'thrift', 'ayakkabi', 'sneaker', 'canta', 'aksesuar', 'trend kiyafet', 'lookbook', 'try on', 'vintage', 'streetwear'],
  },
  fitness: {
    label: 'Fitness & Spor',
    emoji: '💪',
    keywords: ['fitness', 'spor', 'antrenman', 'workout', 'gym', 'egzersiz', 'kas', 'kilo verme', 'diyet', 'diet', 'kosu', 'running', 'yoga', 'pilates', 'protein', 'vucut gelistirme', 'bodybuilding', 'crossfit', 'transformation', 'kardiyo', 'futbol', 'basketbol', 'mac', 'soccer', 'football', 'nba', 'sport'],
  },
  saglik: {
    label: 'Sağlık & Wellness',
    emoji: '🧘',
    keywords: ['saglik', 'health', 'wellness', 'psikoloji', 'mental', 'terapi', 'therapy', 'uyku', 'sleep', 'meditasyon', 'meditation', 'anksiyete', 'stres', 'doktor', 'hastalik', 'vitamin', 'nefes', 'mindfulness'],
  },
  oyun: {
    label: 'Oyun & Gaming',
    emoji: '🎮',
    keywords: ['oyun', 'game', 'gaming', 'gamer', 'valorant', 'minecraft', 'roblox', 'fortnite', 'pubg', 'lol', 'league of legends', 'cs2', 'counter strike', 'gta', 'fifa', 'ea fc', 'zula', 'metin2', 'clip', 'gameplay', 'speedrun', 'twitch', 'konsol', 'playstation', 'xbox', 'steam', 'mobil oyun'],
  },
  teknoloji: {
    label: 'Teknoloji & Yazılım',
    emoji: '📱',
    keywords: ['teknoloji', 'tech', 'telefon', 'phone', 'iphone', 'android', 'samsung', 'bilgisayar', 'laptop', 'yazilim', 'software', 'kod', 'coding', 'programlama', 'developer', 'gadget', 'inceleme', 'review', 'unboxing', 'kulaklik', 'apple', 'robot', 'drone', 'elektrikli araba'],
  },
  yapayzeka: {
    label: 'Yapay Zeka',
    emoji: '🤖',
    keywords: ['yapay zeka', 'ai', 'artificial intelligence', 'chatgpt', 'claude', 'midjourney', 'sora', 'prompt', 'gpt', 'llm', 'ai video', 'ai art', 'ai filtre', 'yapayzeka', 'deepfake', 'ai cover', 'otomasyon', 'ajan', 'agent'],
  },
  egitim: {
    label: 'Eğitim & Bilgi',
    emoji: '📚',
    keywords: ['egitim', 'ders', 'education', 'ogren', 'learn', 'bilgi', 'nasil yapilir', 'how to', 'tutorial', 'ipucu', 'tips', 'yks', 'sinav', 'universite', 'okul', 'ingilizce', 'dil ogren', 'matematik', 'tarih', 'bilim', 'science', 'fizik', 'kimya', 'deney', 'ilginc bilgi', 'did you know', 'biliyor muydunuz'],
  },
  finans: {
    label: 'Finans & Para',
    emoji: '💰',
    keywords: ['para', 'money', 'finans', 'finance', 'yatirim', 'invest', 'borsa', 'kripto', 'crypto', 'bitcoin', 'dolar', 'altin', 'ekonomi', 'economy', 'girisim', 'startup', 'is fikri', 'business', 'gelir', 'passive income', 'freelance', 'e ticaret', 'dropshipping', 'kariyer', 'maas'],
  },
  seyahat: {
    label: 'Seyahat & Gezi',
    emoji: '✈️',
    keywords: ['seyahat', 'travel', 'gezi', 'tatil', 'vacation', 'otel', 'hotel', 'ucak', 'flight', 'kamp', 'camping', 'karavan', 'dogal', 'sehir', 'city', 'istanbul', 'kapadokya', 'antalya', 'bali', 'dubai', 'roadtrip', 'backpack', 'vize', 'yurt disi', 'gezilecek yerler'],
  },
  hayvan: {
    label: 'Hayvanlar & Evcil',
    emoji: '🐶',
    keywords: ['kedi', 'cat', 'kopek', 'dog', 'hayvan', 'animal', 'pet', 'evcil', 'yavru', 'puppy', 'kitten', 'kus', 'balik', 'at', 'papagan', 'hamster', 'veteriner', 'sokak hayvani', 'sevimli hayvan'],
  },
  aile: {
    label: 'Aile & Çocuk',
    emoji: '👨‍👩‍👧',
    keywords: ['aile', 'family', 'cocuk', 'kid', 'bebek', 'baby', 'anne', 'mom', 'baba', 'dad', 'hamile', 'pregnancy', 'ebeveyn', 'parenting', 'kardes', 'dogum gunu', 'evlilik', 'wedding', 'dugun', 'nisan', 'iliski', 'relationship', 'sevgili', 'couple'],
  },
  yasam: {
    label: 'Yaşam & Vlog',
    emoji: '🌤️',
    keywords: ['vlog', 'gunluk', 'daily', 'yasam', 'lifestyle', 'rutin', 'routine', 'sabah rutini', 'morning routine', 'gece rutini', 'day in my life', 'bir gunum', 'productivity', 'verimlilik', 'planlama', 'journal', 'minimalizm', 'aesthetic'],
  },
  ev: {
    label: 'Ev & Dekorasyon',
    emoji: '🏠',
    keywords: ['ev', 'home', 'dekorasyon', 'decor', 'tadilat', 'renovation', 'mobilya', 'furniture', 'temizlik', 'cleaning', 'organizasyon', 'organize', 'bahce', 'garden', 'bitki', 'plant', 'oda turu', 'room tour', 'ikea', 'diy ev', 'kiralik', 'emlak'],
  },
  diy: {
    label: 'El İşi & DIY',
    emoji: '🛠️',
    keywords: ['diy', 'kendin yap', 'el isi', 'craft', 'hobi', 'hobby', 'orgu', 'knitting', 'dikis', 'sewing', 'resim', 'painting', 'cizim', 'drawing', 'art', 'sanat', 'seramik', 'ahsap', 'woodworking', 'tamir', 'restorasyon', 'satisfying'],
  },
  otomobil: {
    label: 'Otomobil & Motor',
    emoji: '🚗',
    keywords: ['araba', 'car', 'otomobil', 'motor', 'motorcycle', 'motosiklet', 'modifiye', 'drift', 'yaris', 'race', 'tesla', 'bmw', 'mercedes', 'tofas', 'sahin', 'togg', 'lastik', 'oto', 'kamyon', 'traktor', 'sürüş'],
  },
  film: {
    label: 'Film & Dizi',
    emoji: '🎬',
    keywords: ['film', 'movie', 'dizi', 'series', 'netflix', 'sahne', 'scene', 'edit', 'fragman', 'trailer', 'oyuncu', 'actor', 'sinema', 'cinema', 'anime', 'manga', 'kore dizi', 'kdrama', 'disney', 'marvel', 'spoiler', 'inceleme film'],
  },
  unlu: {
    label: 'Ünlüler & Magazin',
    emoji: '⭐',
    keywords: ['unlu', 'celebrity', 'magazin', 'gossip', 'dedikodu', 'fenomen', 'influencer', 'youtuber', 'tiktoker', 'sanatci', 'sarkici', 'star', 'red carpet', 'yaris programi', 'survivor', 'masterchef', 'kizilcik', 'reality'],
  },
  haber: {
    label: 'Haber & Gündem',
    emoji: '📰',
    keywords: ['haber', 'news', 'gundem', 'son dakika', 'breaking', 'siyaset', 'politics', 'secim', 'election', 'deprem', 'earthquake', 'hava durumu', 'weather', 'olay', 'aciklama', 'protesto', 'dunya', 'analiz'],
  },
  spiritual: {
    label: 'Astroloji & Spiritüel',
    emoji: '🔮',
    keywords: ['burc', 'astroloji', 'zodiac', 'horoscope', 'tarot', 'fal', 'ruya', 'dream', 'manifest', 'enerji', 'spiritual', 'ruh', 'meditasyon spiritual', 'kader', 'yildiz haritasi', 'numeroloji'],
  },
  korku: {
    label: 'Gizem & Korku',
    emoji: '👻',
    keywords: ['korku', 'horror', 'gizem', 'mystery', 'komplo', 'conspiracy', 'paranormal', 'hayalet', 'ghost', 'creepy', 'urkutucu', 'gercek hikaye', 'cozulmemis', 'suc', 'true crime', 'cinayet', 'kayip'],
  },
  isyeri: {
    label: 'İş Hayatı & Ofis',
    emoji: '💼',
    keywords: ['ofis', 'office', 'is hayati', 'corporate', 'patron', 'boss', 'mulakat', 'interview', 'cv', 'kariyer', 'is arkadasi', 'toplanti', 'meeting', 'remote', 'uzaktan calisma', 'is guvenligi', 'mesai'],
  },
  toplum: {
    label: 'Sokak Röportajı & Toplum',
    emoji: '🎤',
    keywords: ['sokak roportaji', 'street interview', 'roportaj', 'anket', 'sosyal deney', 'social experiment', 'toplum', 'insanlar', 'random kisi', 'mikrofon', 'soru sorduk', 'vox pop'],
  },
  diger: { label: 'Diğer', emoji: '📦', keywords: [] },
};

/**
 * Icerik formatlari (video kalibi / anlatim bicimi).
 * Bir icerik birden fazla formata sahip olabilir.
 */
export interface FormatDef { label: string; desc: string; keywords: string[] }

export const FORMATS: Record<string, FormatDef> = {
  pov: { label: 'POV', desc: 'Izleyiciyi bir rolun icine sokan bakis acisi videosu', keywords: ['pov', 'p.o.v', 'bakis acisi', 'senin gozunden', 'imagine you'] },
  gecis: { label: 'Geçiş / Transition', desc: 'Kesme veya efektle ani gorsel gecis', keywords: ['transition', 'gecis', 'outfit change', 'kiyafet degisimi', 'snap transition', 'donusum gecis'] },
  onceSonra: { label: 'Önce / Sonra', desc: 'Degisimi karsilastiran kalip', keywords: ['before after', 'once sonra', 'transformation', 'donusum', 'glow up', 'makeover', 'degisim'] },
  ogretici: { label: 'Öğretici / Tutorial', desc: 'Adim adim yapim anlatimi', keywords: ['tutorial', 'nasil yapilir', 'how to', 'adim adim', 'step by step', 'ogretiyorum', 'rehber', 'guide', 'diy tutorial'] },
  liste: { label: 'Liste / Top N', desc: 'Siralama veya derleme', keywords: ['top 5', 'top 10', 'en iyi', '5 sey', '3 ipucu', 'listesi', 'tier list', 'ranking', 'siralama'] },
  hikaye: { label: 'Storytime', desc: 'Kisisel anlati / hikaye anlatimi', keywords: ['storytime', 'hikaye', 'basima gelen', 'anlatiyorum', 'story time', 'gercek hikaye', 'itiraf'] },
  challenge: { label: 'Challenge / Akım', desc: 'Tekrarlanabilir meydan okuma kalibi', keywords: ['challenge', 'akim', 'meydan okuma', 'trend challenge', '24 saat', '30 gun', 'deneme', 'dare'] },
  duet: { label: 'Duet / Stitch / Yanıt', desc: 'Baska bir icerige yanit veren format', keywords: ['duet', 'stitch', 'yanit', 'reply', 'reaction', 'tepki', 'react', 'cevap videosu'] },
  asmr: { label: 'ASMR / Satisfying', desc: 'Ses veya gorsel tatmin odakli', keywords: ['asmr', 'satisfying', 'tatmin edici', 'crunchy', 'ses', 'relaxing', 'rahatlatici', 'slime'] },
  greenScreen: { label: 'Green Screen / Anlatım', desc: 'Ekran arkasinda gorsel ile anlatim', keywords: ['green screen', 'yesil ekran', 'ekranda anlatim', 'haber anlatimi', 'explainer'] },
  vlog: { label: 'Vlog / Günlük', desc: 'Gunluk hayat kaydi', keywords: ['vlog', 'day in my life', 'bir gunum', 'gunluk', 'daily vlog', 'rutin'] },
  roportaj: { label: 'Röportaj', desc: 'Soru-cevap, sokak roportaji', keywords: ['roportaj', 'interview', 'sokak roportaji', 'soru sorduk', 'anket'] },
  edit: { label: 'Edit / Kurgu', desc: 'Muzikli hizli kurgu, fan edit', keywords: ['edit', 'fan edit', 'amv', 'edit audio', 'kurgu', 'montaj', 'velocity edit', 'cinematic'] },
  skec: { label: 'Skeç / Canlandırma', desc: 'Oyunculuk temelli kisa sahne', keywords: ['skec', 'sketch', 'canlandirma', 'karakter', 'oyunculuk', 'parodi', 'taklit'] },
  test: { label: 'Test / Deney', desc: 'Bir seyi test etme, deneme', keywords: ['test ettim', 'denedim', 'experiment', 'deney', 'i tested', 'gercek mi', 'calisiyor mu'] },
  unboxing: { label: 'Unboxing / Haul', desc: 'Kutu acilimi, alisveris derlemesi', keywords: ['unboxing', 'kutu acilimi', 'haul', 'alisveris', 'shopping', 'geldi', 'kargo'] },
  behindScenes: { label: 'Kamera Arkası', desc: 'Uretim sureci gosterimi', keywords: ['kamera arkasi', 'behind the scenes', 'bts', 'nasil cekildi', 'making of', 'surec'] },
  tartisma: { label: 'Tartışma / Görüş', desc: 'Fikir beyani, hot take', keywords: ['hot take', 'tartisma', 'gorusum', 'bence', 'unpopular opinion', 'elestiri', 'karsi cikiyorum', 'debate'] },
  mikroDram: { label: 'Mini Dizi / Seri', desc: 'Bolumlere bolunmus seri anlati', keywords: ['bolum 1', 'part 1', 'seri', 'devami', 'mini dizi', 'episode', '2. bolum'] },
  soru: { label: 'Kanca Soru', desc: 'Merak uyandiran acilis sorusu', keywords: ['kimse bilmiyor', 'biliyor muydunuz', 'did you know', 'sizce', 'bunu biliyor musunuz', 'sirri'] },
};

const PLATFORM_LABELS: Record<string, string> = {
  tiktok: 'TikTok',
  youtube: 'YouTube',
  youtube_shorts: 'YouTube Shorts',
  instagram: 'Instagram',
  google: 'Google Trends',
  reddit: 'Reddit',
  music: 'Müzik Listeleri',
};

export interface StageDef { label: string; emoji: string; desc: string; color: string }

export const STAGES: Record<string, StageDef> = {
  emerging: { label: 'Yükselen Filiz', emoji: '🌱', desc: 'Henuz kucuk ama hizli buyuyor - en iyi giris ani', color: '#22c55e' },
  rising: { label: 'Yükselişte', emoji: '📈', desc: 'Guclu buyume devam ediyor - hala erken', color: '#84cc16' },
  peak: { label: 'Zirvede', emoji: '🔥', desc: 'Maksimum ilgi - rekabet yuksek ama erisim buyuk', color: '#f97316' },
  plateau: { label: 'Plato', emoji: '➖', desc: 'Buyume durdu, doygunluk yakin', color: '#94a3b8' },
  declining: { label: 'Düşüşte', emoji: '📉', desc: 'Ilgi azaliyor - yeni icerik icin gec', color: '#ef4444' },
  dead: { label: 'Sönmüş', emoji: '💀', desc: 'Trend bitti', color: '#64748b' },
};

export function platformLabel(p: string) {
  return PLATFORM_LABELS[p] ?? p;
}

export const KIND_LABELS: Record<string, string> = {
  hashtag: 'Hashtag',
  sound: 'Ses / Şarkı',
  video: 'Video',
  creator: 'İçerik Üretici',
  topic: 'Konu',
  keyword: 'Anahtar Kelime',
  format: 'Format',
  challenge: 'Akım',
};

export const categoryList = () =>
  Object.entries(CATEGORIES).map(([key, v]) => ({ key, label: v.label, emoji: v.emoji }));

export const formatList = () =>
  Object.entries(FORMATS).map(([key, v]) => ({ key, label: v.label, desc: v.desc }));
