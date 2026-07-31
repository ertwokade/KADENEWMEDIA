import { redirect } from 'next/navigation'
import { getAuthenticatedUser } from '@/lib/auth/server'
import { isSettingsOwnerUser } from '@/lib/featureAccess'
import { appRoutes, withBasePath } from '@/lib/appConfig'

export const dynamic = 'force-dynamic'

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthenticatedUser()

  if (!isSettingsOwnerUser(user)) {
    redirect(withBasePath(appRoutes.dashboard))
  }

  return children
}
