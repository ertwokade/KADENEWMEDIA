import { useSEO } from '../hooks/useSEO'
import PageTransition from '../components/PageTransition'
import { FadeIn } from '../components/Animations'
import './Legal.css'
import { BRAND } from '../config/brand'

export default function KVKK() {
  useSEO({
    title: 'KVKK Aydınlatma Metni | Kade Media',
    description: 'Kade Media KVKK kapsamında kişisel verilerin işlenmesine ilişkin aydınlatma metni.',
    path: '/kvkk',
  })

  return (
    <PageTransition>
      <div className="legal-page">
        <div className="grid-bg" />
        <div className="container">
          <FadeIn>
            <div className="legal-content glass-card">
              <h1>KVKK Aydınlatma Metni</h1>
              <p className="legal-date">Son güncelleme: Temmuz 2026</p>

              <h2>1. Veri Sorumlusu</h2>
              <p>
                Bu aydınlatma metni, 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca
                <strong> Kade Media</strong> tarafından,
                veri sorumlusu sıfatıyla hazırlanmıştır.
              </p>

              <h2>2. İşlenen Kişisel Veriler</h2>
              <p>İletişim formunu doldurduğunuzda aşağıdaki kişisel verileriniz işlenmektedir:</p>
              <ul>
                <li>Ad ve soyad</li>
                <li>E-posta adresi</li>
                <li>Telefon numarası</li>
                <li>Şirket adı</li>
                <li>Mesaj içeriği</li>
              </ul>

              <h2>3. Kişisel Verilerin İşlenme Amaçları</h2>
              <p>Kişisel verileriniz aşağıdaki amaçlarla işlenmektedir:</p>
              <ul>
                <li>Tarafınızca gönderilen teklif ve bilgi taleplerine yanıt vermek</li>
                <li>Hizmetlerimiz hakkında bilgilendirme yapmak</li>
                <li>Müşteri ilişkileri yönetimi</li>
                <li>Yasal yükümlülüklerin yerine getirilmesi</li>
              </ul>

              <h2>4. Kişisel Verilerin Aktarılması</h2>
              <p>
                Kişisel verileriniz; iş ortaklarımız, hizmet sağlayıcılarımız ve yasal düzenlemeler
                kapsamında yetkili kurum ve kuruluşlar ile paylaşılabilir. Yurt dışına aktarım
                yapılması halinde KVKK'nın 9. maddesindeki koşullar gözetilir.
              </p>

              <h2>5. Kişisel Verilerin Toplanma Yöntemi ve Hukuki Sebebi</h2>
              <p>
                Kişisel verileriniz; web sitemizde yer alan iletişim formu aracılığıyla elektronik
                ortamda toplanmaktadır. Veri işlemenin hukuki dayanağı; KVKK m. 5/2(c) kapsamında
                bir sözleşmenin kurulması veya ifasıyla doğrudan ilgili olması ve m. 5/2(f) kapsamında
                meşru menfaat ilkesidir.
              </p>

              <h2>6. Kişisel Veri Sahibinin Hakları</h2>
              <p>KVKK'nın 11. maddesi uyarınca aşağıdaki haklara sahipsiniz:</p>
              <ul>
                <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
                <li>İşlenmişse buna ilişkin bilgi talep etme</li>
                <li>İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme</li>
                <li>Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme</li>
                <li>Eksik veya yanlış işlenmiş olması hâlinde düzeltilmesini isteme</li>
                <li>Silinmesini veya yok edilmesini isteme</li>
                <li>İşlenen verilerin otomatik sistemler vasıtasıyla analiz edilmesi suretiyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme</li>
                <li>Kanuna aykırı işlenmesi sebebiyle zarara uğraması hâlinde zararın giderilmesini talep etme</li>
              </ul>

              <h2>7. İletişim</h2>
              <p>
                Haklarınıza ilişkin taleplerinizi <strong>{BRAND.email}</strong> adresine
                e-posta göndererek iletebilirsiniz.
              </p>
            </div>
          </FadeIn>
        </div>
      </div>
    </PageTransition>
  )
}
