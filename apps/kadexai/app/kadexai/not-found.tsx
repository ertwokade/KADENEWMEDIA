import Link from 'next/link'
import { withBasePath } from '@/lib/appConfig'

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-zinc-950 p-6 text-zinc-100">
      <div className="max-w-md text-center"><p className="text-7xl font-black text-zinc-800">404</p><h1 className="mt-3 text-2xl font-bold">Bu sayfa bulunamadı</h1><p className="mt-2 text-sm text-zinc-500">Bağlantı eski veya araç artık bu adreste değil.</p><Link href={withBasePath('/dashboard')} className="mt-5 inline-block rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-bold text-zinc-950 hover:bg-amber-300">Çalışma alanına dön</Link></div>
    </main>
  )
}
