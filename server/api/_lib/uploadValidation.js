const MAX_MEDIA_BYTES = 2 * 1024 * 1024

const SIGNATURES = {
  'image/jpeg': (bytes) => bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
  'image/png': (bytes) => bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  'image/webp': (bytes) => bytes.length >= 12 && bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP',
  'image/gif': (bytes) => bytes.length >= 6 && ['GIF87a', 'GIF89a'].includes(bytes.subarray(0, 6).toString('ascii')),
  'video/mp4': (bytes) => bytes.length >= 12 && bytes.subarray(4, 8).toString('ascii') === 'ftyp',
  'application/pdf': (bytes) => bytes.length >= 5 && bytes.subarray(0, 5).toString('ascii') === '%PDF-',
}

export const ALLOWED_MEDIA_MIMES = new Set(Object.keys(SIGNATURES))

export function validateMediaUpload(data, mimeType) {
  if (typeof data !== 'string' || !data || typeof mimeType !== 'string') {
    return { ok: false, status: 400, error: 'Dosya verisi veya MIME türü geçersiz' }
  }
  if (!ALLOWED_MEDIA_MIMES.has(mimeType)) {
    return { ok: false, status: 415, error: 'Desteklenmeyen dosya türü' }
  }
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(data) || data.length % 4 !== 0) {
    return { ok: false, status: 400, error: 'Dosya verisi geçerli base64 değil' }
  }

  const bytes = Buffer.from(data, 'base64')
  if (bytes.length === 0 || bytes.length > MAX_MEDIA_BYTES) {
    return { ok: false, status: 413, error: 'Dosya boyutu çok büyük (max 2MB)' }
  }
  if (!SIGNATURES[mimeType](bytes)) {
    return { ok: false, status: 415, error: 'Dosya içeriği bildirilen MIME türüyle eşleşmiyor' }
  }
  return { ok: true, bytes, sizeBytes: bytes.length }
}

export { MAX_MEDIA_BYTES }
