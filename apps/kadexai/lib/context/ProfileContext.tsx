'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { apiPath } from '@/lib/appConfig'
import {
  AccountContextValue,
  EMPTY_ACCOUNT_CONTEXT,
  normalizeAccountContext,
  PROFILE_STORAGE_KEY,
} from '@/lib/profile/types'

interface ProfileContextState {
  account: AccountContextValue
  loading: boolean
  cloudBacked: boolean
  error: string
  saveAccount: (account: AccountContextValue) => Promise<boolean>
  reload: () => Promise<void>
}

const ProfileContext = createContext<ProfileContextState | null>(null)

function readLocalAccount() {
  if (typeof window === 'undefined') return normalizeAccountContext(EMPTY_ACCOUNT_CONTEXT)
  try {
    return normalizeAccountContext(JSON.parse(localStorage.getItem(PROFILE_STORAGE_KEY) || 'null'))
  } catch {
    localStorage.removeItem(PROFILE_STORAGE_KEY)
    return normalizeAccountContext(EMPTY_ACCOUNT_CONTEXT)
  }
}

function persistLocalAccount(account: AccountContextValue) {
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(account))
  window.dispatchEvent(new CustomEvent('kade:profile-updated', { detail: account }))
}

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<AccountContextValue>(EMPTY_ACCOUNT_CONTEXT)
  const [loading, setLoading] = useState(true)
  const [cloudBacked, setCloudBacked] = useState(false)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    setLoading(true)
    setError('')
    const local = readLocalAccount()
    try {
      const response = await fetch(apiPath('/api/profile'), { cache: 'no-store' })
      if (!response.ok) throw new Error(response.status === 401 ? 'Yerel profil kullanılıyor.' : 'Profil yüklenemedi.')
      const payload = await response.json()
      const remote = normalizeAccountContext(payload.account)
      setAccount(remote)
      persistLocalAccount(remote)
      setCloudBacked(Boolean(payload.cloud))
    } catch (reason) {
      setAccount(local)
      setCloudBacked(false)
      if (reason instanceof Error && !reason.message.includes('Yerel profil')) setError(reason.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void reload() }, [reload])

  useEffect(() => {
    const sync = (event: Event) => {
      const next = (event as CustomEvent<AccountContextValue>).detail
      if (next) setAccount(normalizeAccountContext(next))
    }
    window.addEventListener('kade:profile-updated', sync)
    return () => window.removeEventListener('kade:profile-updated', sync)
  }, [])

  const saveAccount = useCallback(async (next: AccountContextValue) => {
    const normalized = normalizeAccountContext(next)
    setAccount(normalized)
    persistLocalAccount(normalized)
    setError('')
    try {
      const response = await fetch(apiPath('/api/profile'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account: normalized }),
      })
      if (!response.ok) throw new Error(response.status === 401 ? 'Yerel profil kaydedildi.' : 'Bulut profili kaydedilemedi.')
      const payload = await response.json()
      const remote = normalizeAccountContext(payload.account)
      setAccount(remote)
      persistLocalAccount(remote)
      setCloudBacked(Boolean(payload.cloud))
      return true
    } catch (reason) {
      setCloudBacked(false)
      if (reason instanceof Error && !reason.message.includes('Yerel profil')) setError(reason.message)
      return false
    }
  }, [])

  const value = useMemo(() => ({ account, loading, cloudBacked, error, saveAccount, reload }), [account, loading, cloudBacked, error, saveAccount, reload])
  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}

export function useProfile() {
  const value = useContext(ProfileContext)
  if (!value) throw new Error('useProfile must be used inside ProfileProvider')
  return value
}
