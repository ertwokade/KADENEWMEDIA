import OperationsWorkspace from '@/components/operations/OperationsWorkspace'
import { withBasePath } from '@/lib/appConfig'

const validViews = new Set([
  'dashboard',
  'comments',
  'crm',
  'banana',
  'vibe',
  'radar',
  'settings',
  'pages',
])

export default async function OperationsPage({
  searchParams,
}: {
  searchParams?: Promise<{ view?: string }>
}) {
  const params = await searchParams
  const view = params?.view || 'dashboard'
  const targetView = validViews.has(view) ? view : 'dashboard'
  const iframeSrc = `${withBasePath('/operations-kit/index.html')}?view=${encodeURIComponent(targetView)}&embed=1`

  return (
    <OperationsWorkspace key={iframeSrc} initialView={targetView} iframeSrc={iframeSrc} />
  )
}
