'use client'

import { type ChangeEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  BrainCircuit,
  Check,
  CircleCheck,
  Cloud,
  Download,
  FileText,
  HardDrive,
  LogOut,
  Upload,
  UserRound,
} from 'lucide-react'
import { useProfile } from '@/lib/context/ProfileContext'
import { getProfileCompletion, PROFILE_STORAGE_KEY } from '@/lib/profile/types'
import {
  applyCompanyBriefText,
  MAX_COMPANY_BRIEF_LENGTH,
  SAMPLE_COMPANY_BRIEF_DOWNLOADS,
} from '@/lib/profile/brief'
import { LOCAL_HISTORY_KEY } from '@/lib/client/api'
import { apiPath, withBasePath } from '@/lib/appConfig'
import { MANUAL_MODEL_STORAGE_KEY } from '@/lib/context/ModelContext'
import { captureAnalytics } from '@/lib/analytics/client'

function splitList(value: string) {
  return value.split(/[,\n]/).map((item) => item.trim()).filter(Boolean)
}

export default function AccountSettingsPanel() {
  const { account, loading, cloudBacked, error, saveAccount } = useProfile()
  const [draft, setDraft] = useState(account)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [briefMessage, setBriefMessage] = useState('')
  const [briefError, setBriefError] = useState('')

  useEffect(() => setDraft(account), [account])

  const update = (section: 'profile' | 'workspace' | 'brand' | 'preferences', key: string, value: unknown) => {
    setDraft((current) => ({ ...current, [section]: { ...current[section], [key]: value } }))
  }

  const save = async () => {
    setSaving(true)
    await saveAccount(draft)
    setSaving(false)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2000)
  }

  const importBrief = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    setBriefError('')
    setBriefMessage('')
    if (!file) return
    if (file.size > 100_000) {
      setBriefError('Brief dosyası en fazla 100 KB olabilir.')
      return
    }
    if (!/\.(txt|json)$/i.test(file.name)) {
      setBriefError('TXT veya JSON biçiminde bir brief yükleyin.')
      return
    }

    const raw = await file.text()
    if (!raw.trim()) {
      setBriefError('Yüklenen brief dosyası boş.')
      return
    }

    const result = applyCompanyBriefText(draft, raw)
    setDraft(result.account)
    setBriefMessage(
      result.importedFields.length > 0
        ? `${result.importedFields.length} profil alanı brief içinden hazırlandı. Kaydettiğinizde KadeAI kullanmaya başlayacak.`
        : 'Brief metni hazırlandı. Kaydettiğinizde KadeAI tüm üretimlerde kullanacak.'
    )
  }

  const logout = async () => {
    captureAnalytics('logout')
    await fetch(apiPath('/api/auth/logout'), { method: 'POST' }).catch(() => undefined)
    ;[PROFILE_STORAGE_KEY, LOCAL_HISTORY_KEY, MANUAL_MODEL_STORAGE_KEY, 'kade-content-calendar', 'contentai-templates', 'kade-kit-v5'].forEach((key) => localStorage.removeItem(key))
    window.location.href = withBasePath('/login')
  }

  const inputClass = 'w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-400 placeholder:text-zinc-600'
  const labelClass = 'space-y-1.5 text-xs font-medium text-zinc-400'
  const knownContext = [
    draft.brand.description && 'Şirket briefi',
    draft.brand.name && 'Marka',
    draft.brand.niche && 'Sektör',
    draft.brand.audience && 'Hedef kitle',
    draft.brand.voice && 'Marka tonu',
    draft.brand.products.length > 0 && 'Ürünler',
    draft.brand.contentGoals.length > 0 && 'İçerik hedefleri',
    draft.brand.keywords.length > 0 && 'Anahtar kelimeler',
    draft.brand.competitors.length > 0 && 'Rakipler',
    draft.brand.forbiddenWords.length > 0 && 'Kaçınılacak ifadeler',
  ].filter((item): item is string => Boolean(item))

  return (
    <section className="rounded-xl border border-zinc-700/60 bg-zinc-900/60 p-5">
      <div className="mb-5 flex flex-wrap items-start gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-amber-400/10 text-amber-300"><UserRound className="h-5 w-5" /></div>
        <div><h2 className="font-semibold text-zinc-100">Şirket hafızası ve aktif marka</h2><p className="mt-0.5 text-xs text-zinc-500">Kaydettiğiniz bağlam bütün KadeAI araçlarında otomatik kullanılır.</p></div>
        <div className="ml-auto flex items-center gap-2 text-xs text-zinc-500">
          {cloudBacked ? <Cloud className="h-4 w-4 text-emerald-400" /> : <HardDrive className="h-4 w-4 text-amber-400" />}
          %{getProfileCompletion(draft)} · {cloudBacked ? 'Hesaba kayıtlı' : 'Bu cihazda'}
        </div>
      </div>

      {loading ? <p className="py-8 text-center text-sm text-zinc-500">Profil yükleniyor…</p> : <div className="space-y-5">
        <div className="overflow-hidden rounded-xl border border-amber-400/25 bg-gradient-to-br from-amber-400/10 via-zinc-950/80 to-zinc-950">
          <div className="flex flex-wrap items-start gap-3 border-b border-amber-400/15 p-4">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-amber-400 text-zinc-950">
              <BrainCircuit className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-zinc-100">Şirket Briefi ve AI Hafızası</h3>
              <p className="mt-1 max-w-xl text-xs leading-relaxed text-zinc-400">
                Şirketinizi, müşterinizi, tonunuzu ve kurallarınızı bir kez tanıtın. KadeAI; başlık, reklam,
                içerik planı ve diğer tüm üretimlerde bu briefi arka planda dikkate alır.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="flex overflow-hidden rounded-lg border border-zinc-700 bg-zinc-900">
                <span className="flex items-center gap-2 border-r border-zinc-700 px-3 py-2 text-xs font-semibold text-zinc-300">
                  <Download className="h-4 w-4" /> Örnek brief
                </span>
                {SAMPLE_COMPANY_BRIEF_DOWNLOADS.map((download) => (
                  <a
                    key={download.label}
                    href={withBasePath(download.path)}
                    download
                    title={`${download.label} formatında indir`}
                    className="border-r border-zinc-700 px-2.5 py-2 text-xs font-bold text-zinc-400 last:border-r-0 hover:bg-zinc-800 hover:text-amber-300"
                  >
                    {download.label}
                  </a>
                ))}
              </div>
              <label
                htmlFor="company-brief-file"
                className="flex cursor-pointer items-center gap-2 rounded-lg bg-amber-400 px-3 py-2 text-xs font-bold text-zinc-950 hover:bg-amber-300"
              >
                <Upload className="h-4 w-4" /> Brief yükle
              </label>
              <input
                id="company-brief-file"
                type="file"
                accept=".txt,.json,text/plain,application/json"
                className="sr-only"
                onChange={importBrief}
              />
            </div>
          </div>
          <div className="space-y-3 p-4">
            <label className={labelClass}>
              AI&apos;nin kullanacağı şirket briefi
              <textarea
                className={`${inputClass} min-h-56 resize-y leading-relaxed`}
                value={draft.brand.description}
                maxLength={MAX_COMPANY_BRIEF_LENGTH}
                onChange={(event) => update('brand', 'description', event.target.value)}
                placeholder="Şirketin ne yapar, hedef kitlen kim, nasıl konuşmalı, hangi ürünleri ve kuralları bilmeli?"
              />
            </label>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
              <FileText className="h-3.5 w-3.5" />
              <span>{draft.brand.description.length.toLocaleString('tr-TR')} / {MAX_COMPANY_BRIEF_LENGTH.toLocaleString('tr-TR')} karakter</span>
              <span className="text-zinc-700">•</span>
              <span>Yüklenen dosya önce taslağa alınır; kaydetmeden hesabınıza yazılmaz.</span>
            </div>
            {briefMessage && (
              <p className="flex items-start gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-300">
                <CircleCheck className="mt-0.5 h-4 w-4 shrink-0" /> {briefMessage}
              </p>
            )}
            {briefError && <p role="alert" className="text-xs text-red-300">{briefError}</p>}
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">KadeAI şu anda biliyor</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {knownContext.length > 0 ? knownContext.map((item) => (
                  <span key={item} className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-[11px] text-amber-200">{item}</span>
                )) : <span className="text-xs text-zinc-600">Henüz şirket bağlamı eklenmedi.</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className={labelClass}>Ad soyad<input className={inputClass} value={draft.profile.displayName} onChange={(e) => update('profile', 'displayName', e.target.value)} /></label>
          <label className={labelClass}>Çalışma alanı<input className={inputClass} value={draft.workspace.name} onChange={(e) => update('workspace', 'name', e.target.value)} /></label>
          <label className={labelClass}>Marka adı<input className={inputClass} value={draft.brand.name} onChange={(e) => update('brand', 'name', e.target.value)} /></label>
          <label className={labelClass}>Niş / sektör<input className={inputClass} value={draft.brand.niche} onChange={(e) => update('brand', 'niche', e.target.value)} /></label>
        </div>
        <label className={labelClass}>Hedef kitle<textarea className={`${inputClass} min-h-20`} value={draft.brand.audience} onChange={(e) => update('brand', 'audience', e.target.value)} /></label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={labelClass}>Marka tonu<input className={inputClass} value={draft.brand.voice} onChange={(e) => update('brand', 'voice', e.target.value)} /></label>
          <label className={labelClass}>Varsayılan içerik tonu<input className={inputClass} value={draft.preferences.tone} onChange={(e) => update('preferences', 'tone', e.target.value)} /></label>
          <label className={labelClass}>Platformlar<input className={inputClass} value={draft.preferences.platforms.join(', ')} onChange={(e) => { const next = splitList(e.target.value); update('preferences', 'platforms', next); update('brand', 'preferredPlatforms', next) }} /></label>
          <label className={labelClass}>Ürün / hizmetler<input className={inputClass} value={draft.brand.products.join(', ')} onChange={(e) => update('brand', 'products', splitList(e.target.value))} /></label>
          <label className={labelClass}>Web sitesi<input className={inputClass} value={draft.brand.website} onChange={(e) => update('brand', 'website', e.target.value)} placeholder="https://…" /></label>
          <label className={labelClass}>Anahtar kelimeler<input className={inputClass} value={draft.brand.keywords.join(', ')} onChange={(e) => update('brand', 'keywords', splitList(e.target.value))} /></label>
          <label className={labelClass}>İçerik hedefleri<input className={inputClass} value={draft.brand.contentGoals.join(', ')} onChange={(e) => update('brand', 'contentGoals', splitList(e.target.value))} /></label>
          <label className={labelClass}>Rakipler<input className={inputClass} value={draft.brand.competitors.join(', ')} onChange={(e) => update('brand', 'competitors', splitList(e.target.value))} /></label>
        </div>
        <label className={labelClass}>Kaçınılacak kelime ve ifadeler<input className={inputClass} value={draft.brand.forbiddenWords.join(', ')} onChange={(e) => update('brand', 'forbiddenWords', splitList(e.target.value))} placeholder="ucuz, mucize, kesin sonuç…" /></label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-zinc-800 bg-zinc-950/60 p-3 text-sm text-zinc-300">
            <span><strong className="block text-zinc-100">Otomatik model seçimi</strong><span className="mt-0.5 block text-xs text-zinc-500">Açıksa göreve göre yönlendirir; kapalıysa son manuel seçimini korur.</span></span>
            <input type="checkbox" checked={draft.preferences.autoModel} onChange={(e) => update('preferences', 'autoModel', e.target.checked)} className="h-5 w-5 shrink-0 accent-amber-400" />
          </label>
          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-zinc-800 bg-zinc-950/60 p-3 text-sm text-zinc-300">
            <span><strong className="block text-zinc-100">Araç girdilerini hatırla</strong><span className="mt-0.5 block text-xs text-zinc-500">Kapalıysa geçmişte istem metni saklanmaz.</span></span>
            <input type="checkbox" checked={draft.preferences.rememberInputs} onChange={(e) => update('preferences', 'rememberInputs', e.target.checked)} className="h-5 w-5 shrink-0 accent-amber-400" />
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-3 border-t border-zinc-800 pt-4">
          <button onClick={save} disabled={saving} className="flex items-center gap-2 rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-bold text-zinc-950 hover:bg-amber-300 disabled:opacity-50"><Check className="h-4 w-4" />{saving ? 'Kaydediliyor…' : saved ? 'Kaydedildi' : 'Briefi ve profili kaydet'}</button>
          <Link href="/onboarding" className="rounded-lg border border-zinc-700 px-3 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800">Ayrıntılı düzenle</Link>
          <button onClick={logout} className="ml-auto flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-zinc-500 hover:bg-red-950/40 hover:text-red-300"><LogOut className="h-4 w-4" /> Çıkış yap</button>
        </div>
        {error && <p className="text-xs text-amber-400">{error} Yerel kayıt kullanılmaya devam ediyor.</p>}
      </div>}
    </section>
  )
}
