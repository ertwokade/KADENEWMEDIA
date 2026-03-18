import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '../i18n/LanguageContext'
import './CookieBanner.css'

const KVKK_TEXT = `
KVKK AYDINLATMA METNİ

Kade Media ("Şirket"), 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında veri sorumlusu sıfatıyla, kişisel verilerinizi aşağıda açıklanan amaçlarla, hukuka ve dürüstlük kurallarına uygun olarak işleyebilecek, kaydedebilecek, saklayabilecek, sınıflandırabilecek, güncelleyebilecek ve mevzuatın izin verdiği hallerde üçüncü kişilere açıklayabilecek / aktarabilecektir.

1. KİŞİSEL VERİLERİN İŞLENME AMACI
Kişisel verileriniz;
• Hizmet sunumu ve sözleşme süreçlerinin yürütülmesi,
• İletişim faaliyetlerinin yürütülmesi,
• Müşteri ilişkileri yönetimi,
• Pazarlama ve tanıtım faaliyetleri,
• Yasal yükümlülüklerin yerine getirilmesi,
• Şirket güvenliğinin sağlanması
amaçlarıyla işlenmektedir.

2. KİŞİSEL VERİLERİN TOPLANMA YÖNTEMİ VE HUKUKİ SEBEBİ
Kişisel verileriniz, web sitemiz üzerindeki formlar, e-posta, telefon ve sosyal medya kanalları aracılığıyla otomatik veya otomatik olmayan yollarla toplanmaktadır. Bu veriler, KVKK'nın 5. maddesinde belirtilen;
• Açık rızanızın bulunması,
• Bir sözleşmenin kurulması veya ifasıyla doğrudan ilgili olması,
• Veri sorumlusunun meşru menfaati
hukuki sebeplerine dayanılarak işlenmektedir.

3. KİŞİSEL VERİLERİN AKTARILMASI
Toplanan kişisel verileriniz, yukarıda belirtilen amaçlarla iş ortaklarımıza, tedarikçilerimize, kanunen yetkili kamu kurum ve kuruluşlarına KVKK'nın 8. ve 9. maddelerinde belirtilen şartlara uygun olarak aktarılabilecektir.

4. VERİ SAHİBİNİN HAKLARI
KVKK'nın 11. maddesi uyarınca;
• Kişisel verilerinizin işlenip işlenmediğini öğrenme,
• Kişisel verileriniz işlenmişse buna ilişkin bilgi talep etme,
• Kişisel verilerin işlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme,
• Kişisel verilerinizin düzeltilmesini isteme,
• Kişisel verilerinizin silinmesini veya yok edilmesini isteme,
• İşlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme,
• Kişisel verilerinizin kanuna aykırı olarak işlenmesi sebebiyle zarara uğramanız halinde zararın giderilmesini talep etme
haklarına sahipsiniz.

5. İLETİŞİM
Haklarınızı kullanmak için hello@kademedia.com adresine e-posta gönderebilirsiniz.

Son güncelleme: Mart 2026
`

export default function CookieBanner() {
  const { t } = useLanguage()
  const [visible, setVisible] = useState(false)
  const [showKVKK, setShowKVKK] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent')
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 2000)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem('cookie_consent', 'accepted')
    setVisible(false)
  }

  const handleDecline = () => {
    localStorage.setItem('cookie_consent', 'declined')
    setVisible(false)
  }

  return (
    <>
      <AnimatePresence>
        {visible && (
          <motion.div
            className="cookie-banner"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25 }}
          >
            <div className="cookie-content">
              <span className="cookie-icon">🍪</span>
              <p>{t('cookie.message')}</p>
            </div>
            <div className="cookie-actions">
              <button className="cookie-btn cookie-details" onClick={() => setShowKVKK(true)}>
                {t('cookie.details')}
              </button>
              <button className="cookie-btn cookie-decline" onClick={handleDecline}>
                {t('cookie.decline')}
              </button>
              <button className="cookie-btn cookie-accept" onClick={handleAccept}>
                {t('cookie.accept')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showKVKK && (
          <motion.div
            className="kvkk-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowKVKK(false)}
          >
            <motion.div
              className="kvkk-modal glass-card"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="kvkk-header">
                <h2>{t('kvkk.title')}</h2>
                <button className="kvkk-close" onClick={() => setShowKVKK(false)}>
                  ✕
                </button>
              </div>
              <div className="kvkk-body">
                {KVKK_TEXT.split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
              <div className="kvkk-footer">
                <button className="btn btn-primary" onClick={() => setShowKVKK(false)}>
                  {t('kvkk.close')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
