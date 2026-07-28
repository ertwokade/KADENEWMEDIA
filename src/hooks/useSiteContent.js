import { useEffect, useState } from 'react'
import { getContentApi } from '../api'
import { mergeDefined } from '../utils/mergeDefined'

/**
 * Admin panelindeki "İçerik Yönetimi" bölümlerini public sayfalara bağlar.
 *
 * Neden bir hook:
 *   Public sayfaların içeriği iki kaynaktan gelmek zorunda —
 *     1) `src/data/*` ve `src/config/brand.js`: ön-render edilmiş statik
 *        HTML'e giren, Google'ın ilk taramada gördüğü metin. SEO bunun
 *        üzerine kuruludur ve build zamanında sabittir.
 *     2) Admin paneli: yöneticinin kod değiştirmeden güncellediği işletme
 *        bilgisi (iletişim, sosyal medya, fiyat vb.).
 *
 *   Bu hook ikisini "statik taban + runtime üstyazım" olarak birleştirir:
 *   sayfa her zaman statik içerikle çizilir, admin verisi geldiğinde
 *   yalnızca DOLU alanlar üzerine yazılır. Böylece
 *     • ön-render/SEO düzeni bozulmaz (ilk boyada içerik hazırdır),
 *     • API erişilemezse sayfa boşalmaz, statik hâlinde kalır,
 *     • admin'de boş bırakılan alan statik değeri silmez.
 *
 * @param {string} section  Admin içerik bölümü (ör. 'footer', 'packages').
 * @param {object} fallback Statik taban değer.
 * @returns {{ content: object, loaded: boolean }}
 */
export function useSiteContent(section, fallback = {}) {
  const [content, setContent] = useState(fallback)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false

    getContentApi(section)
      .then((res) => {
        if (cancelled) return
        const remote = res?.data
        if (!remote || typeof remote !== 'object') return
        setContent(mergeDefined(fallback, remote))
      })
      .catch(() => {
        // Ağ/sunucu hatasında statik içerikte kalınır. Ziyaretçiye teknik
        // hata gösterilmez; bu içerik sayfanın çalışması için kritik değildir.
      })
      .finally(() => {
        if (!cancelled) setLoaded(true)
      })

    return () => { cancelled = true }
    // fallback her render'da yeni nesne olabileceğinden bağımlılığa alınmaz;
    // bölüm değişmediği sürece tek istek atılır.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section])

  return { content, loaded }
}
