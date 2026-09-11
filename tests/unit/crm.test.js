import { test } from 'node:test'
import assert from 'node:assert/strict'
import { serviceLabel, hasTestMarker, filterLeadRecords } from '../../src/utils/crm.js'

test('CRM hizmet kodları ve özel hizmetler anlaşılır biçimde korunur', () => {
  assert.equal(serviceLabel('social, ads, Özel Çekim'), 'Sosyal Medya Yönetimi, Reklam Yönetimi, Özel Çekim')
  assert.equal(serviceLabel(['content', 'web']), 'İçerik Üretimi, Web Sitesi')
  assert.equal(serviceLabel('-'), '—')
})

test('test işaretleri yalnız filtreleme içindir, kayıtları değiştirmez', () => {
  const leads = [{ name: 'Ayşe', email: 'ayse@firma.com' }, { name: 'Demo Müşteri' }, { email: 'audit@example.test' }]
  assert.equal(hasTestMarker({ email: 'contest@firma.com' }), false)
  assert.equal(hasTestMarker({ is_test: true }), true)
  assert.equal(filterLeadRecords(leads, 'test').length, 2)
  assert.deepEqual(filterLeadRecords(leads, 'unmarked'), [leads[0]])
  assert.equal(filterLeadRecords(leads, 'all'), leads)
  assert.equal(leads.length, 3)
})
