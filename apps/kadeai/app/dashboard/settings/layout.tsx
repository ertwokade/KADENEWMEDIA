import { redirect } from 'next/navigation'
import { getAuthenticatedUser } from '@/lib/auth/server'
import { isSettingsOwnerEmail } from '@/lib/featureAccess'
import { appRoutes, withBasePath } from '@/lib/appConfig'

export const dynamic = 'force-dynamic'

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthenticatedUser()

  if (!isSettingsOwnerEmail(user?.email)) {
    redirect(withBasePath(appRoutes.dashboard))
  }

  return children
}
