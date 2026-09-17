// 30 günlük planın yayın günleri modelden değil buradan hesaplanır:
// hafta sekmeleri ve takvim aktarımı aynı gün numarasını kullanır.

export interface PlanSlot {
  /** Planın 1. gününden itibaren gün numarası (1–30). */
  gun: number
  /** YYYY-MM-DD, İstanbul takvim günü. */
  tarih: string
  /** Kullanıcıya gösterilen tarih, ör. "16 Eylül Çarşamba". */
  etiket: string
  /** 1–5; 7 günlük bloklar. */
  hafta: number
}

const WEEKLY_OFFSETS: Record<string, number[]> = {
  'her gün': [0, 1, 2, 3, 4, 5, 6],
  'haftada 5': [0, 1, 2, 3, 4],
  'haftada 3': [0, 2, 4],
  'haftada 2': [0, 3],
  'haftada 1': [0],
}

export const PLAN_DAYS = 30

export function istanbulToday(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
}

export function addDays(isoDate: string, offset: number): string {
  const date = new Date(`${isoDate}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + offset)
  return date.toISOString().slice(0, 10)
}

export function planWeek(gun: number): number {
  return Math.min(5, Math.max(1, Math.ceil(gun / 7)))
}

function dateLabel(isoDate: string): string {
  return new Intl.DateTimeFormat('tr-TR', { timeZone: 'UTC', day: 'numeric', month: 'long', weekday: 'long' })
    .format(new Date(`${isoDate}T12:00:00Z`))
}

/** Yayın sıklığına göre 30 gün içindeki yayın günleri. */
export function planSlots(frequency: string, start: string): PlanSlot[] {
  const days: number[] = []
  if (frequency === 'iki haftada 1') {
    for (let gun = 1; gun <= PLAN_DAYS; gun += 14) days.push(gun)
  } else {
    const offsets = WEEKLY_OFFSETS[frequency] ?? WEEKLY_OFFSETS['haftada 3']
    for (let block = 0; block * 7 < PLAN_DAYS; block += 1) {
      for (const offset of offsets) {
        const gun = block * 7 + offset + 1
        if (gun <= PLAN_DAYS) days.push(gun)
      }
    }
  }
  return days.map((gun) => {
    const tarih = addDays(start, gun - 1)
    return { gun, tarih, etiket: dateLabel(tarih), hafta: planWeek(gun) }
  })
}

export interface PlanDay {
  gun: number
  tarih: string
  tarih_onerisi: string
  icerik_turu: string
  baslik: string
  format: string
  aciklama: string
  ipucu: string
}

type RawDay = Omit<PlanDay, 'gun' | 'tarih' | 'tarih_onerisi'> & { gun?: number }

/** Model gününü sırayla hesaplanan yayın günlerine oturtur; fazlası atılır. */
export function assignPlanDates(days: RawDay[], slots: PlanSlot[]): PlanDay[] {
  return slots.slice(0, days.length).map((slot, index) => {
    const { gun: _gun, ...day } = days[index]
    void _gun
    return { ...day, gun: slot.gun, tarih: slot.tarih, tarih_onerisi: slot.etiket }
  })
}
