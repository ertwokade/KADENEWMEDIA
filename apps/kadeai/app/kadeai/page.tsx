import { redirect } from 'next/navigation'
import { appRoutes, withBasePath } from '@/lib/appConfig'

export default function Home() {
  redirect(withBasePath(appRoutes.dashboard))
}
