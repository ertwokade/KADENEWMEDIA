import { lazy } from 'react'

const RELOAD_FLAG = 'kade-chunk-reload'

function readFlag() {
  try {
    return window.sessionStorage.getItem(RELOAD_FLAG) === '1'
  } catch {
    // Özel sekmede storage kapalı olabilir; o zaman yenileme korumasız kalır
    // ama tek denemeyle sınırlı olduğu için döngü oluşmaz.
    return false
  }
}

function writeFlag(value) {
  try {
    if (value) window.sessionStorage.setItem(RELOAD_FLAG, '1')
    else window.sessionStorage.removeItem(RELOAD_FLAG)
  } catch {
    // yok sayılır
  }
}

/**
 * `React.lazy` + eski chunk kurtarması.
 *
 * SORUN: Derleme her seferinde chunk dosyalarına yeni bir hash veriyor
 * (`LoginHub-CXlBHvs0.js`). Dağıtım anında sekmesi açık olan ziyaretçi bir
 * rotaya geçtiğinde tarayıcı ESKİ adı istiyor ve 404 alıyor. Dinamik import
 * reddediliyor, ama React o ağaçta yeniden render etmediği için hata hiçbir
 * yere ulaşmıyor: Suspense fallback'i — yani dönen çark — sonsuza kadar
 * ekranda kalıyor. Kullanıcı için sayfa "donmuş" görünüyor.
 *
 * Aynı durum geliştirmede de oluşuyor: vite yeniden başladığında modül
 * adresleri değişiyor, açık sekme eski adresi istiyor.
 *
 * ÇÖZÜM: bir kez daha dene (geçici ağ hatası olabilir), hâlâ gelmiyorsa
 * dosya gerçekten yok demektir — sayfayı BİR KEZ yenile. Yenileme yeni
 * index.html'i, o da yeni chunk adlarını getirir. Bayrak sessionStorage'da
 * tutulur ki yenileme de çözmezse döngüye girilmesin; ikinci başarısızlıkta
 * hata fırlatılır ve ErrorBoundary devralır.
 */
export function lazyWithRetry(importer) {
  return lazy(async () => {
    try {
      const module = await importer()
      writeFlag(false)
      return module
    } catch (error) {
      try {
        return await importer()
      } catch {
        if (readFlag()) throw error

        writeFlag(true)
        window.location.reload()

        // Yenileme başlayana kadar askıda kal. Burada hata fırlatmak,
        // sayfa değişmeden önce ErrorBoundary'yi bir kare gösterirdi.
        return new Promise(() => {})
      }
    }
  })
}
