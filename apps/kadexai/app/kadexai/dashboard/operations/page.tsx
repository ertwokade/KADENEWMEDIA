import OperationsWorkspace from '@/components/operations/OperationsWorkspace'
import { withBasePath } from '@/lib/appConfig'

const validViews = new Set([
  'dashboard',
  'comments',
  'crm',
  'banana',
  'calendar',
  'clients',
  'settings',
  'pages',
])
// Kit statik dosya olarak servis ediliyor; sürüm damgası değişmezse
// tarayıcı eski paketi kullanmaya devam ediyor.
const operationsKitVersion = '20260901d'

export default async function OperationsPage({
  searchParams,
}: {
  searchParams?: Promise<{ view?: string }>
}) {
  const params = await searchParams
  const view = params?.view || 'dashboard'
  const targetView = validViews.has(view) ? view : 'dashboard'
  const iframeSrc = `${withBasePath('/operations-kit/index.html')}?view=${encodeURIComponent(targetView)}&embed=1&v=${operationsKitVersion}`

  return (
    <OperationsWorkspace key={iframeSrc} initialView={targetView} iframeSrc={iframeSrc} />
  )
}
