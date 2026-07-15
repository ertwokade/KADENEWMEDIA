import { useSEO } from '../hooks/useSEO'
import PageTransition from '../components/PageTransition'
import { FadeIn } from '../components/Animations'
import './Legal.css'
import { BRAND } from '../config/brand'

export default function CerezPolitikasi() {
  useSEO({
    title: 'Çerez Politikası | Kade Media',
    description: 'Kade Media çerez politikası. Web sitemizde kullanılan çerezler ve tercihlerinizi nasıl yönetebileceğiniz hakkında bilgi.',
    path: '/cerez-politikasi',
  })

  return (
    <PageTransition>
      <div className="legal-page">
        <div className="grid-bg" />
        <div className="container">
          <FadeIn>
            <div className="legal-content glass-card">
              <h1>Çerez Politikası</h1>
              <p className="legal-date">Son güncelleme: Temmuz 2026</p>

              <h2>1. Çerez Nedir?</h2>
              <p>
                Çerezler, web sitelerinin tarayıcınıza yerleştirdiği küçük metin dosyalarıdır.
                Tekrar ziyaretlerinizde sizi tanımak, tercihlerinizi hatırlamak ve site
                deneyiminizi iyileştirmek için kullanılırlar.
              </p>

              <h2>2. Kullandığımız Çerez Türleri</h2>

              <h3>2.1 Zorunlu Çerezler</h3>
              <p>
                Web sitesinin düzgün çalışması için gereklidir. Oturum yönetimi ve güvenlik
                işlevlerini yerine getirirler. Bu çerezler devre dışı bırakılamaz.
              </p>

              <h3>2.2 Tercih Çerezleri</h3>
              <p>
                Dil tercihi gibi ayarlarınızı hatırlamak için kullanılır. Örneğin, Türkçe/İngilizce
                dil seçiminiz bu çerezlerle kaydedilir.
              </p>

              <h3>2.3 Analitik Çerezler</h3>
              <p>
                Google Analytics gibi araçlar aracılığıyla anonim ziyaret istatistikleri
                toplanmaktadır. Bu veriler kişisel tanımlama içermez ve site performansını
                değerlendirmek için kullanılır.
              </p>

              <h2>3. Çerez Yönetimi</h2>
              <p>
                Tarayıcınızın ayarları aracılığıyla çerezleri reddedebilir veya silebilirsiniz.
                Çerezleri devre dışı bırakmanız durumunda web sitemizin bazı özellikleri
                düzgün çalışmayabilir.
              </p>
              <p>Yaygın tarayıcılarda çerez yönetimi:</p>
              <ul>
                <li><strong>Chrome:</strong> Ayarlar → Gizlilik ve güvenlik → Çerezler</li>
                <li><strong>Firefox:</strong> Seçenekler → Gizlilik ve Güvenlik</li>
                <li><strong>Safari:</strong> Tercihler → Gizlilik</li>
                <li><strong>Edge:</strong> Ayarlar → Çerezler ve site izinleri</li>
              </ul>

              <h2>4. Üçüncü Taraf Çerezler</h2>
              <p>
                Analitik izni verdiğinizde Google Analytics kullanılabilir. Bu hizmetin
                yerleştirdiği çerezler sağlayıcının kendi politikalarına tabidir.
              </p>

              <h2>5. İletişim</h2>
              <p>
                Çerez politikamızla ilgili sorularınız için:{' '}
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
