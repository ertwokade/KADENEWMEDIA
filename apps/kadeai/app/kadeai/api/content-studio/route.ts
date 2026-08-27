import { NextRequest, NextResponse } from 'next/server'
import { assertAuthenticatedUser } from '@/lib/auth/server'
import { generateContent } from '@/lib/ai/provider'
import { parseStructuredOutput } from '@/lib/ai/structured'
import {
  buildContentStudioPrompt,
  CONTENT_STUDIO_SYSTEM_PROMPT,
  formatContentPackageWhatsApp,
  normalizeContentStudioPackage,
  sanitizeSourceUrl,
  sanitizeVoiceSamples,
  voiceStrength,
} from '@/lib/contentStudio'
import {
  createContentStudioRun,
  getBrandVoice,
  getContentStudioRun,
  listContentStudioRuns,
  saveBrandVoice,
} from '@/lib/contentStudioStore'
import { recordAuditEvent } from '@/lib/audit/server'
import { sendWhatsAppMessage, whatsappConfiguration } from '@/lib/notifications/whatsapp'
import { getRateLimitKey, rateLimit, rateLimitHeaders } from '@/lib/rateLimit'
import type { AIModel } from '@/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

function safeTitle(value: unknown) {
  return String(value ?? '').replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 180)
}

export async function GET(request: NextRequest) {
  const limit = rateLimit(getRateLimitKey(request, 'content-studio-read'), 60, 60_000)
  const headers = { ...rateLimitHeaders(limit), 'Cache-Control': 'private, no-store' }
  if (!limit.allowed) return NextResponse.json({ error: 'Çok fazla istek.' }, { status: 429, headers })

  const user = await assertAuthenticatedUser()
  if (!user) return NextResponse.json({ error: 'Oturum gerekli.' }, { status: 401, headers })

  try {
    const [voice, runs] = await Promise.all([
      getBrandVoice(user.id),
      listContentStudioRuns(user.id),
    ])
    return NextResponse.json({ voice, runs }, { headers })
  } catch {
    return NextResponse.json({ error: 'İçerik stüdyosu verileri okunamadı.' }, { status: 503, headers })
  }
}

export async function POST(request: NextRequest) {
  const limit = rateLimit(getRateLimitKey(request, 'content-studio-write'), 15, 60_000)
  const headers = { ...rateLimitHeaders(limit), 'Cache-Control': 'private, no-store' }
  if (!limit.allowed) return NextResponse.json({ error: 'Çok fazla istek. Bir dakika sonra tekrar dene.' }, { status: 429, headers })

  const user = await assertAuthenticatedUser()
  if (!user) return NextResponse.json({ error: 'Oturum gerekli.' }, { status: 401, headers })

  try {
    const body = await request.json() as Record<string, unknown>
    const action = String(body.action ?? 'generate')

    if (action === 'save_voice') {
      const samples = sanitizeVoiceSamples(body.samples)
      if (!samples.length) {
        return NextResponse.json({ error: 'En az 30 karakterlik bir marka sesi örneği gerekli.' }, { status: 400, headers })
      }
      const voice = await saveBrandVoice(user.id, samples, voiceStrength(samples))
      void recordAuditEvent({
        actorUserId: user.id,
        action: 'content_studio.voice_saved',
        resourceType: 'kade_brand_voice',
        metadata: { sampleCount: samples.length, strength: voice.strength },
      })
      return NextResponse.json({ voice }, { headers })
    }

    if (action === 'notify') {
      const runId = String(body.runId ?? '').trim()
      if (!/^[0-9a-f-]{36}$/i.test(runId)) {
        return NextResponse.json({ error: 'Geçerli içerik paketi kimliği gerekli.' }, { status: 400, headers })
      }
      const run = await getContentStudioRun(user.id, runId)
      if (!run) return NextResponse.json({ error: 'İçerik paketi bulunamadı.' }, { status: 404, headers })
      const config = whatsappConfiguration()
      if (!config.configured) {
        return NextResponse.json({ error: 'WhatsApp yapılandırılmamış.', missing: config.missing }, { status: 503, headers })
      }
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://kadenewmedia.com'
      const delivery = await sendWhatsAppMessage(formatContentPackageWhatsApp(
        run.output,
        `${siteUrl}/kadeai/dashboard/content-studio?run=${encodeURIComponent(run.id)}`,
      ))
      void recordAuditEvent({
        actorUserId: user.id,
        action: 'content_studio.whatsapp_sent',
        resourceType: 'kade_content_run',
        resourceId: run.id,
      })
      return NextResponse.json({ sent: true, provider: delivery.provider }, { headers })
    }

    const sourceText = String(body.sourceText ?? '').replace(/\u0000/g, '').trim().slice(0, 16_000)
    const sourceTitle = safeTitle(body.sourceTitle) || 'Başlıksız kaynak'
    const sourceUrl = sanitizeSourceUrl(body.sourceUrl)
    const submittedSamples = sanitizeVoiceSamples(body.voiceSamples)
    if (sourceText.length < 120) {
      return NextResponse.json({ error: 'Kaynak metin veya döküm en az 120 karakter olmalı.' }, { status: 400, headers })
    }

    const savedVoice = submittedSamples.length ? null : await getBrandVoice(user.id)
    const voiceSamples = submittedSamples.length ? submittedSamples : sanitizeVoiceSamples(savedVoice?.samples)
    if (submittedSamples.length) await saveBrandVoice(user.id, submittedSamples, voiceStrength(submittedSamples))

    const requestedModel = String(body.model ?? 'auto') as AIModel
    const result = await generateContent({
      model: requestedModel,
      maxTokens: 4000,
      systemPrompt: CONTENT_STUDIO_SYSTEM_PROMPT,
      prompt: buildContentStudioPrompt({ sourceTitle, sourceUrl, sourceText, voiceSamples }),
    }, request)
    const output = normalizeContentStudioPackage(parseStructuredOutput(result.content), sourceTitle)
    const run = await createContentStudioRun({
      userId: user.id,
      sourceTitle,
      sourceUrl,
      sourceText,
      voiceSamples,
      output,
      model: result.model,
    })
    void recordAuditEvent({
      actorUserId: user.id,
      action: 'content_studio.generated',
      resourceType: 'kade_content_run',
      resourceId: run.id,
      metadata: { sourceHasUrl: Boolean(sourceUrl), voiceSamples: voiceSamples.length },
    })
    return NextResponse.json({
      run,
      model: result.model,
      routingReason: result.routingReason,
      tokensUsed: result.tokensUsed,
    }, { status: 201, headers })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'İçerik paketi oluşturulamadı.'
    const safeMessage = /anahtar|sağlayıcı|kota|oturum|tablo|relation|schema/i.test(message)
      ? message.slice(0, 300)
      : 'İçerik paketi oluşturulamadı.'
    return NextResponse.json({ error: safeMessage }, { status: 503, headers })
  }
}
