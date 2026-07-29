import { Component } from 'react'

/**
 * 3B sahneyi sayfanın geri kalanından yalıtan hata sınırı.
 *
 * Neden gerekli: sahne ~1 MB'lık bir glTF indiriyor ve WebGL bağlamı açıyor.
 * Bunlardan biri başarısız olduğunda (ağ kesintisi, dosya 404, WebGL'i kapalı
 * ya da desteklemeyen tarayıcı, GPU sürücüsü) `useGLTF` hata fırlatıyor.
 * Suspense bu tür hataları yakalamaz — hata yukarı çıkıp uygulamanın kök
 * sınırına ulaşıyor ve ANA SAYFANIN TAMAMI "Bir şeyler ters gitti" ekranına
 * düşüyordu. Başlık, hizmetler, iletişim: hepsi dekoratif bir obje yüzünden.
 *
 * Ölçüldü: model isteği engellendiğinde sayfada h1 dahi kalmıyordu.
 *
 * Sahne tamamen dekoratiftir; başarısız olması sessizce göz ardı edilir ve
 * sayfa sahnesiz çalışmaya devam eder.
 */
export default class SceneBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { failed: false }
  }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error) {
    // Sessizce yut ama izini bırak; sahne kaybı kullanıcıya bildirilmez.
    if (import.meta.env?.DEV) {
      console.warn('3B sahne yüklenemedi, sayfa sahnesiz devam ediyor:', error?.message)
    }
  }

  render() {
    if (this.state.failed) return null
    return this.props.children
  }
}
