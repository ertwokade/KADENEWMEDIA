export const APP_BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '/kadeai'
export const PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://kadenewmedia.com/kadeai'

export function withBasePath(path: string) {
  if (!path || /^https?:\/\//i.test(path) || path.startsWith('//')) return path
  const normalized = path.startsWith('/') ? path : `/${path}`
  if (!APP_BASE_PATH || normalized === APP_BASE_PATH || normalized.startsWith(`${APP_BASE_PATH}/`)) {
    return normalized
  }
  return `${APP_BASE_PATH}${normalized}`
}

export function stripBasePath(pathname: string) {
  if (!APP_BASE_PATH) return pathname || '/'
  if (pathname === APP_BASE_PATH) return '/'
  if (pathname.startsWith(`${APP_BASE_PATH}/`)) return pathname.slice(APP_BASE_PATH.length) || '/'
  return pathname || '/'
}

export function apiPath(path: string) {
  const normalized = path.startsWith('/api/') || path === '/api' ? path : `/api/${path.replace(/^\//, '')}`
  return withBasePath(normalized)
}

export const appRoutes = {
  home: '/',
  login: '/login',
  authCallback: '/auth/callback',
  onboarding: '/onboarding',
  dashboard: '/dashboard',
  settings: '/dashboard/settings',
  history: '/dashboard/history',
  operations: '/dashboard/operations',
} as const
