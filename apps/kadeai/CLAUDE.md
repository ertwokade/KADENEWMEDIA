# ContentAI Studio

## Proje Özeti
Claude + GPT-4o + Gemini destekli sosyal medya içerik üretim platformu.
İçerik üreticileri için başlık, thumbnail, hook, script, açıklama, hashtag, repurpose ve analiz araçları.

## Tech Stack
- Frontend: Next.js 15 (App Router), TypeScript, Tailwind CSS, Radix UI
- Backend: Next.js API Routes
- AI: Anthropic SDK, OpenAI SDK, Google Generative AI SDK
- Auth + DB: Supabase
- İkonlar: lucide-react

## AI Katmanı Kuralı
Tüm LLM çağrıları /lib/ai/provider.ts üzerinden geçmeli.
Interface: generateContent({ prompt, model, systemPrompt?, maxTokens? })
Model tipi: 'claude' | 'gpt4o' | 'gemini'

## Klasör Kuralları
- /app/api/generate/* → AI API route'ları
- /app/dashboard/* → araç sayfaları
- /components/layout → sidebar, topbar, model seçici
- /components/ui → paylaşılan küçük componentler
- /lib/ai/prompts.ts → tüm sistem promptları burada

## Kod Kuralları
- Her fonksiyon ve component için TypeScript tipleri zorunlu
- API anahtarları sadece .env.local'de, asla hardcode etme
- Tüm API route'larında try/catch ve anlamlı hata mesajı
- Component max 200 satır, büyükse böl
- Tailwind class'ları için cn() utility kullan (clsx + tailwind-merge)

## Renk Paleti (Tailwind)
- Arka plan: bg-zinc-950, bg-zinc-900
- Kart: bg-zinc-800/50, border-zinc-700/50
- Metin: text-zinc-100, text-zinc-400
- Accent: text-violet-400, bg-violet-500
- Başarı: text-emerald-400
- Uyarı: text-amber-400
