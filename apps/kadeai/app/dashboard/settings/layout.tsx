import { redirect } from 'next/navigation'
import { hasAuthenticatedUser } from '@/lib/auth/server'
import { appRoutes, withBasePath } from '@/lib/appConfig'

export const dynamic = 'force-dynamic'

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  if (!(await hasAuthenticatedUser())) {
    redirect(withBasePath(appRoutes.login))
  }

  return children
}
