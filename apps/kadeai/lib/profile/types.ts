import type { ProfileField } from '@/lib/tools/registry'

export interface UserProfile {
  displayName: string
  language: string
  timezone: string
  expertise: string
  goals: string[]
}

export interface WorkspaceProfile {
  id?: string
  name: string
}

export interface BrandProfile {
  id?: string
  workspaceId?: string
  name: string
  description: string
  niche: string
  audience: string
  language: string
  voice: string
  forbiddenWords: string[]
  products: string[]
  website: string
  socialAccounts: Record<string, string>
  competitors: string[]
  keywords: string[]
  contentGoals: string[]
  preferredPlatforms: string[]
}

export interface UserPreferences {
  language: string
  tone: string
  platforms: string[]
  autoModel: boolean
  rememberInputs: boolean
}

export interface IntegrationSummary {
  provider: string
  status: 'connected' | 'disconnected' | 'error'
  accountUrl?: string
  updatedAt?: string
}

export interface AccountContextValue {
  profile: UserProfile
  workspace: WorkspaceProfile
  brand: BrandProfile
  preferences: UserPreferences
  integrations: IntegrationSummary[]
}

export const EMPTY_ACCOUNT_CONTEXT: AccountContextValue = {
  profile: {
    displayName: '',
    language: 'tr',
    timezone: 'Europe/Istanbul',
    expertise: '',
    goals: [],
  },
  workspace: { name: 'Kişisel Çalışma Alanı' },
  brand: {
    name: '',
    description: '',
    niche: '',
    audience: '',
    language: 'tr',
    voice: '',
    forbiddenWords: [],
    products: [],
    website: '',
    socialAccounts: {},
    competitors: [],
    keywords: [],
    contentGoals: [],
    preferredPlatforms: [],
  },
  preferences: {
    language: 'tr',
    tone: '',
    platforms: [],
    autoModel: true,
    rememberInputs: true,
  },
  integrations: [],
}

export const PROFILE_STORAGE_KEY = 'kade-account-context-v1'

export const PROFILE_FIELD_LABELS: Record<ProfileField, string> = {
  'profile.displayName': 'Ad soyad',
  'profile.language': 'Profil dili',
  'profile.timezone': 'Saat dilimi',
  'profile.expertise': 'Uzmanlık alanı',
  'profile.goals': 'Kişisel hedefler',
  'brand.name': 'Marka adı',
  'brand.description': 'Marka açıklaması',
  'brand.niche': 'Niş / sektör',
  'brand.audience': 'Hedef kitle',
  'brand.voice': 'Marka tonu',
  'brand.products': 'Ürün veya hizmetler',
  'brand.website': 'Web sitesi',
  'brand.keywords': 'Anahtar kelimeler',
  'preferences.language': 'İçerik dili',
  'preferences.platforms': 'Tercih edilen platformlar',
  'preferences.tone': 'Varsayılan ton',
}

function cloneEmpty(): AccountContextValue {
  return JSON.parse(JSON.stringify(EMPTY_ACCOUNT_CONTEXT)) as AccountContextValue
}

export function normalizeAccountContext(input: unknown): AccountContextValue {
  const empty = cloneEmpty()
  if (!input || typeof input !== 'object') return empty
  const value = input as Partial<AccountContextValue>
  return {
    profile: { ...empty.profile, ...(value.profile ?? {}) },
    workspace: { ...empty.workspace, ...(value.workspace ?? {}) },
    brand: {
      ...empty.brand,
      ...(value.brand ?? {}),
      socialAccounts: { ...empty.brand.socialAccounts, ...(value.brand?.socialAccounts ?? {}) },
    },
    preferences: { ...empty.preferences, ...(value.preferences ?? {}) },
    integrations: Array.isArray(value.integrations) ? value.integrations : [],
  }
}

function getPathValue(context: AccountContextValue, field: ProfileField): unknown {
  const [section, key] = field.split('.') as ['profile' | 'brand' | 'preferences', string]
  const sectionValue = context[section] as unknown as Record<string, unknown>
  return sectionValue[key]
}

export function getMissingProfileFields(context: AccountContextValue, fields: ProfileField[]) {
  return fields.filter((field) => {
    const value = getPathValue(context, field)
    if (Array.isArray(value)) return value.length === 0
    if (typeof value === 'string') return value.trim().length === 0
    return value == null
  })
}

export function getProfileCompletion(context: AccountContextValue) {
  const fields: ProfileField[] = [
    'profile.displayName', 'profile.language', 'profile.timezone', 'profile.expertise', 'profile.goals',
    'brand.name', 'brand.description', 'brand.niche', 'brand.audience', 'brand.voice', 'brand.products',
    'brand.website', 'brand.keywords', 'preferences.language', 'preferences.platforms', 'preferences.tone',
  ]
  return Math.round(((fields.length - getMissingProfileFields(context, fields).length) / fields.length) * 100)
}

export function accountContextForRequest(context: AccountContextValue) {
  return {
    profile: context.profile,
    workspace: context.workspace,
    brand: context.brand,
    preferences: context.preferences,
    integrations: context.integrations.map(({ provider, status, accountUrl }) => ({ provider, status, accountUrl })),
  }
}
