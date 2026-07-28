import { useEffect, useRef } from 'react'

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

function isVisible(el) {
  const rect = el.getBoundingClientRect()
  return rect.width > 0 && rect.height > 0
}

/**
 * Modal/dialog davranışı — WCAG 2.1 AA gereksinimleri.
 *
 * Admin panelindeki dokuz modalın hiçbirinde bunlar yoktu:
 *   • Escape ile kapatma (klavye kullanıcısı modalda kilitli kalıyordu)
 *   • odak tuzağı (Tab modal dışına, arkadaki sayfaya çıkıyordu)
 *   • açılışta odağın modala taşınması, kapanışta çağırana dönmesi
 *   • arka planın kaydırılmasının engellenmesi
 *
 * Dokuz modal dokuz ayrı bileşende, farklı state ve kapatma fonksiyonlarıyla
 * tanımlı. Her birini ayrı ayrı sarmalamak yerine bu hook, admin kökünde BİR
 * KEZ çağrılır ve DOM'da açık olan modalı yönetir. Kapatma isteği modalın
 * kendi `.admin-modal-close` düğmesine iletilir — böylece her modal kendi
 * temizleme mantığını (form sıfırlama vb.) çalıştırmaya devam eder.
 *
 * YENİ MODALLAR için tercih edilen yol `useDialogRef()`'tir; aşağıdaki
 * genel davranış mevcut ekranları kapsamak içindir.
 *
 * @param {string} overlaySelector Açık modalın dış katman seçicisi
 * @param {string} boxSelector     Odak tuzağının uygulanacağı kutu
 * @param {string} closeSelector   Escape'in tetikleyeceği kapatma düğmesi
 */
export function useDialogBehavior({
  overlaySelector = '.admin-modal-overlay',
  boxSelector = '.admin-modal',
  closeSelector = '.admin-modal-close',
} = {}) {
  useEffect(() => {
    const openBox = () => {
      const overlay = document.querySelector(overlaySelector)
      if (!overlay) return null
      return overlay.querySelector(boxSelector) || overlay
    }

    const onKeyDown = (event) => {
      const box = openBox()
      if (!box) return

      if (event.key === 'Escape') {
        const closeButton = box.querySelector(closeSelector)
        // Kapatma düğmesi yoksa dış katmana tıklama (mevcut kapatma yolu)
        // taklit edilir.
        if (closeButton) closeButton.click()
        else document.querySelector(overlaySelector)?.click()
        return
      }

      if (event.key !== 'Tab') return

      const items = [...box.querySelectorAll(FOCUSABLE)].filter(isVisible)
      if (items.length === 0) {
        event.preventDefault()
        return
      }

      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement

      if (event.shiftKey && (active === first || !box.contains(active))) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && (active === last || !box.contains(active))) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown, true)
    return () => document.removeEventListener('keydown', onKeyDown, true)
  }, [overlaySelector, boxSelector, closeSelector])

  // Modal açıldığında odağı içine taşı, kapandığında geri ver.
  // MutationObserver kullanılır çünkü modallar farklı bileşenlerde,
  // merkezi bir "açık" state'i yok.
  useEffect(() => {
    let lastFocused = null

    const observer = new MutationObserver(() => {
      const overlay = document.querySelector(overlaySelector)

      if (overlay && !lastFocused) {
        lastFocused = document.activeElement
        document.body.style.overflow = 'hidden'
        const box = overlay.querySelector(boxSelector) || overlay
        const focusable = [...box.querySelectorAll(FOCUSABLE)].filter(isVisible)[0]
        if (focusable) focusable.focus()
        else {
          box.setAttribute('tabindex', '-1')
          box.focus()
        }
        return
      }

      if (!overlay && lastFocused) {
        document.body.style.overflow = ''
        if (typeof lastFocused.focus === 'function' && document.contains(lastFocused)) {
          lastFocused.focus()
        }
        lastFocused = null
      }
    })

    observer.observe(document.body, { childList: true, subtree: true })
    return () => {
      observer.disconnect()
      document.body.style.overflow = ''
    }
  }, [overlaySelector, boxSelector])
}

/**
 * Tek bir modal için bileşen içi kullanım — yeni modallarda tercih edin.
 * Kutuya `ref` verin ve `role="dialog" aria-modal="true"` ekleyin.
 */
export function useDialogRef(open, onClose) {
  const dialogRef = useRef(null)
  const previouslyFocused = useRef(null)
  const onCloseRef = useRef(onClose)

  // Ref render sırasında güncellenemez; senkron tutmak için ayrı bir effect.
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open) return

    previouslyFocused.current = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const raf = requestAnimationFrame(() => {
      const box = dialogRef.current
      if (!box) return
      const focusable = [...box.querySelectorAll(FOCUSABLE)].filter(isVisible)[0]
      if (focusable) focusable.focus()
      else {
        box.setAttribute('tabindex', '-1')
        box.focus()
      }
    })

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onCloseRef.current?.()
        return
      }
      if (event.key !== 'Tab') return

      const box = dialogRef.current
      if (!box) return
      const items = [...box.querySelectorAll(FOCUSABLE)].filter(isVisible)
      if (items.length === 0) return event.preventDefault()

      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement

      if (event.shiftKey && (active === first || !box.contains(active))) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && (active === last || !box.contains(active))) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown, true)

    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('keydown', onKeyDown, true)
      document.body.style.overflow = previousOverflow
      const target = previouslyFocused.current
      if (target && typeof target.focus === 'function' && document.contains(target)) {
        target.focus()
      }
    }
  }, [open])

  return dialogRef
}

export default useDialogBehavior
