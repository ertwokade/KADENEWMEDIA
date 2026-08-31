import 'server-only'

import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'

/**
 * OAuth yenileme (refresh) belirtecleri gibi uzun omurlu sirlarin sifrelenmesi.
 *
 * AES-256-GCM; cikti biçimi: [12 bayt IV][16 bayt etiket][sifreli metin].
 * Anahtar KADE_TOKEN_ENCRYPTION_KEY ortam degiskeninden gelir. Anahtar yoksa
 * sifreleme YAPILMAZ ve fonksiyonlar hata firlatir — belirteci duz metin
 * saklamaktansa ozelligin kapali kalmasi tercih edilir.
 */

const ALGO = 'aes-256-gcm'

function key(): Buffer {
  const raw = process.env.KADE_TOKEN_ENCRYPTION_KEY?.trim()
  if (!raw || raw.length < 16) {
    throw new Error('KADE_TOKEN_ENCRYPTION_KEY tanımlı değil; entegrasyon belirteçleri şifrelenemiyor.')
  }
  // Serbest uzunluktaki gizli degeri 32 baytlik anahtara indirger.
  return createHash('sha256').update(raw).digest()
}

export function hasTokenEncryptionKey() {
  const raw = process.env.KADE_TOKEN_ENCRYPTION_KEY?.trim()
  return Boolean(raw && raw.length >= 16)
}

export function encryptSecret(plain: string): Buffer {
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGO, key(), iv)
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted])
}

export function decryptSecret(payload: Buffer | Uint8Array | string): string {
  const buf =
    typeof payload === 'string'
      ? Buffer.from(payload.startsWith('\\x') ? payload.slice(2) : payload, 'hex')
      : Buffer.from(payload)
  if (buf.length < 29) throw new Error('Şifreli belirteç bozuk.')
  const iv = buf.subarray(0, 12)
  const tag = buf.subarray(12, 28)
  const data = buf.subarray(28)
  const decipher = createDecipheriv(ALGO, key(), iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8')
}
