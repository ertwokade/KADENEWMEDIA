/**
 * Altyazi zaman kutusu (cue) araclari.
 *
 * Whisper kelime zaman damgalarindan okunabilir altyazi kutulari uretir ve
 * SRT / VTT bicimlerine cevirir. Saf fonksiyonlardir: hem tarayicida (editor)
 * hem sunucuda (YouTube'a yukleme) ayni sonucu verir.
 */

export interface TranscriptWord {
  word: string
  start: number
  end: number
}

export interface Cue {
  index: number
  start: number
  end: number
  text: string
}

export interface CueOptions {
  /** Bir kutuda gosterilecek en fazla karakter (2 satir toplami). */
  maxChars?: number
  /** Bir kutunun en uzun suresi (saniye). */
  maxDuration?: number
  /** Bu suredem uzun sessizlik yeni kutu baslatir (saniye). */
  gapThreshold?: number
}

const DEFAULTS: Required<CueOptions> = { maxChars: 84, maxDuration: 6, gapThreshold: 0.7 }

/** Cumle sonu isaretleri: kutuyu burada bitirmek okumayi kolaylastirir. */
const SENTENCE_END = /[.!?…]$/
const CLAUSE_END = /[,;:]$/

/**
 * Kelimeleri altyazi kutularina boler.
 * Kirilma onceligi: cumle sonu > uzun sessizlik > virgul > karakter/sure siniri.
 */
export function wordsToCues(words: TranscriptWord[], options: CueOptions = {}): Cue[] {
  const opts = { ...DEFAULTS, ...options }
  const clean = words
    .filter((w) => typeof w.start === 'number' && typeof w.end === 'number' && String(w.word ?? '').trim())
    .map((w) => ({ ...w, word: String(w.word).trim() }))
  if (!clean.length) return []

  const cues: Cue[] = []
  let current: TranscriptWord[] = []

  const flush = () => {
    if (!current.length) return
    const text = current.map((w) => w.word).join(' ').replace(/\s+([,.!?;:])/g, '$1')
    cues.push({
      index: cues.length + 1,
      start: current[0].start,
      end: current[current.length - 1].end,
      text,
    })
    current = []
  }

  for (let i = 0; i < clean.length; i++) {
    const word = clean[i]
    const prev = current[current.length - 1]
    const gap = prev ? word.start - prev.end : 0
    const pendingChars = current.reduce((sum, w) => sum + w.word.length + 1, 0)
    const pendingDuration = current.length ? word.end - current[0].start : 0

    // Sinirlar asilmadan once mevcut kutuyu kapat
    if (
      current.length &&
      (gap >= opts.gapThreshold ||
        pendingChars + word.word.length > opts.maxChars ||
        pendingDuration > opts.maxDuration)
    ) {
      flush()
    }

    current.push(word)

    // Cumle bitti ve kutu yeterince doluysa kapat
    if (SENTENCE_END.test(word.word) && current.length >= 2) flush()
    else if (CLAUSE_END.test(word.word) && current.reduce((s, w) => s + w.word.length + 1, 0) > opts.maxChars * 0.65) flush()
  }
  flush()

  return renumber(cues)
}

/** Kutu metnini en fazla iki satira boler (uzun satir okunmuyor). */
export function wrapCueText(text: string, maxLineLength = 42): string {
  const words = text.split(/\s+/).filter(Boolean)
  if (!words.length) return ''
  if (text.length <= maxLineLength) return text

  const lines: string[] = []
  let line = ''
  for (const word of words) {
    if (!line) line = word
    else if (`${line} ${word}`.length <= maxLineLength) line = `${line} ${word}`
    else {
      lines.push(line)
      line = word
    }
  }
  if (line) lines.push(line)
  // Ikiden fazla satir olusursa son satirlari birlestir: 3 satirlik altyazi ekrani kapatir.
  if (lines.length > 2) return [lines[0], lines.slice(1).join(' ')].join('\n')
  return lines.join('\n')
}

function pad(n: number, size = 2) {
  return String(Math.floor(n)).padStart(size, '0')
}

export function formatTimestamp(seconds: number, style: 'srt' | 'vtt' = 'srt') {
  const safe = Math.max(0, seconds)
  const h = Math.floor(safe / 3600)
  const m = Math.floor((safe % 3600) / 60)
  const s = Math.floor(safe % 60)
  const ms = Math.round((safe - Math.floor(safe)) * 1000)
  const sep = style === 'srt' ? ',' : '.'
  return `${pad(h)}:${pad(m)}:${pad(s)}${sep}${pad(ms, 3)}`
}

