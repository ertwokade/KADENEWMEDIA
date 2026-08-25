import { stripBasePath } from '@/lib/appConfig'
import { TOOL_REGISTRY } from '@/lib/tools/registry'

const PUBLIC_PAGE_TITLES: Record<string, string> = {
  '/': 'KadeAI | Kade New Media',
  '/auth': 'Güvenli Giriş | KadeAI',
  '/login': 'Giriş Yap | KadeAI',
  '/logout': 'Çıkış Yapılıyor | KadeAI',
  '/onboarding': 'Marka Profilini Oluştur | KadeAI',
  '/reset-password': 'Şifreyi Yenile | KadeAI',
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

  if (pathTool) return `${pathTool.name} | KadeAI`
  if (pathname.startsWith('/dashboard')) return 'Çalışma Alanı | KadeAI'
  return 'KadeAI | Kade New Media'
}
