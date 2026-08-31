/**
 * Altyazi ve dublaj icin desteklenen diller.
 *
 * `code` YouTube altyazi izi dil kodudur (captions.insert -> snippet.language).
 * `tts` alani false olan diller icin seslendirme kalitesi dusuk oldugundan
 * dublaj listesinde gosterilmez; altyazi cevirisi yine yapilabilir.
 */

export interface SubtitleLanguage {
  code: string
  label: string
  english: string
  tts: boolean
}

export const LANGUAGES: SubtitleLanguage[] = [
  { code: 'tr', label: 'Türkçe', english: 'Turkish', tts: true },
  { code: 'en', label: 'İngilizce', english: 'English', tts: true },
  { code: 'de', label: 'Almanca', english: 'German', tts: true },
  { code: 'fr', label: 'Fransızca', english: 'French', tts: true },
  { code: 'es', label: 'İspanyolca', english: 'Spanish', tts: true },
  { code: 'it', label: 'İtalyanca', english: 'Italian', tts: true },
  { code: 'pt', label: 'Portekizce', english: 'Portuguese', tts: true },
  { code: 'ru', label: 'Rusça', english: 'Russian', tts: true },
  { code: 'ar', label: 'Arapça', english: 'Arabic', tts: true },
  { code: 'hi', label: 'Hintçe', english: 'Hindi', tts: true },
  { code: 'ja', label: 'Japonca', english: 'Japanese', tts: true },
  { code: 'ko', label: 'Korece', english: 'Korean', tts: true },
  { code: 'zh', label: 'Çince (Basitleştirilmiş)', english: 'Simplified Chinese', tts: true },
  { code: 'id', label: 'Endonezce', english: 'Indonesian', tts: true },
  { code: 'nl', label: 'Felemenkçe', english: 'Dutch', tts: true },
  { code: 'pl', label: 'Lehçe', english: 'Polish', tts: true },
  { code: 'sv', label: 'İsveççe', english: 'Swedish', tts: true },
  { code: 'uk', label: 'Ukraynaca', english: 'Ukrainian', tts: true },
  { code: 'ro', label: 'Rumence', english: 'Romanian', tts: true },
  { code: 'el', label: 'Yunanca', english: 'Greek', tts: true },
  { code: 'he', label: 'İbranice', english: 'Hebrew', tts: false },
  { code: 'fa', label: 'Farsça', english: 'Persian', tts: false },
  { code: 'az', label: 'Azerbaycanca', english: 'Azerbaijani', tts: false },
  { code: 'sr', label: 'Sırpça', english: 'Serbian', tts: false },
  { code: 'bg', label: 'Bulgarca', english: 'Bulgarian', tts: false },
]

export function languageByCode(code: string): SubtitleLanguage | undefined {
  return LANGUAGES.find((l) => l.code === code)
}

export function languageLabel(code: string): string {
  return languageByCode(code)?.label ?? code
}

export const TTS_LANGUAGES = LANGUAGES.filter((l) => l.tts)
