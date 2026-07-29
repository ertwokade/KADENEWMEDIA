import { useEffect, useRef, useState } from 'react'
import { prefersReducedMotion, supportsObserver } from '../../utils/motion'

/**
 * Scroll reveal — sitenin tek giriş animasyonu temeli.
 *
 * Neden ayrı bir bileşen: proje içinde üç farklı reveal yaklaşımı vardı
 * (Framer Motion `whileInView`, `requestAnimationFrame` döngüsüyle sınıf
 * ekleme, `kade-motion.js` içinde global IntersectionObserver). Üçü farklı
 * zamanlama ve farklı başlangıç durumu kullanıyor, route değişiminde
 * temizlenmiyordu. Bu bileşen tek davranışı tanımlar.
 *
 * Güvenlik kuralları:
 *   • `prefers-reduced-motion` açıksa içerik ANINDA görünür — hiç gizlenmez.
 *   • IntersectionObserver desteklenmiyorsa içerik görünür kalır.
 *   • Bir kez göründükten sonra observer bırakılır (tekrar tetiklenmez).
 *   • Unmount'ta observer temizlenir; route değişiminde artık kalmaz.
 *   • Animasyon başarısız olsa bile içerik `opacity: 0` durumunda TAKILMAZ:
 *     görünürlük React state'iyle yönetilir, CSS'e bırakılmaz.
 *
 * @param {number} delay      Kademe gecikmesi (ms)
 * @param {string} as         Render edilecek etiket (varsayılan div)
 * @param {'up'|'fade'|'clip'} variant  Hareket biçimi
 */
export default function Reveal({
  children,
  delay = 0,
  as = 'div',
  variant = 'up',
  className = '',
  ...rest
}) {
  const Tag = as
  const ref = useRef(null)
  // Hareket kapalıysa ilk render'da görünür başla — hiçbir koşulda gizli kalmaz.
  const [visible, setVisible] = useState(() => prefersReducedMotion() || !supportsObserver())

  useEffect(() => {
    if (visible) return
    const node = ref.current
    if (!node) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          setVisible(true)
          observer.disconnect()
        }
      },
      // Öğe ekranın alt kenarına yaklaşınca başlasın; kullanıcı boş alan görmesin.
      { rootMargin: '0px 0px -10% 0px', threshold: 0.05 },
    )

    observer.observe(node)

    // Güvenlik ağı: bir nedenle observer tetiklenmezse (ör. lazy medya
    // yüzünden yanlış ölçüm) içerik gizli kalmasın.
    const failsafe = setTimeout(() => setVisible(true), 2500)

    return () => {
      observer.disconnect()
      clearTimeout(failsafe)
    }
  }, [visible])

  return (
    <Tag
      ref={ref}
      className={`kade-reveal kade-reveal--${variant}${visible ? ' is-visible' : ''}${className ? ` ${className}` : ''}`}
      style={visible && delay ? { transitionDelay: `${delay}ms` } : undefined}
      {...rest}
    >
      {children}
    </Tag>
  )
}

/**
 * Birden fazla çocuğu kademeli açar. Her çocuk kendi Reveal'ına sarılır.
 * `step` tokenla aynı varsayılanı kullanır (--stagger-step: 70ms).
 */
export function RevealGroup({ children, step = 70, max = 6, variant = 'up', ...rest }) {
  return (
    <>
      {Array.isArray(children)
        ? children.map((child, index) => (
            <Reveal key={index} delay={Math.min(index, max) * step} variant={variant} {...rest}>
              {child}
            </Reveal>
          ))
        : <Reveal variant={variant} {...rest}>{children}</Reveal>}
    </>
  )
}
