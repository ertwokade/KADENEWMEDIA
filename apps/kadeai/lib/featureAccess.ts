const COMMON_DISABLED_ROUTES = [
  '/dashboard/editor',
  '/dashboard/script',
  '/dashboard/podcast',
  '/dashboard/blog',
  '/dashboard/newsletter',
  '/dashboard/sponsor-script',
  '/dashboard/giveaway',
  '/dashboard/thumbnail',
  '/dashboard/storyboard',
  '/dashboard/broll',
  '/dashboard/story-series',
  '/dashboard/comment-reply',
  '/dashboard/community-post',
  '/dashboard/poll',
  '/dashboard/livestream',
  '/dashboard/chapters',
  '/dashboard/auto-post',
  '/dashboard/repurpose',
  '/dashboard/humanizer',
  '/dashboard/audience',
  '/dashboard/brand-voice',
  '/dashboard/brand-voice-train',
  '/dashboard/niche-finder',
  '/dashboard/pillar-planner',
  '/dashboard/brand-deal',
  '/dashboard/course',
  '/dashboard/growth',
  '/api/generate/script',
  '/api/generate/podcast',
  '/api/generate/blog',
  '/api/generate/newsletter',
  '/api/generate/sponsor-script',
  '/api/generate/giveaway',
  '/api/generate/thumbnail',
  '/api/generate/storyboard',
  '/api/generate/broll',
  '/api/generate/story-series',
  '/api/generate/comment-reply',
  '/api/generate/community-post',
  '/api/generate/poll',
  '/api/generate/livestream',
  '/api/generate/chapters',
  '/api/generate/auto-post',
  '/api/generate/repurpose',
  '/api/generate/humanizer',
  '/api/generate/audience',
  '/api/generate/brand-voice',
  '/api/generate/brand-voice-train',
  '/api/generate/niche-finder',
  '/api/generate/pillar-planner',
  '/api/generate/brand-deal',
  '/api/generate/course',
]

const OWNER_ONLY_ROUTES = [
  '/dashboard/shopier',
  '/api/shopier',
]

/**
 * Maliyet/marj gibi platform yönetimi uçları. `OWNER_ONLY_ROUTES`'tan farkı:
 * `NEXT_PUBLIC_KADE_OWNER_MODE` bayrağına bağlı DEĞİL — kim olduğuna bakılır.
 * Erişim kuralı handler'daki ile birebir aynıdır (owner e-postası veya
 * kade_admin), böylece proxy meşru bir sahibi kilitlemez.
 */
const ADMIN_ONLY_ROUTES = [
  '/api/admin',
  '/dashboard/admin',
]

const SETTINGS_OWNER_ONLY_ROUTES = [
  '/dashboard/settings',
  '/api/env-status',
]

const SETTINGS_OWNER_EMAIL = 'thekademedia@gmail.com'

type AuthUserLike = {
  email?: string | null
  app_metadata?: Record<string, unknown> | null
}

function matchesRoute(pathname: string, route: string) {
  return pathname === route || pathname.startsWith(`${route}/`)
}

export function isOwnerOnlyRoute(pathname: string) {
  return OWNER_ONLY_ROUTES.some((route) => matchesRoute(pathname, route))
}

export function isAdminOnlyRoute(pathname: string) {
  return ADMIN_ONLY_ROUTES.some((route) => matchesRoute(pathname, route))
}

export function isSettingsOwnerOnlyRoute(pathname: string) {
  return SETTINGS_OWNER_ONLY_ROUTES.some((route) => matchesRoute(pathname, route))
}

export function isSettingsOwnerEmail(email?: string | null) {
  return email?.trim().toLowerCase() === SETTINGS_OWNER_EMAIL
}

export function isKadeAdminUser(user?: AuthUserLike | null) {
  return Boolean(
    user?.app_metadata?.kade_admin_id
    && user.app_metadata.kade_admin_role === 'admin'
  )
}

export function isSettingsOwnerUser(user?: AuthUserLike | null) {
  return isSettingsOwnerEmail(user?.email) || isKadeAdminUser(user)
}

export function isAllowedOwnerEmail(email?: string | null) {
  if (!email) return false
  const configured = [process.env.KADE_OWNER_EMAIL, process.env.KADE_OWNER_EMAILS]
    .filter(Boolean)
    .join(',')
    .split(',')
    .map((value) => value.trim().toLocaleLowerCase('tr-TR'))
    .filter(Boolean)

  return configured.includes(email.trim().toLocaleLowerCase('tr-TR'))
}

export function isAllowedOwnerUser(user?: AuthUserLike | null) {
  return isAllowedOwnerEmail(user?.email) || isKadeAdminUser(user)
}

export function isOwnerMode() {
  return process.env.NEXT_PUBLIC_KADE_OWNER_MODE === '1'
}

export function canAccessFeature(pathname: string, ownerMode = isOwnerMode()) {
  if (COMMON_DISABLED_ROUTES.some((route) => matchesRoute(pathname, route))) {
    return false
  }

  if (!ownerMode && isOwnerOnlyRoute(pathname)) {
    return false
  }

  return true
}
