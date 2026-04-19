import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HiOutlineCalculator, HiOutlinePaperAirplane } from 'react-icons/hi'
import { useSEO } from '../hooks/useSEO'
import { submitQuoteApi } from '../api'
import PageTransition from '../components/PageTransition'
import PageBgAnimation from '../components/PageBgAnimation'
import { FadeIn } from '../components/Animations'
import './Tools.css'

const services = ['Sosyal Medya Yönetimi', 'İçerik Üretimi', 'Reklam Yönetimi', 'Video Prodüksiyon', 'Web Sitesi', 'Danışmanlık']
const platforms = ['Instagram', 'TikTok', 'LinkedIn', 'YouTube', 'Facebook', 'Google Ads']

function estimate(form) {
  const base = 6500
  const serviceTotal = form.services.length * 3200
  const platformTotal = form.platforms.length * 1600
  const contentTotal = Number(form.contentCount || 0) * 420
  const videoTotal = Number(form.videoCount || 0) * 1800
  const adTotal = form.adManagement ? 5500 : 0
  const rush = form.timeline === 'acil' ? 1.18 : 1
  return Math.round((base + serviceTotal + platformTotal + contentTotal + videoTotal + adTotal) * rush)
}

export default function QuoteRequest() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [form, setForm] = useState({
    name: '', email: '', phone: '', company: '',
    services: ['Sosyal Medya Yönetimi'],
    platforms: ['Instagram'],
    monthlyBudget: 25000,
    contentCount: 20,
    videoCount: 4,
    adManagement: true,
    timeline: 'normal',
    notes: '',
  })

  useSEO({
    title: 'Teklif Al | Hizmete Özel Başvuru',
    description: 'Kade Media hizmetleri için kapsam seçin, tahmini bütçeyi görün ve teklif talebi gönderin.',
    path: '/teklif-al',
  })

  const estimatedPrice = useMemo(() => estimate(form), [form])

  const toggle = (key, value) => {
    setForm(prev => ({
      ...prev,
      [key]: prev[key].includes(value) ? prev[key].filter(item => item !== value) : [...prev[key], value],
    }))
  }

  const submit = async (event) => {
    event.preventDefault()
    setSending(true)
    setError('')
    try {
      await submitQuoteApi({ ...form, estimatedPrice, source: 'service-quote' })
      navigate('/tesekkur?source=quote')
    } catch (err) {
      setError(err.message || 'Teklif talebi gönderilemedi.')
    } finally {
      setSending(false)
    }
  }

  return (
    <PageTransition>
      <section className="tool-hero">
        <PageBgAnimation type="services" />
        <div className="grid-bg" />
        <div className="container">
          <FadeIn>
            <div className="section-badge"><HiOutlineCalculator size={14} /> Online Teklif</div>
            <h1 className="section-title">Hizmet kapsamını seçin, <span>teklif talebi</span> gönderin</h1>
            <p className="section-subtitle">Bu form genel iletişimden ayrıdır; seçtiğiniz hizmete göre tahmini kapsam ve bütçe bilgisiyle CRM'e düşer.</p>
          </FadeIn>
        </div>
      </section>

      <section className="section">
        <div className="container tool-layout">
          <form className="tool-card glass-card tool-form" onSubmit={submit}>
            <div className="tool-grid">
              <label>Ad Soyad *<input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></label>
              <label>E-posta *<input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required /></label>
              <label>Telefon<input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></label>
              <label>Şirket<input value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} /></label>
            </div>

            <label>Hizmetler</label>
            <div className="tool-check-grid">
              {services.map(item => (
                <label className="tool-check" key={item}>
                  <input type="checkbox" checked={form.services.includes(item)} onChange={() => toggle('services', item)} />
                  {item}
                </label>
              ))}
            </div>

            <label>Platformlar</label>
            <div className="tool-check-grid">
              {platforms.map(item => (
                <label className="tool-check" key={item}>
                  <input type="checkbox" checked={form.platforms.includes(item)} onChange={() => toggle('platforms', item)} />
                  {item}
                </label>
              ))}
            </div>

            <div className="tool-grid">
              <label>Aylık içerik adedi<input type="number" min="0" value={form.contentCount} onChange={e => setForm({ ...form, contentCount: e.target.value })} /></label>
              <label>Aylık video/Reels<input type="number" min="0" value={form.videoCount} onChange={e => setForm({ ...form, videoCount: e.target.value })} /></label>
              <label>Aylık bütçe<input type="number" min="0" value={form.monthlyBudget} onChange={e => setForm({ ...form, monthlyBudget: e.target.value })} /></label>
              <label>Teslim hızı<select value={form.timeline} onChange={e => setForm({ ...form, timeline: e.target.value })}><option value="normal">Normal</option><option value="acil">Acil</option></select></label>
            </div>

            <label className="tool-check">
              <input type="checkbox" checked={form.adManagement} onChange={e => setForm({ ...form, adManagement: e.target.checked })} />
              Reklam yönetimi dahil
            </label>

            <label>Not<textarea rows="4" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></label>
            {error && <p className="tool-error">{error}</p>}
            <button className="btn btn-primary" disabled={sending}>
              <HiOutlinePaperAirplane size={18} />
              {sending ? 'Gönderiliyor...' : 'Teklif Talebi Gönder'}
            </button>
          </form>

          <aside className="tool-summary">
            <div className="tool-card glass-card">
              <h2>Tahmini aylık bütçe</h2>
              <div className="tool-price">₺{estimatedPrice.toLocaleString('tr-TR')}</div>
              <p className="tool-muted">Net teklif; brief, hedef, reklam bütçesi ve üretim kapsamı görüşmesinden sonra hazırlanır.</p>
              <ul className="tool-list">
                <li>{form.services.length} hizmet seçildi</li>
                <li>{form.platforms.length} platform seçildi</li>
                <li>{form.contentCount || 0} içerik, {form.videoCount || 0} video/Reels</li>
              </ul>
            </div>
          </aside>
        </div>
      </section>
    </PageTransition>
  )
}
