import { useEffect } from 'react'

// Ana sayfa STATİK site.html'dir (Vercel rewrite: / -> /site.html).
// SPA içinden "/" tıklandığında (logo, Anasayfa, footer) bu bileşen render olur;
// tam sayfa yükleme zorlayarak statik "hello" ana sayfasını getirir — böylece
// iki farklı ana sayfa (React vs statik) tutarsızlığı ortadan kalkar.
export default function Home() {
  useEffect(() => {
    window.location.replace('/')
  }, [])
  return <div style={{ minHeight: '100vh', background: '#fdf6e3' }} />
}
