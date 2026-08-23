import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  AccountContextValue,
  EMPTY_ACCOUNT_CONTEXT,
  getProfileCompletion,
  normalizeAccountContext,
} from '@/lib/profile/types'

export const dynamic = 'force-dynamic'

const hasSupabaseConfig = () => Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

function text(value: unknown, max = 500) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function list(value: unknown, maxItems = 30, maxLength = 120) {
  if (!Array.isArray(value)) return []
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim().slice(0, maxLength))
    .filter(Boolean)
    .slice(0, maxItems)
}

function url(value: unknown) {
  const candidate = text(value, 500)
  if (!candidate) return ''
  try {
    const parsed = new URL(candidate)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.toString() : ''
  } catch {
    return ''
  }
}

function socialAccounts(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .slice(0, 12)
      .map(([provider, accountUrl]) => [text(provider, 30), url(accountUrl)])
      .filter(([provider, accountUrl]) => provider && accountUrl)
  )
}

function sanitizeAccount(value: unknown): AccountContextValue {
  const source = normalizeAccountContext(value)
  return normalizeAccountContext({
    profile: {
      displayName: text(source.profile.displayName, 120),
      language: text(source.profile.language, 16) || 'tr',
      timezone: text(source.profile.timezone, 80) || 'Europe/Istanbul',
      expertise: text(source.profile.expertise, 240),
      goals: list(source.profile.goals, 12, 120),
    },
    workspace: {
      id: text(source.workspace.id, 80) || undefined,
      name: text(source.workspace.name, 120) || 'Kişisel Çalışma Alanı',
    },
    brand: {
      id: text(source.brand.id, 80) || undefined,
      workspaceId: text(source.brand.workspaceId, 80) || undefined,
      name: text(source.brand.name, 120),
      description: text(source.brand.description, 12_000),
      niche: text(source.brand.niche, 240),
      audience: text(source.brand.audience, 1000),
      language: text(source.brand.language, 16) || 'tr',
      voice: text(source.brand.voice, 1000),
      forbiddenWords: list(source.brand.forbiddenWords),
      products: list(source.brand.products),
      website: url(source.brand.website),
      socialAccounts: socialAccounts(source.brand.socialAccounts),
      competitors: list(source.brand.competitors, 30, 300),
      keywords: list(source.brand.keywords),
      contentGoals: list(source.brand.contentGoals),
      preferredPlatforms: list(source.brand.preferredPlatforms, 12, 30),
    },
    preferences: {
      language: text(source.preferences.language, 16) || 'tr',
      tone: text(source.preferences.tone, 120),
      platforms: list(source.preferences.platforms, 12, 30),
      autoModel: source.preferences.autoModel !== false,
      rememberInputs: source.preferences.rememberInputs !== false,
    },
    integrations: [],
  })
}

async function ensureAccount(supabase: SupabaseClient, user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> }) {
  const fallbackName = text(user.user_metadata?.display_name, 120) || user.email?.split('@')[0] || 'Kullanıcı'
  await supabase.from('profiles').upsert({ user_id: user.id, display_name: fallbackName }, { onConflict: 'user_id', ignoreDuplicates: true })

  let { data: preference } = await supabase.from('user_preferences').select('*').eq('user_id', user.id).maybeSingle()
  let workspaceId = preference?.active_workspace_id as string | undefined

  if (workspaceId) {
    const { data: membership } = await supabase.from('workspace_members').select('workspace_id').eq('workspace_id', workspaceId).eq('user_id', user.id).maybeSingle()
    if (!membership) workspaceId = undefined
  }

  if (!workspaceId) {
    const { data: membership } = await supabase.from('workspace_members').select('workspace_id').eq('user_id', user.id).limit(1).maybeSingle()
    workspaceId = membership?.workspace_id as string | undefined
  }

  if (!workspaceId) {
    const { data: workspace, error } = await supabase
      .from('workspaces')
      .insert({ owner_id: user.id, name: `${fallbackName} Çalışma Alanı`, slug: 'ana-calisma-alani' })
      .select('id')
      .single()
    if (error) throw error
    workspaceId = workspace.id
    const { error: membershipError } = await supabase.from('workspace_members').upsert({ workspace_id: workspaceId, user_id: user.id, role: 'owner' })
    if (membershipError) throw membershipError
  }

  if (!preference) {
    const { data, error } = await supabase
      .from('user_preferences')
      .insert({ user_id: user.id, active_workspace_id: workspaceId })
      .select('*')
      .single()
    if (error) throw error
    preference = data
  } else if (!preference.active_workspace_id) {
    const { data } = await supabase.from('user_preferences').update({ active_workspace_id: workspaceId }).eq('user_id', user.id).select('*').single()
    if (data) preference = data
  }

  return { workspaceId, preference }
}

