import { redirect } from 'next/navigation'
import DashboardShell from '@/components/layout/DashboardShell'
import { hasAuthenticatedUser } from '@/lib/auth/server'
import { appRoutes, withBasePath } from '@/lib/appConfig'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  if (!(await hasAuthenticatedUser())) redirect(withBasePath(appRoutes.login))
  return <DashboardShell>{children}</DashboardShell>
}
