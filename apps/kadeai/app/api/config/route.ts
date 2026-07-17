import { createClient } from '@/lib/supabase/server'
import { getAvailableModels } from '@/lib/ai/modelRouter'
import { isAllowedOwnerEmail, isOwnerMode } from '@/lib/featureAccess'
import { hasAuthenticatedUser } from '@/lib/auth/server'

export const dynamic = 'force-dynamic'

function configured(name: string) {
  return Boolean(process.env[name]?.trim())
}

export async function GET() {
  if (!(await hasAuthenticatedUser())) return Response.json({ error: 'Oturum gerekli.' }, { status: 401 })
  let operationsSync = false
  let ownerAccess = false
  if (configured('NEXT_PUBLIC_SUPABASE_URL') && configured('NEXT_PUBLIC_SUPABASE_ANON_KEY')) {
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      operationsSync = Boolean(user)
      ownerAccess = isOwnerMode() && isAllowedOwnerEmail(user?.email)
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
          : 'none')
  const imageConfigured = configured('GEMINI_API_KEY') || configured('OPENAI_API_KEY')

  return Response.json({
    provider,
    assistant: configured('GEMINI_API_KEY') || configured('OPENAI_API_KEY') || configured('OPENROUTER_API_KEY') || configured('QWEN_API_KEY') || configured('GROQ_API_KEY'),
    image: imageConfigured,
    imageConfigured,
    imageFallbackAvailable: false,
    imageProvider: imageConfigured ? 'configured' : 'none',
    video: false,
    youtube: configured('YOUTUBE_API_KEY'),
    operationsSync,
    ownerAccess,
    autoRouting: true,
    availableModels: getAvailableModels(),
  }, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  })
}
