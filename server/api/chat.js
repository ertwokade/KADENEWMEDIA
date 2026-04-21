import { cors } from './_lib/cors.js';
import { rateLimitCheck } from './_lib/rateLimit.js';
import { requireAuth } from './_lib/auth.js';
import { getDb } from './_lib/mongodb.js';

async function logAiUsage(scope, model, usageMeta) {
  try {
    const db = await getDb();
    await db.collection('ai_usage').insertOne({
      scope,
      model,
      promptTokens: usageMeta?.promptTokenCount || 0,
      outputTokens: usageMeta?.candidatesTokenCount || 0,
      totalTokens: usageMeta?.totalTokenCount || 0,
      createdAt: new Date(),
    });
  } catch (e) { /* non-fatal */ }
}

const KADE_CONTEXT_TR = `Sen Kade Media'nın AI asistanısın. Kade Media İstanbul Biruni Teknopark'ta bulunan bir dijital pazarlama ajansıdır.
Kurucu: Kadir Demir. Şirket 8+ yıllık deneyime sahip, 5 kişilik uzman ekip, 100+ mutlu müşteri.
Hizmetler: Sosyal Medya Yönetimi, İçerik Üretimi, Reklam Yönetimi, Video Prodüksiyon, Strateji & Danışmanlık, Web Sitesi Tasarımı.
Paketler: Başlangıç ₺12.500/ay, Profesyonel ₺24.500/ay, Kurumsal ₺48.000/ay, Özel paket (teklif al).
İletişim: hello@kademedia.com, 0 506 729 34 23, Biruni Teknopark İstanbul.
Kısa, samimi ve yardımcı cevaplar ver. Emoji kullan. Belirsiz konularda WhatsApp'a yönlendir.`;

const KADE_CONTEXT_EN = `You are Kade Media's AI assistant. Kade Media is a digital marketing agency based in Biruni Teknopark, Istanbul.
Founder: Kadir Demir. 8+ years experience, 5-person expert team, 100+ happy clients.
Services: Social Media Management, Content Production, Ad Management, Video Production, Strategy & Consulting, Web Design.
Packages: Starter $325/mo, Professional $640/mo, Enterprise $1,250/mo, Custom (get quote).
Contact: hello@kademedia.com, +90 506 729 34 23, Biruni Teknopark Istanbul.
Give short, friendly, helpful answers. Use emojis. Redirect to WhatsApp for uncertain topics.`;

const ADMIN_CONTEXT = `Sen bir dijital pazarlama ve içerik üretim uzmanısın. Kısa, doğrudan ve üretime hazır Türkçe içerik üret. Süsleme veya açıklama ekleme; sadece istenen çıktıyı ver.`;

export default async function handler(req, res) {
  if (cors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, lang, history, adminMode } = req.body || {};
  const isAdmin = adminMode === true && !!requireAuth(req);

  if (!isAdmin) {
    const rl = rateLimitCheck(req);
    if (!rl.allowed) {
      return res.status(429).json({ error: `Çok fazla istek. ${rl.retryAfter} dakika sonra tekrar deneyin.` });
    }
  }

  const GEMINI_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_KEY) {
    if (isAdmin) {
      return res.status(503).json({ error: 'GEMINI_API_KEY ortam değişkeni tanımlanmamış. Vercel → Settings → Environment Variables üzerinden ekleyin.' });
    }
    return res.status(200).json({ reply: null, fallback: true });
  }

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'message is required' });
  }

  const maxLen = isAdmin ? 4000 : 1000;
  if (message.length > maxLen) {
    return res.status(400).json({ error: `Mesaj çok uzun (max ${maxLen} karakter).` });
  }

  const safeMessage = message.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  try {
    const systemPrompt = isAdmin
      ? ADMIN_CONTEXT
      : (lang === 'en' ? KADE_CONTEXT_EN : KADE_CONTEXT_TR);

    let promptText = systemPrompt + '\n\n' + (isAdmin ? 'Görev: ' : 'Kullanıcı mesajı: ') + safeMessage;
    if (!isAdmin && Array.isArray(history) && history.length > 0) {
      const historyText = history.slice(-6)
        .filter(m => m && typeof m.text === 'string' && m.text.length < 500)
        .map(m => `${m.type === 'user' ? 'Kullanıcı' : 'Asistan'}: ${m.text.slice(0, 500)}`)
        .join('\n');
      promptText = systemPrompt + '\n\nÖnceki konuşma:\n' + historyText + '\n\nKullanıcının son mesajı: ' + safeMessage;
    }

    const apiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: promptText }] }],
          generationConfig: { maxOutputTokens: isAdmin ? 800 : 300, temperature: 0.7 },
        }),
      }
    );

    if (!apiRes.ok) {
      const errText = await apiRes.text().catch(() => '');
      console.error('Gemini API error:', apiRes.status, errText);
      if (isAdmin) {
        return res.status(502).json({ error: `Gemini API hatası (${apiRes.status}). API anahtarınızı doğrulayın.` });
      }
      return res.status(200).json({ reply: null, fallback: true });
    }

    const data = await apiRes.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (text) {
      logAiUsage(isAdmin ? 'admin' : 'public', 'gemini-2.5-flash', data?.usageMetadata);
      return res.status(200).json({ reply: text.trim() });
    }
    if (isAdmin) {
      return res.status(502).json({ error: 'Gemini yanıtı boş döndü. Prompt içeriğini kontrol edin.' });
    }
    return res.status(200).json({ reply: null, fallback: true });
  } catch (err) {
    console.error('Chat handler error:', err);
    if (isAdmin) {
      return res.status(500).json({ error: 'AI servisi hata verdi: ' + (err.message || 'bilinmeyen') });
    }
    return res.status(200).json({ reply: null, fallback: true });
  }
}
