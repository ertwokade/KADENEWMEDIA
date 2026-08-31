import { createClient } from '@/lib/supabase/server'
import { getAvailableModels } from '@/lib/ai/modelRouter'
import { isAllowedOwnerUser, isSettingsOwnerUser } from '@/lib/featureAccess'
import { hasAuthenticatedUser } from '@/lib/auth/server'
import { getVercelGatewayToken } from '@/lib/ai/gatewayAuth'
import { getCurrentPlan } from '@/lib/entitlement'

export const dynamic = 'force-dynamic'

function configured(name: string) {
  return Boolean(process.env[name]?.trim())
}

export async function GET(request: Request) {
  if (!(await hasAuthenticatedUser())) return Response.json({ error: 'Oturum gerekli.' }, { status: 401 })
  let operationsSync = false
  let ownerAccess = false
  let settingsAccess = false
  // Menüde hangi araçların kilitli görüneceğini belirler. Sidebar bu ucu
  // zaten çağırıyor; ayrı bir istek açmamak için buraya eklendi.
  let planTier: string | null = null
  let planLabel: string | null = null
  let planFeatures: string[] = []
  const gatewayToken = await getVercelGatewayToken(request)
  const aiGateway = Boolean(gatewayToken)
  // Gateway modeli burada AYRICA eklenmez: getAvailableModels() onu bilerek
  // eliyor (açık AI_GATEWAY_API_KEY yoksa hesap gateway'i kullanamıyor ve
  // istek 500 dönüyor). Buradaki kopya eleme kuralını geçersiz kılıyor,
  // seçicide yanıt veremeyen bir model gösteriyordu.
  const availableModels = getAvailableModels()
  if (configured('NEXT_PUBLIC_SUPABASE_URL') && configured('NEXT_PUBLIC_SUPABASE_ANON_KEY')) {
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      operationsSync = Boolean(user)
      // Kimlik yeter: KADE_OWNER_EMAILS listesindeki hesap ya da kade_admin.
      // Ayrıca bir ortam bayrağı ARANMAZ; bayrak set edilmediği için sahip
      // kendi Satış Merkezi'ni ve Platform Yönetimi'ni menüde göremiyordu.
      ownerAccess = isAllowedOwnerUser(user) || isSettingsOwnerUser(user)
      settingsAccess = isSettingsOwnerUser(user)
      if (user) {
        try {
          const plan = await getCurrentPlan()
          planTier = plan.tier
          planLabel = plan.label
          planFeatures = plan.features
        } catch {
          // Paket okunamazsa hiçbir araç kilitlenmez: yanlışlıkla erişim
          // kapatmaktansa açık bırakmak doğru taraf.
          planFeatures = []
          planTier = null
        }
      }
    } catch {
      operationsSync = false
    }
  }

  const provider =
    process.env.OPERATIONS_AI_PROVIDER ||
    (configured('GEMINI_API_KEY')
      ? 'gemini'
      : configured('OPENAI_API_KEY')
        ? 'openai'
        : configured('OPENROUTER_API_KEY') || configured('QWEN_API_KEY')
          ? 'qwen'
          : aiGateway
            ? 'vercel'
            : 'none')
  const imageConfigured = configured('GEMINI_API_KEY') || configured('OPENAI_API_KEY')

  return Response.json({
    provider,
    assistant: aiGateway || configured('GEMINI_API_KEY') || configured('OPENAI_API_KEY') || configured('OPENROUTER_API_KEY') || configured('QWEN_API_KEY') || configured('GROQ_API_KEY'),
    aiGateway,
    image: imageConfigured,
    imageConfigured,
    imageFallbackAvailable: false,
    imageProvider: imageConfigured ? 'configured' : 'none',
    // Video ve dublaj ayrı FastAPI servisinde koşuyor. Bu bayrak eskiden
    // SABİT false'tu, yani arayüz servis ayakta olsa bile bilemiyordu;
    // artık servis adresinin tanımlı olup olmadığını yansıtıyor.
    video: configured('KADE_FASTAPI_BASE_URL'),
    // Transkripsiyon Groq Whisper ile yapılıyor; anahtar yoksa Klip Üretici,
    // Altyazı ve Dublaj tıklanınca 503 alıyordu — arayüz önceden uyarabilsin.
    transcribe: configured('GROQ_API_KEY'),
    youtube: configured('YOUTUBE_API_KEY'),
    operationsSync,
    ownerAccess,
    settingsAccess,
    planTier,
    planLabel,
    planFeatures,
    // Paket okunamadıysa arayüz kilit göstermemeli.
    planKnown: planTier !== null,
    autoRouting: true,
    availableModels,
  }, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  })
}
