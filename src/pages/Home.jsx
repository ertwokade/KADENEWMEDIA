import { useEffect } from 'react'

// Ana sayfa, eski editoryal tasarımı koruyan statik site.html dosyasıdır.
// SPA içinden "/" rotasına dönüldüğünde tam sayfa yüklemesi yaparak Vercel
// rewrite'ının aynı arayüzü sunmasını sağlarız.
export default function Home() {
  useEffect(() => {
    window.location.replace('/')
  }, [])

  return <div style={{ minHeight: '100vh', background: '#fdf6e3' }} />
}
