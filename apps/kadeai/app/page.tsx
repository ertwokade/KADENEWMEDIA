import { redirect } from 'next/navigation'
import { appRoutes } from '@/lib/appConfig'

export default function Home() {
  redirect(appRoutes.dashboard)
}
