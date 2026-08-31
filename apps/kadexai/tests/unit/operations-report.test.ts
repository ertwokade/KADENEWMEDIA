import assert from 'node:assert/strict'
import { test } from 'node:test'
import { formatOperationsReport, normalizeOperationsReport } from '../../lib/notifications/operationsReport'

test('operasyon raporu yalnız bilinen bölüm ve durumları kabul eder', () => {
  assert.deepEqual(
    normalizeOperationsReport({ message: 'Görev tamamlandı', view: 'crm', type: 'success' }),
    { message: 'Görev tamamlandı', view: 'crm', type: 'success' },
  )
  assert.deepEqual(
    normalizeOperationsReport({ message: 'Test', view: 'unknown', type: 'unknown' }),
    { message: 'Test', view: 'dashboard', type: 'info' },
  )
})

test('operasyon raporu kontrol karakterlerini ve aşırı uzun mesajı temizler', () => {
  const report = normalizeOperationsReport({ message: `Görev\n${'x'.repeat(500)}` })
  assert.equal(report.message.includes('\n'), false)
  assert.equal(report.message.length, 320)
})

test('WhatsApp operasyon raporu bölüm, durum ve İstanbul saatini içerir', () => {
  const message = formatOperationsReport(
    { message: 'Prodüksiyon kartı açıldı', view: 'crm', type: 'success' },
    new Date('2026-08-25T10:15:00Z'),
  )
  assert.match(message, /KadexAI · Operasyon Raporu/)
  assert.match(message, /Prodüksiyon CRM/)
  assert.match(message, /Başarılı/)
  assert.match(message, /13:15/)
})
