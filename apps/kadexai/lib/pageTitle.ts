import { stripBasePath } from '@/lib/appConfig'
import { TOOL_REGISTRY } from '@/lib/tools/registry'

const PUBLIC_PAGE_TITLES: Record<string, string> = {
  '/': 'KadexAI | Kade New Media',
  '/auth': 'Güvenli Giriş | KadexAI',
  '/login': 'Giriş Yap | KadexAI',
  '/logout': 'Çıkış Yapılıyor | KadexAI',
  '/onboarding': 'Marka Profilini Oluştur | KadexAI',
  '/reset-password': 'Şifreyi Yenile | KadexAI',
  '/kadexai-demo': 'KadexAI Demo | AI Sosyal Medya ve İçerik Platformu',
}

function normalizedOperationsRoute(pathname: string, search: string) {
  if (pathname !== '/dashboard/operations') return pathname
  const view = new URLSearchParams(search).get('view') || 'dashboard'
  return `${pathname}?view=${view}`
}

export function resolveKadePageTitle(rawPathname: string, search = '') {
  const pathname = stripBasePath(rawPathname) || '/'
  const publicTitle = PUBLIC_PAGE_TITLES[pathname]
  if (publicTitle) return publicTitle

  const route = normalizedOperationsRoute(pathname, search)
  const exactTool = TOOL_REGISTRY.find((tool) => tool.route === route)
  const pathTool = exactTool || TOOL_REGISTRY.find((tool) => tool.route.split('?')[0] === pathname)

  if (pathTool) return `${pathTool.name} | KadexAI`
  if (pathname.startsWith('/dashboard')) return 'Çalışma Alanı | KadexAI'
  return 'KadexAI | Kade New Media'
}
