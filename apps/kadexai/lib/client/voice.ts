/**
 * Tarayıcıda kısa ses kaydı.
 *
 * Web Speech API bilerek kullanılmadı: Türkçe tanıma tarayıcıya göre çok
 * değişiyor, Firefox'ta hiç yok ve Chrome'da ses Google sunucularına
 * gidiyor. Burada ses kendi ucumuza gönderiliyor.
 */

export type KayitOturumu = {
  durdur: () => Promise<Blob>
  iptal: () => void
}

/** Tarayıcının desteklediği ilk biçimi seçer; hiçbiri yoksa varsayılan. */
function bicimSec(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined
  const adaylar = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4']
  return adaylar.find((t) => MediaRecorder.isTypeSupported(t))
}

export function sesKaydiDesteklenir(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.mediaDevices?.getUserMedia === 'function' &&
    typeof MediaRecorder !== 'undefined'
  )
}

export async function kayitBaslat(): Promise<KayitOturumu> {
  const akis = await navigator.mediaDevices.getUserMedia({ audio: true })
  const bicim = bicimSec()
  const kaydedici = new MediaRecorder(akis, bicim ? { mimeType: bicim } : undefined)
  const parcalar: BlobPart[] = []

  kaydedici.ondataavailable = (e) => { if (e.data.size) parcalar.push(e.data) }
  kaydedici.start()

  // Mikrofonu kapatmak şart: kapatılmazsa sekmede kayıt göstergesi kalıyor.
  const izleriKapat = () => akis.getTracks().forEach((t) => t.stop())

  return {
    durdur: () =>
      new Promise<Blob>((coz) => {
        kaydedici.onstop = () => {
          izleriKapat()
          coz(new Blob(parcalar, { type: bicim?.split(';')[0] ?? 'audio/webm' }))
        }
        kaydedici.stop()
      }),
    iptal: () => {
      try { kaydedici.stop() } catch { /* zaten durmuş olabilir */ }
      izleriKapat()
    },
  }
}
