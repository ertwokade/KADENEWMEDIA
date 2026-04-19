import { cors } from './_lib/cors.js';
import { rateLimitCheck } from './_lib/rateLimit.js';

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

export default async function handler(req, res) {
  if (cors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const rl = rateLimitCheck(req);
  if (!rl.allowed) {
    return res.status(429).json({ error: `Çok fazla istek. ${rl.retryAfter} dakika sonra tekrar deneyin.` });
  }

  const GEMINI_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_KEY) {
    return res.status(200).json({ reply: null, fallback: true });
  }

  const { message, lang, history } = req.body || {};
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'message is required' });
  }

  if (message.length > 1000) {
    return res.status(400).json({ error: 'Mesaj çok uzun (max 1000 karakter).' });
  }

  const safeMessage = message.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  try {
    const systemPrompt = lang === 'en' ? KADE_CONTEXT_EN : KADE_CONTEXT_TR;

    let promptText = systemPrompt + '\n\nKullanıcı mesajı: ' + safeMessage;
    if (Array.isArray(history) && history.length > 0) {
      const historyText = history.slice(-6)
        .filter(m => m && typeof m.text === 'string' && m.text.length < 500)
        .map(m => `${m.type === 'user' ? 'Kullanıcı' : 'Asistan'}: ${m.text.slice(0, 500)}`)
        .join('\n');
      promptText = systemPrompt + '\n\nÖnceki konuşma:\n' + historyText + '\n\nKullanıcının son mesajı: ' + safeMessage;
    }

    const apiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: promptText }] }],
          generationConfig: { maxOutputTokens: 300, temperature: 0.7 },
        }),
      }
    );

    if (!apiRes.ok) {
      return res.status(200).json({ reply: null, fallback: true });
    }

    const data = await apiRes.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (text) {
      return res.status(200).json({ reply: text.trim() });
    }
    return res.status(200).json({ reply: null, fallback: true });
  } catch {
    return res.status(200).json({ reply: null, fallback: true });
  }
}
