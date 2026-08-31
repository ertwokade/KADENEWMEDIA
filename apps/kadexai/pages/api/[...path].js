/* ANA SİTENİN BACKEND KÖPRÜSÜ
 * ---------------------------------------------------------------------------
 * Site tek bir Next.js dağıtımına taşındı. Ana sitenin 30 route modülü
 * (repo kökündeki `server/api/*`) Node/Express imzasıyla yazılmış:
 * `handler(req, res)` + `res.status().json()`. Next'in App Router'ı Web
 * Request/Response kullandığı için oraya doğrudan takılamazlardı; PAGES
 * Router API rotaları ise tam olarak bu imzayı kullanıyor.
 *
 * Bu yüzden modüller DEĞİŞTİRİLMEDİ; buradan olduğu gibi çağrılıyorlar.
 * Uygulamanın geri kalanı App Router'da, yalnız bu köprü Pages'ta — Next
 * ikisinin bir arada çalışmasına izin veriyor.
 *
 * basePath kaldırıldığı için bu rota gerçekten `/api/*` adresinde yayınlanır
 * (bkz. next.config.ts). KadexAI'ın kendi 73 route'u `app/kadexai/api/*`
 * altında ve `/kadexai/api/*` adresinde kalmaya devam eder.
 */
export { default } from '../../../../api/[...path].js'

export const config = {
  api: {
    /* Handler'lar `req.body` bekliyor. Shopier imzası ham baytlar üzerinden
       değil, ayrıştırılmış callback alanlarından hesaplandığı için varsayılan
       Next ayrıştırıcısı bütün JSON ve form uçları için güvenlidir. */
    bodyParser: true,
    externalResolver: true,
  },
}
