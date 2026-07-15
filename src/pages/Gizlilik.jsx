import { useSEO } from '../hooks/useSEO'
import PageTransition from '../components/PageTransition'
import { FadeIn } from '../components/Animations'
import './Legal.css'
import { BRAND } from '../config/brand'

export default function Gizlilik() {
  useSEO({
    title: 'Gizlilik Politikası | Kade Media',
    description: 'Kade Media web sitesinde kişisel verilerin nasıl toplandığı, kullanıldığı, korunduğu ve hangi haklara sahip olduğunuz hakkında bilgi alın.',
    path: '/gizlilik',
  })

  return (
    <PageTransition>
      <div className="legal-page">
        <div className="grid-bg" />
        <div className="container">
          <FadeIn>
            <div className="legal-content glass-card">
              <h1>Gizlilik Politikası</h1>
              <p className="legal-date">Son güncelleme: Temmuz 2026</p>

              <h2>1. Genel Bilgi</h2>
              <p>
                Kade Media olarak kişisel verilerinizin güvenliğine büyük önem veriyoruz. Bu Gizlilik
                Politikası, web sitemizi (<strong>kadenewmedia.com</strong>) kullanırken hangi verilerin
                toplandığını ve bu verilerin nasıl kullanıldığını açıklamaktadır.
              </p>

              <h2>2. Toplanan Veriler</h2>
              <p>Web sitemizi ziyaret ettiğinizde veya iletişim formunu doldurduğunuzda şu veriler toplanabilir:</p>
              <ul>
                <li><strong>Kimlik bilgileri:</strong> Ad, soyad</li>
                <li><strong>İletişim bilgileri:</strong> E-posta, telefon numarası</li>
                <li><strong>Şirket bilgileri:</strong> Şirket adı, sektör</li>
                <li><strong>Teknik veriler:</strong> IP adresi, tarayıcı türü ve ziyaret bilgileri</li>
              </ul>

              <h2>3. Verilerin Kullanımı</h2>
              <p>Toplanan veriler şu amaçlarla kullanılır:</p>
              <ul>
                <li>Teklif ve bilgi taleplerinizi yanıtlamak</li>
                <li>Hizmet kalitemizi geliştirmek</li>
                <li>Yasal yükümlülükleri yerine getirmek</li>
              </ul>
              <p>Kişisel verileriniz üçüncü taraflarla satılmaz veya kiralanmaz.</p>

              <h2>4. Çerezler (Cookies)</h2>
              <p>
                Web sitemiz, deneyiminizi iyileştirmek için çerezler kullanmaktadır. Çerezlerin
                kullanımı hakkında daha fazla bilgi için{' '}
                <a href="/cerez-politikasi" style={{ color: 'var(--primary)' }}>Çerez Politikamızı</a>{' '}
                inceleyiniz.
              </p>

              <h2>5. Veri Güvenliği</h2>
              <p>
                Verileriniz, yetkisiz erişime karşı endüstri standardı güvenlik önlemleriyle
                korunmaktadır. SSL şifrelemesi ve güvenli sunucu altyapısı kullanılmaktadır.
              </p>

              <h2>6. Veri Saklama Süresi</h2>
              <p>
                Kişisel verileriniz, işleme amacının gerektirdiği süre boyunca ve yürürlükteki
                yasal saklama yükümlülükleri kapsamında saklanır. Doğrulanmış ayrıntılı saklama
                takvimi için iletişim adresimiz üzerinden bilgi talep edebilirsiniz.
              </p>

              <h2>7. Üçüncü Taraf Hizmetler</h2>
              <p>
                Web sitemiz, yalnızca analitik izni verildiğinde Google Analytics
                hizmetini kullanabilir. Bu hizmetin gizlilik
                politikaları için ilgili sağlayıcıların sitelerini inceleyiniz.
              </p>

              <h2>8. İletişim</h2>
              <p>
                Gizlilik politikamızla ilgili sorularınız için:{' '}
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
