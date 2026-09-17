import test from 'node:test'
import assert from 'node:assert/strict'
import { assignPlanDates, planSlots, planWeek } from '../../lib/contentPlan'

const day = (baslik: string, gun = 1) => ({ gun, baslik, icerik_turu: 'egitici', format: 'reels', aciklama: '', ipucu: '' })

test('haftada 3 planı her hafta sekmesine en fazla 3 içerik koyar ve 30 günü aşmaz', () => {
  const slots = planSlots('haftada 3', '2026-09-16')
  assert.deepEqual(slots.map((slot) => slot.gun), [1, 3, 5, 8, 10, 12, 15, 17, 19, 22, 24, 26, 29])
  for (const week of [1, 2, 3, 4]) assert.equal(slots.filter((slot) => slot.hafta === week).length, 3)
  assert.equal(slots.filter((slot) => slot.hafta === 5).length, 1)
  assert.equal(slots.at(-1)?.tarih, '2026-10-14')
  assert.equal(slots[0].etiket, '16 Eylül Çarşamba')
})

test('model gün numarası ne olursa olsun takvim tarihi plan tarihiyle aynı olur', () => {
  const slots = planSlots('haftada 3', '2026-09-16')
  const days = assignPlanDates([day('A', 1), day('B', 2), day('C', 3), day('D', 4)], slots)
  assert.deepEqual(days.map((d) => [d.gun, d.tarih]), [[1, '2026-09-16'], [3, '2026-09-18'], [5, '2026-09-20'], [8, '2026-09-23']])
  assert.deepEqual(days.map((d) => planWeek(d.gun)), [1, 1, 1, 2])
})

test('fazla gün atılır; diğer sıklıklar doğru sayıda gün üretir', () => {
  const slots = planSlots('haftada 1', '2026-09-16')
  assert.equal(assignPlanDates(Array.from({ length: 15 }, (_, i) => day(`G${i}`)), slots).length, 5)
  assert.equal(planSlots('her gün', '2026-09-16').length, 30)
  assert.deepEqual(planSlots('iki haftada 1', '2026-09-16').map((s) => s.gun), [1, 15, 29])
  assert.equal(planSlots('her gün', '2026-12-31')[1].tarih, '2027-01-01')
})