export function parseTimestamp(value: string): number {
  const m = value.trim().match(/^(\d{1,2}):(\d{2}):(\d{2})[.,](\d{1,3})$/)
  if (!m) return 0
  return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) + Number(m[4].padEnd(3, '0')) / 1000
}

export function cuesToSrt(cues: Cue[], lineWrap = true): string {
  return cues
    .map((cue, i) => {
      const text = lineWrap ? wrapCueText(cue.text) : cue.text
      return `${i + 1}\n${formatTimestamp(cue.start, 'srt')} --> ${formatTimestamp(cue.end, 'srt')}\n${text}\n`
    })
    .join('\n')
}

export function cuesToVtt(cues: Cue[], lineWrap = true): string {
  const body = cues
    .map((cue) => {
      const text = lineWrap ? wrapCueText(cue.text) : cue.text
      return `${formatTimestamp(cue.start, 'vtt')} --> ${formatTimestamp(cue.end, 'vtt')}\n${text}\n`
    })
    .join('\n')
  return `WEBVTT\n\n${body}`
}

/** SRT veya VTT metnini kutulara geri cevirir (kullanici duzenlenmis dosya yuklerse). */
export function parseSubtitles(input: string): Cue[] {
  const text = input.replace(/\r/g, '').replace(/^WEBVTT.*\n+/, '')
  const blocks = text.split(/\n{2,}/)
  const cues: Cue[] = []

  for (const block of blocks) {
    const lines = block.split('\n').filter((l) => l.trim())
    if (!lines.length) continue
    const timeLineIndex = lines.findIndex((l) => l.includes('-->'))
    if (timeLineIndex === -1) continue
    const [startRaw, endRaw] = lines[timeLineIndex].split('-->')
    const body = lines.slice(timeLineIndex + 1).join('\n').trim()
    if (!body) continue
    cues.push({
      index: cues.length + 1,
      start: parseTimestamp(startRaw),
      end: parseTimestamp(endRaw.split(' ')[0] ?? endRaw),
      text: body,
    })
  }
  return renumber(cues)
}

/** Tum kutulari sabit bir sure kaydirir (ses/goruntu senkron kaymasi icin). */
export function shiftCues(cues: Cue[], seconds: number): Cue[] {
  return cues.map((cue) => ({
    ...cue,
    start: Math.max(0, cue.start + seconds),
    end: Math.max(0, cue.end + seconds),
  }))
}

export function renumber(cues: Cue[]): Cue[] {
  return cues
    .slice()
    .sort((a, b) => a.start - b.start)
    .map((cue, i) => ({ ...cue, index: i + 1 }))
}

/** Okuma hizi (karakter/saniye). 17-20 ustu izleyicinin yetisemedigi bolgedir. */
export function charsPerSecond(cue: Cue): number {
  const duration = Math.max(cue.end - cue.start, 0.1)
  return cue.text.replace(/\s/g, '').length / duration
}

export interface CueWarning {
  index: number
  type: 'hizli' | 'kisa' | 'uzun' | 'cakisma'
  message: string
}

/** Altyazi kalite denetimi: cok hizli, cok kisa/uzun veya cakisan kutular. */
export function inspectCues(cues: Cue[]): CueWarning[] {
  const warnings: CueWarning[] = []
  cues.forEach((cue, i) => {
    const duration = cue.end - cue.start
    if (charsPerSecond(cue) > 20) {
      warnings.push({ index: cue.index, type: 'hizli', message: 'Okuma hızı yüksek — metni kısalt veya süreyi uzat.' })
    }
    if (duration < 0.7) {
      warnings.push({ index: cue.index, type: 'kisa', message: 'Çok kısa (0,7 sn altı) — ekranda okunmaz.' })
    }
    if (duration > 7) {
      warnings.push({ index: cue.index, type: 'uzun', message: 'Çok uzun (7 sn üstü) — ikiye bölmek daha iyi.' })
    }
    const next = cues[i + 1]
    if (next && next.start < cue.end - 0.001) {
      warnings.push({ index: cue.index, type: 'cakisma', message: 'Sonraki kutuyla zaman çakışması var.' })
    }
  })
  return warnings
}

export function totalDuration(cues: Cue[]): number {
  return cues.length ? Math.max(...cues.map((c) => c.end)) : 0
}
