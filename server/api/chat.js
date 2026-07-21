import { cors } from './_lib/cors.js';
import { rateLimitCheck } from './_lib/rateLimit.js';
import { getAuthorizedUser } from './_lib/auth.js';
import { getSupabase } from './_lib/supabase.js';

async function logAiUsage(scope, model, usageMeta) {
  try {
    const supabase = getSupabase();
    const { error } = await supabase.from('kade_ai_usage').insert({
      scope,
      model,
      prompt_tokens: usageMeta?.promptTokenCount || 0,
      output_tokens: usageMeta?.candidatesTokenCount || 0,
      total_tokens: usageMeta?.totalTokenCount || 0,
    });
    if (error) throw error;
  } catch (e) { /* non-fatal */ }
}

const KADE_CONTEXT_TR = `Sen Kade Media'nın web sitesi asistanısın.
Yalnızca şu doğrulanmış bilgileri kullan: Kade Media İstanbul merkezli bir dijital pazarlama markasıdır. Hizmet alanları sosyal medya yönetimi, içerik üretimi, reklam yönetimi, video prodüksiyon, strateji danışmanlığı ve web sitesi tasarımıdır. İletişim e-postası thekademedia@gmail.com adresidir.
Fiyat, süre, ekip büyüklüğü, müşteri, başarı metriği, adres, telefon veya sosyal medya hesabı uydurma. Bu konularda yazılı teklif veya e-posta ile doğrulama öner.`;

const KADE_CONTEXT_EN = `You are the Kade Media website assistant.
Use only these verified facts: Kade Media is an Istanbul-based digital marketing brand. Its service areas are social media management, content production, ad management, video production, strategy consulting, and website design. The verified contact email is thekademedia@gmail.com.
Do not invent prices, timing, team size, clients, performance metrics, address, phone numbers, or social accounts. Recommend verification by written proposal or email.`;

const ADMIN_CONTEXT = `Sen bir dijital pazarlama ve içerik üretim uzmanısın. Kısa, doğrudan ve üretime hazır Türkçe içerik üret. Süsleme veya açıklama ekleme; sadece istenen çıktıyı ver.`;

export default async function handler(req, res) {
  if (cors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, lang, history, adminMode } = req.body || {};
  const adminUser = adminMode === true ? await getAuthorizedUser(req) : null;
  const isAdmin = adminMode === true && Boolean(adminUser);

  if (!isAdmin) {
    const rl = await rateLimitCheck(req, { namespace: 'chat', maxRequests: 20 });
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
        signal: AbortSignal.timeout(25000),
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: promptText }] }],
          generationConfig: { maxOutputTokens: isAdmin ? 800 : 300, temperature: 0.7 },
        }),
      }
    );

    if (!apiRes.ok) {
      await apiRes.body?.cancel().catch(() => {});
      console.error('Gemini API error status:', apiRes.status);
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
    console.error('Chat handler error:', err instanceof Error ? err.message : 'unknown');
    if (isAdmin) {
      return res.status(500).json({ error: 'AI servisi isteği tamamlanamadı.' });
    }
    return res.status(200).json({ reply: null, fallback: true });
  }
}
