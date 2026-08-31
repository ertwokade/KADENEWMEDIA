'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, BarChart3, CheckCircle, Sparkles } from 'lucide-react'
import { captureAnalytics } from '@/lib/analytics/client'
import type { DemoPageContent } from '@/lib/cms/defaults'

const DAILY_LIMIT = 3
const STORAGE_KEY = 'kadexai-public-demo-v1'

function todayKey() { return new Date().toISOString().slice(0, 10) }

export default function KadexAIDemo({ content }: { content: DemoPageContent }) {
  const [topic, setTopic] = useState('AI destekli içerik ve yeni medya danışmanlığı')
  const [primaryCta, ...secondaryCtas] = content.ctas
  const [running, setRunning] = useState(false)
  const [complete, setComplete] = useState(false)
  const [error, setError] = useState('')

  function runDemo() {
    setError('')
    let record = { date: todayKey(), count: 0 }
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
      if (stored?.date === record.date) record = stored
    } catch {}
    if (record.count >= DAILY_LIMIT) {
      setError('Bugünkü 3 demo hakkın tamamlandı. KadexAI hesabında tam araçları kullanabilirsin.')
      return
    }
    record.count += 1
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record))
    captureAnalytics('demo_started', { sample: 'social-analyst' })
    setRunning(true)
    setComplete(false)
    window.setTimeout(() => { setRunning(false); setComplete(true) }, 900)
  }

  return (
    <main className="min-h-screen bg-[#0c0c0d] text-zinc-100">
      <nav className="border-b border-white/10"><div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4"><Link href="/" className="text-sm font-black tracking-[0.18em] text-[#f2c322]">KadexAI</Link><div className="flex items-center gap-4 text-xs"><Link href="/paketler" className="text-zinc-400 hover:text-white">Planlar</Link><Link href="/kadexai/login" className="rounded-full bg-[#f2c322] px-4 py-2 font-bold text-zinc-950">KadexAI’yi Dene</Link></div></div></nav>
      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-16 lg:grid-cols-[1fr_0.9fr] lg:py-24">
        <div><p className="text-xs font-bold uppercase tracking-[0.25em] text-[#f2c322]">{content.eyebrow}</p><h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight sm:text-6xl">{content.title}</h1><p className="mt-6 max-w-2xl text-base leading-8 text-zinc-400">{content.description}</p><div className="mt-8 flex flex-wrap gap-3">{primaryCta && <Link href={primaryCta.href} className="inline-flex items-center gap-2 rounded-full bg-[#f2c322] px-5 py-3 text-sm font-bold text-zinc-950">{primaryCta.label} <ArrowRight className="h-4 w-4" /></Link>}{secondaryCtas.map((cta) => <Link key={cta.href} href={cta.href} className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold">{cta.label}</Link>)}</div></div>
        <div className="rounded-3xl border border-white/10 bg-zinc-900 p-5 shadow-2xl shadow-black/30 sm:p-7"><div className="flex items-center gap-2 text-sm font-semibold"><Sparkles className="h-4 w-4 text-[#f2c322]" /> {content.panelTitle}</div><label className="mt-6 block text-xs font-medium text-zinc-400">{content.panelFieldLabel}<textarea value={topic} onChange={(event) => setTopic(event.target.value)} maxLength={240} rows={3} className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-zinc-100 outline-none focus:border-[#f2c322]" /></label><button onClick={runDemo} disabled={running || !topic.trim()} className="mt-4 w-full rounded-xl bg-[#f2c322] py-3 text-sm font-black text-zinc-950 disabled:opacity-50">{running ? content.panelRunningLabel : content.panelRunLabel}</button><p className="mt-2 text-center text-[11px] text-zinc-600">{content.panelLimitNote}</p>{error && <p role="alert" className="mt-4 rounded-lg bg-red-500/10 p-3 text-xs text-red-300">{error}</p>}</div>
      </section>
      {complete && <section className="mx-auto max-w-6xl px-5 pb-20"><div className="mb-5 flex items-center gap-2"><CheckCircle className="h-5 w-5 text-emerald-400" /><h2 className="text-xl font-bold">{content.resultsTitle}</h2></div><div className="grid gap-4 sm:grid-cols-2">{content.results.map((item) => <article key={item.title} className="rounded-2xl border border-white/10 bg-zinc-900/60 p-5"><BarChart3 className="h-5 w-5 text-[#f2c322]" /><h3 className="mt-4 text-sm font-bold">{item.title}</h3><p className="mt-2 text-sm leading-6 text-zinc-400">{item.text}</p></article>)}</div></section>}
      <section className="border-t border-white/10 bg-zinc-900/40"><div className="mx-auto max-w-6xl px-5 py-16"><h2 className="text-2xl font-black">{content.featuresTitle}</h2><div className="mt-6 grid gap-4 sm:grid-cols-3">{content.features.map((item) => <article key={item.title} className="rounded-2xl border border-white/10 p-5"><h3 className="font-bold text-[#f2c322]">{item.title}</h3><p className="mt-2 text-sm leading-6 text-zinc-400">{item.text}</p></article>)}</div><div className="mt-10"><h2 className="text-2xl font-black">Sık sorulanlar</h2><dl className="mt-6 space-y-4">{content.faq.map((item) => <div key={item.question} className="rounded-2xl border border-white/10 p-5"><dt className="font-bold">{item.question}</dt><dd className="mt-2 text-sm leading-6 text-zinc-400">{item.answer}</dd></div>)}</dl></div></div></section>
    </main>
  )
}