async function loadAccount(supabase: SupabaseClient, user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> }) {
  const ensured = await ensureAccount(supabase, user)
  const [{ data: profile }, { data: workspace }, { data: brandRows }, { data: integrations }] = await Promise.all([
    supabase.from('profiles').select('*').eq('user_id', user.id).single(),
    supabase.from('workspaces').select('*').eq('id', ensured.workspaceId).single(),
    supabase.from('brands').select('*').eq('workspace_id', ensured.workspaceId).order('created_at', { ascending: true }),
    supabase.from('integrations').select('provider,status,account_url,updated_at').eq('user_id', user.id).eq('workspace_id', ensured.workspaceId),
  ])

  const activeBrand = brandRows?.find((brand) => brand.id === ensured.preference?.active_brand_id) ?? brandRows?.[0]
  return normalizeAccountContext({
    profile: {
      displayName: profile?.display_name ?? '',
      language: profile?.language ?? 'tr',
      timezone: profile?.timezone ?? 'Europe/Istanbul',
      expertise: profile?.expertise ?? '',
      goals: profile?.goals ?? [],
    },
    workspace: { id: workspace?.id, name: workspace?.name ?? 'Kişisel Çalışma Alanı' },
    brand: activeBrand ? {
      id: activeBrand.id,
      workspaceId: activeBrand.workspace_id,
      name: activeBrand.name,
      description: activeBrand.description,
      niche: activeBrand.niche,
      audience: activeBrand.audience,
      language: activeBrand.language,
      voice: activeBrand.voice,
      forbiddenWords: activeBrand.forbidden_words,
      products: activeBrand.products,
      website: activeBrand.website,
      socialAccounts: activeBrand.social_accounts,
      competitors: activeBrand.competitors,
      keywords: activeBrand.keywords,
      contentGoals: activeBrand.content_goals,
      preferredPlatforms: activeBrand.preferred_platforms,
    } : EMPTY_ACCOUNT_CONTEXT.brand,
    preferences: {
      language: ensured.preference?.content_language ?? 'tr',
      tone: ensured.preference?.formality ?? '',
      platforms: ensured.preference?.target_platforms ?? [],
      autoModel: ensured.preference?.auto_model !== false,
      rememberInputs: ensured.preference?.remember_inputs !== false,
    },
    integrations: (integrations ?? []).map((integration) => ({
      provider: integration.provider,
      status: integration.status === 'connected' || integration.status === 'error' ? integration.status : 'disconnected',
      accountUrl: integration.account_url,
      updatedAt: integration.updated_at,
    })),
  })
}

export async function GET() {
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ error: 'Yerel profil kullanılıyor.', cloud: false }, { status: 401 })
  }
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Oturum gerekli.' }, { status: 401 })
    const account = await loadAccount(supabase, user)
    return NextResponse.json({ account, completion: getProfileCompletion(account), cloud: true })
  } catch {
    return NextResponse.json({ error: 'Profil yüklenemedi.' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const size = Number(request.headers.get('content-length') || 0)
    if (size > 100_000) return NextResponse.json({ error: 'Profil verisi çok büyük.' }, { status: 413 })
    if (!hasSupabaseConfig()) {
      const body = await request.json()
      const account = sanitizeAccount(body.account)
      return NextResponse.json({ account, completion: getProfileCompletion(account), cloud: false })
    }
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Oturum gerekli.' }, { status: 401 })

    const body = await request.json()
    const account = sanitizeAccount(body.account)
    const ensured = await ensureAccount(supabase, user)
    const workspaceId = account.workspace.id || ensured.workspaceId
    const { data: membership } = await supabase.from('workspace_members').select('role').eq('workspace_id', workspaceId).eq('user_id', user.id).maybeSingle()
    if (!membership) return NextResponse.json({ error: 'Bu çalışma alanına erişiminiz yok.' }, { status: 403 })

    const now = new Date().toISOString()
    const { error: profileError } = await supabase.from('profiles').upsert({
      user_id: user.id,
      display_name: account.profile.displayName,
      language: account.profile.language,
      timezone: account.profile.timezone,
      expertise: account.profile.expertise,
      goals: account.profile.goals,
      onboarding_completed_at: getProfileCompletion(account) >= 50 ? now : null,
      updated_at: now,
    })
    if (profileError) throw profileError
    const { error: workspaceError } = await supabase.from('workspaces').update({ name: account.workspace.name, updated_at: now }).eq('id', workspaceId)
    if (workspaceError) throw workspaceError

    let brandId = account.brand.id
    if (brandId) {
      const { data: allowedBrand } = await supabase.from('brands').select('id').eq('id', brandId).eq('workspace_id', workspaceId).maybeSingle()
      if (!allowedBrand) return NextResponse.json({ error: 'Bu markaya erişiminiz yok.' }, { status: 403 })
    }

    if (account.brand.name || account.brand.description || brandId) {
      const brandPayload = {
        workspace_id: workspaceId,
        created_by: user.id,
        name: account.brand.name || 'İsimsiz Marka',
        description: account.brand.description,
        niche: account.brand.niche,
        audience: account.brand.audience,
        language: account.brand.language,
        voice: account.brand.voice,
        forbidden_words: account.brand.forbiddenWords,
        products: account.brand.products,
        website: account.brand.website,
        social_accounts: account.brand.socialAccounts,
        competitors: account.brand.competitors,
        keywords: account.brand.keywords,
        content_goals: account.brand.contentGoals,
        preferred_platforms: account.brand.preferredPlatforms,
        updated_at: now,
      }
      if (brandId) {
        const { error } = await supabase.from('brands').update(brandPayload).eq('id', brandId).eq('workspace_id', workspaceId)
        if (error) throw error
      } else {
        const { data, error } = await supabase.from('brands').insert(brandPayload).select('id').single()
        if (error) throw error
        brandId = data.id
      }
    }

    const { error: preferenceError } = await supabase.from('user_preferences').upsert({
      user_id: user.id,
      active_workspace_id: workspaceId,
      active_brand_id: brandId || null,
      content_language: account.preferences.language,
      target_platforms: account.preferences.platforms,
      formality: account.preferences.tone,
      auto_model: account.preferences.autoModel,
      remember_inputs: account.preferences.rememberInputs,
      updated_at: now,
    })
    if (preferenceError) throw preferenceError

    const saved = await loadAccount(supabase, user)
    return NextResponse.json({ account: saved, completion: getProfileCompletion(saved), cloud: true })
  } catch {
    return NextResponse.json({ error: 'Profil kaydedilemedi.' }, { status: 500 })
  }
}
