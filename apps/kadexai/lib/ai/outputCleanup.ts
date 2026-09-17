/**
 * Model metninden kullanıcıya gitmemesi gereken kalıntıları temizler.
 * Kurallar prompt'ta da var; bu katman modelin kuralı çiğnediği durumlar içindir.
 */

/** "[Web Sitesi Linki]" gibi doldurulmamış yer tutucu içeren satırları kaldırır. */
export function removeUnfilledPlaceholders(text: string) {
  return text
    .split('\n')
    .filter((line) => !/\[(?:[^\]\n]{0,40}\b(?:link|linki|bağlantı|url|adres|isim|ad|telefon|e-?posta)\b[^\]\n]{0,20})\]/i.test(line))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/**
 * Video süresi bilinmeden yazılmış "00:00 Giriş 01:15 …" bölüm listelerini kaldırır.
 * Süre veya zaman damgası kullanıcı girdisinde varsa metin olduğu gibi kalır.
 */
export function removeInventedChapters(text: string, userInput: string) {
  if (/\b\d{1,2}:\d{2}\b/.test(userInput)) return text
  return text
    .replace(/(?:^|\n)\s*(?:📌\s*)?(?:Bölümler|Zaman damgaları|Chapters|İçindekiler)\s*:?\s*(?=\n|\s*\d{1,2}:\d{2})/gi, '\n')
    .split('\n')
    .map((line) => line.replace(/(?:^|\s)\(?\d{1,2}:\d{2}(?::\d{2})?\)?\s*[-–—:]?\s*[^\d\n]{2,60}?(?=\s\(?\d{1,2}:\d{2}|$)/g, '').trimEnd())
    .filter((line, index, lines) => line.trim() || (index > 0 && lines[index - 1].trim()))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
