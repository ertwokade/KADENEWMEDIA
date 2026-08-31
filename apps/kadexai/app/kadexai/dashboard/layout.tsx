import { redirect } from 'next/navigation'
import DashboardShell from '@/components/layout/DashboardShell'
import { getAuthenticatedUser, hasAuthenticatedUser } from '@/lib/auth/server'
import { appRoutes, withBasePath } from '@/lib/appConfig'
import { isAllowedOwnerEmail, isAllowedOwnerUser } from '@/lib/featureAccess'
import { WorkspaceProvider } from '@/lib/workspace/WorkspaceContext'
import { workspaceSlugForUser } from '@/lib/workspace/slug'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  if (!(await hasAuthenticatedUser())) redirect(withBasePath(appRoutes.login))

  // Panel içi bağlantılar kullanıcının kendi adresini taşısın diye slug
  // sunucuda çözülüp aşağı veriliyor. Yetki kararı değil, yalnızca adres.
  const user = await getAuthenticatedUser()
  const slug = user ? workspaceSlugForUser(user, isAllowedOwnerEmail(user.email)) : null

  return (
    <WorkspaceProvider slug={slug}>
      <DashboardShell>{children}</DashboardShell>
    </WorkspaceProvider>
  )
}
