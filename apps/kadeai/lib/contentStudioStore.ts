import 'server-only'

import { createClient } from '@/lib/supabase/server'
import type { ContentStudioPackage } from '@/lib/contentStudio'

export interface ContentStudioRun {
  id: string
  source_title: string
  source_url: string | null
  output: ContentStudioPackage
  model: string
  created_at: string
}

export async function getBrandVoice(userId: string) {
  const db = await createClient()
  const { data, error } = await db
    .from('kade_brand_voices')
    .select('samples, strength, updated_at')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data as { samples: string[]; strength: number; updated_at: string } | null
}

export async function saveBrandVoice(userId: string, samples: string[], strength: number) {
  const db = await createClient()
  const { data, error } = await db
    .from('kade_brand_voices')
    .upsert({ user_id: userId, samples, strength, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
    .select('samples, strength, updated_at')
    .single()
  if (error) throw new Error(error.message)
  return data as { samples: string[]; strength: number; updated_at: string }
}

export async function listContentStudioRuns(userId: string, limit = 30) {
  const db = await createClient()
  const { data, error } = await db
    .from('kade_content_runs')
    .select('id, source_title, source_url, output, model, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 50))
  if (error) throw new Error(error.message)
  return (data ?? []) as ContentStudioRun[]
}

export async function getContentStudioRun(userId: string, id: string) {
  const db = await createClient()
  const { data, error } = await db
    .from('kade_content_runs')
    .select('id, source_title, source_url, output, model, created_at')
    .eq('user_id', userId)
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data as ContentStudioRun | null
}

export async function createContentStudioRun(input: {
  userId: string
  sourceTitle: string
  sourceUrl: string | null
  sourceText: string
  voiceSamples: string[]
  output: ContentStudioPackage
  model: string
}) {
  const db = await createClient()
  const { data, error } = await db
    .from('kade_content_runs')
    .insert({
      user_id: input.userId,
      source_title: input.sourceTitle,
      source_url: input.sourceUrl,
      source_text: input.sourceText,
      voice_samples: input.voiceSamples,
      output: input.output,
      model: input.model,
      status: 'ready',
    })
    .select('id, source_title, source_url, output, model, created_at')
    .single()
  if (error) throw new Error(error.message)
  return data as ContentStudioRun
}
