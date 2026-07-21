import { useSEO } from '../hooks/useSEO'
import PageTransition from '../components/PageTransition'
import { FadeIn } from '../components/Animations'
import './Legal.css'
import { BRAND } from '../config/brand'

export default function TelifHaklari() {
  useSEO({
    title: 'Telif Hakları | Kade New Media',
    description: 'Kade New Media web sitesindeki içeriklerin telif hakları, marka kullanımı, müşteri teslimatlarına ilişkin fikri mülkiyet devri ve hak ihlali bildirim süreci hakkında bilgi alın.',
    path: '/telif-haklari',
  })

  return (
    <PageTransition>
      <div className="legal-page">
        <div className="grid-bg" />
        <div className="container">
          <FadeIn>
            <div className="legal-content glass-card">
              <h1>Telif Hakları</h1>
              <p className="legal-date">Son güncelleme: Temmuz 2026</p>

              <h2>1. Site İçeriğinin Sahipliği</h2>
              <p>
                <strong>kadenewmedia.com</strong> alan adında yayınlanan tüm metin, görsel, video,
                logo, marka, tasarım, arayüz, kaynak kodu ve diğer içerikler (aksi açıkça
                belirtilmedikçe) Kade New Media'ya aittir ve 5846 sayılı Fikir ve Sanat Eserleri
                Kanunu ile ilgili diğer mevzuat kapsamında korunmaktadır. Bu içeriklerin önceden
                yazılı izin alınmaksızın kısmen veya tamamen çoğaltılması, dağıtılması, kamuya
                iletilmesi veya ticari amaçla kullanılması yasaktır.
              </p>

              <h2>2. Marka ve Logo</h2>
              <p>
                "Kade New Media", "kadeadmin", "KadeAI" ve ilişkili logo/marka unsurları Kade New
                Media'nın tescilli veya tescilsiz markalarıdır. Bu unsurların izinsiz kullanımı,
                değiştirilmesi veya taklit edilmesi yasal işlem konusu olabilir.
              </p>

              <h2>3. Müşteri Teslimatlarına İlişkin Fikri Mülkiyet</h2>
              <p>
                Bir proje veya hizmet kapsamında müşteri için özel olarak üretilen nihai
                teslimatlar (ör. tasarım dosyaları, video, içerik metni), aksi sözleşmeyle
                belirtilmedikçe, ilgili hizmet bedelinin tamamının ödenmesinin ardından
                müşteriye devredilir. Ödeme tamamlanana kadar bu teslimatlar üzerindeki fikri
                mülkiyet hakları Kade New Media'da kalır. Üretim sürecinde kullanılan şablonlar,
                iç araçlar, yöntemler ve genel know-how ise her koşulda Kade New Media'ya aittir
                ve devredilmez.
              </p>

              <h2>4. Üçüncü Taraf İçerikleri</h2>
              <p>
                Sitede zaman zaman üçüncü taraflara ait stok görseller, yazı tipleri, ikonlar
                veya kütüphaneler kullanılabilir. Bu unsurlar ilgili lisans sahiplerinin
                haklarına tabidir ve kendi lisans koşulları çerçevesinde kullanılmaktadır.
              </p>

              <h2>5. Kullanıcı ve Ziyaretçi İçerikleri</h2>
              <p>
                Referans, yorum veya teklif talebi gibi kanallardan bize ilettiğiniz içerikler
                için bize, bu içerikleri hizmetlerimizi sunmak, geliştirmek ve (isim/marka
                belirtmeksizin veya önceden onay alınarak) referans olarak paylaşmak amacıyla
                kullanma hakkı vermiş olursunuz.
              </p>

              <h2>6. Hak İhlali Bildirimi</h2>
              <p>
                İçeriklerimizin izinsiz kullanıldığını düşünüyorsanız veya sitemizde üçüncü
                taraf haklarını ihlal ettiğini düşündüğünüz bir içerik gördüyseniz, ihlal
                iddiasının konusu, kanıt niteliğindeki bağlantılar ve iletişim bilgilerinizle
                birlikte bize aşağıdaki adresten ulaşabilirsiniz. Bildirimler makul süre
                içinde incelenip yanıtlanır.
              </p>

              <h2>7. İletişim</h2>
              <p>
                Telif hakları ile ilgili sorularınız veya bildirimleriniz için:{' '}
                <a href={`mailto:${BRAND.email}`} style={{ color: 'var(--primary)' }}>
                  {BRAND.email}
                </a>
              </p>
            </div>
          </FadeIn>
        </div>
      </div>
    </PageTransition>
  )
}
