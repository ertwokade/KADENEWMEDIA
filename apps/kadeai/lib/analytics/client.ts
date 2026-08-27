'use client'

import posthog from 'posthog-js'

export const ANALYTICS_CONSENT_KEY = 'kade-analytics-consent'

export type AnalyticsEvent =
  | 'signup'
  | 'demo_started'
  | 'package_viewed'
  | 'checkout_started'
  | 'checkout_completed'
  | 'quote_requested'
  | 'custom_offer_viewed'
  | 'subscription_activated'
  | 'tool_used'
  | 'churn'
  | 'upgrade'
  | 'downgrade'
  | 'login_succeeded'
  | 'login_failed'
  | 'logout'
  // Not: ai_request_* olayları BİLİNÇLİ olarak bağlanmadı. Her AI çağrısında
  // ek bir HTTP isteği üretmek sıcak yolu yavaşlatır ve maliyet doğurur;
  // token/maliyet/başarı verisi zaten ai_usage_events defterinde tutuluyor
  // (bkz. lib/usage/ledger.ts) ve admin panelinden okunuyor.
  | 'ai_request_completed'
  | 'ai_request_failed'
  | 'payment_started'
  | 'payment_completed'
  | 'payment_failed'

function canRun() {
  return typeof window !== 'undefined'
    && process.env.NODE_ENV === 'production'
    && process.env.NEXT_PUBLIC_POSTHOG_ENABLED === '1'
    && Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY)
    && window.localStorage.getItem(ANALYTICS_CONSENT_KEY) === 'granted'
}

export function initAnalytics() {
  if (!canRun() || posthog.__loaded) return
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com',
    defaults: '2026-05-30',
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: false,
    disable_session_recording: true,
    persistence: 'localStorage',
  })
}

export function captureAnalytics(event: AnalyticsEvent, properties: Record<string, string | number | boolean> = {}) {
  if (!canRun()) return
  initAnalytics()
  posthog.capture(event, properties)
}

export function setAnalyticsConsent(granted: boolean) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(ANALYTICS_CONSENT_KEY, granted ? 'granted' : 'denied')
  if (granted) initAnalytics()
  else posthog.opt_out_capturing()
}
