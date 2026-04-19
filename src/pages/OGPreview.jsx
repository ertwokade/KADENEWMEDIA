import { useState } from 'react'
import { HiOutlinePhotograph } from 'react-icons/hi'
import { useSEO } from '../hooks/useSEO'
import { fetchOgPreviewApi } from '../api'
import PageTransition from '../components/PageTransition'
import PageBgAnimation from '../components/PageBgAnimation'
import { FadeIn } from '../components/Animations'
import './Tools.css'

export default function OGPreview() {
  const [url, setUrl] = useState('https://kademedia.com.tr')
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useSEO({
    title: 'Open Graph Önizleme Aracı | Kade Media',
    description: 'Sayfanız sosyal medyada paylaşılınca nasıl görünecek kontrol edin.',
    path: '/og-onizleme',
  })

  const submit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      setPreview(await fetchOgPreviewApi(url))
    } catch (err) {
      setError(err.message || 'Önizleme alınamadı.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageTransition>
      <section className="tool-hero">
        <PageBgAnimation type="blog" />
        <div className="grid-bg" />
        <div className="container">
          <FadeIn>
            <div className="section-badge"><HiOutlinePhotograph size={14} /> OG Preview</div>
            <h1 className="section-title">Sosyal paylaşım <span>önizlemesini</span> kontrol edin</h1>
            <p className="section-subtitle">Open Graph başlığı, açıklaması ve görseli eksik mi hızlıca görün.</p>
          </FadeIn>
        </div>
      </section>

      <section className="section">
        <div className="container tool-layout">
          <form className="tool-card glass-card tool-form" onSubmit={submit}>
            <label>URL<input type="url" value={url} onChange={e => setUrl(e.target.value)} required /></label>
            <button className="btn btn-primary" disabled={loading}>{loading ? 'Kontrol ediliyor...' : 'Önizle'}</button>
            {error && <p className="tool-error">{error}</p>}
          </form>

          <div className="tool-card glass-card tool-preview">
            {preview ? (
              <>
                {preview.image ? <img src={preview.image} alt="" /> : <div style={{ aspectRatio: '1.91/1', display: 'grid', placeItems: 'center' }}>Görsel bulunamadı</div>}
                <div className="tool-preview-body">
                  <strong>{preview.title || 'Başlık bulunamadı'}</strong>
                  <p>{preview.description || 'Açıklama bulunamadı'}</p>
                  <span className="tool-muted">{preview.siteName || preview.url}</span>
                  <ul className="tool-list">
                    <li>HTTP durum: {preview.status}</li>
                    <li>Twitter Card: {preview.hasTwitterCard ? 'Var' : 'Yok'}</li>
                  </ul>
                </div>
              </>
            ) : (
              <div className="tool-preview-body"><p>Bir URL girip önizleme alın.</p></div>
            )}
          </div>
        </div>
      </section>
    </PageTransition>
  )
}
