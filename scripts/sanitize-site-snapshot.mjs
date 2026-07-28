#!/usr/bin/env node
/**
 * Kaynağı repo dışında olan public/site.html snapshot'ının vendored bundle
 * güvenlik/ ağ temizliği. Script idempotenttir ve production build öncesi
 * çalışır.
 */
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const chunk = fileURLToPath(
  new URL('../public/_next/static/chunks/1ed7a178f7acd3df.js', import.meta.url)
)
const source = await readFile(chunk, 'utf8')

// Snapshot bundle'ı tarayıcıya gömülü bir QWeather API anahtarıyla her ana
// sayfa açılışında üçüncü tarafa istek atıyordu. Anahtar zaten istemciye
// dağıtıldığı için gizli sayılamaz; ayrıca endpoint 403 dönüyor. Hava durumu
// dekoratif olduğundan çağrı tamamen kaldırılır ve bileşen boş duruma düşer.
const weatherLoader = /let ([\w$]+)=async\(\)=>\{try\{return\(await ([\w$]+)\("https:\/\/devapi\.qweather\.com\/v7\/weather\/now\?[^"]+"\)\)\.data\}catch\{return\}\};/g
const sanitized = source.replace(weatherLoader, 'let $1=async()=>void 0;')

if (/devapi\.qweather\.com|key=c6e1eaf8/i.test(sanitized)) {
  throw new Error('Snapshot QWeather çağrısı temizlenemedi; bundle biçimi değişmiş olabilir.')
}

if (sanitized !== source) {
  await writeFile(chunk, sanitized)
  console.log('site snapshot: başarısız QWeather isteği ve tarayıcıya gömülü anahtar kaldırıldı.')
} else {
  console.log('site snapshot: ağ sanitizasyonu zaten güncel.')
}
