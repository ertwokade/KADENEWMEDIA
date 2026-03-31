import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HiOutlinePaperAirplane, HiX } from 'react-icons/hi'
import { FaWhatsapp } from 'react-icons/fa'
import { useLanguage } from '../i18n/LanguageContext'
import './ChatBot.css'

const KADE_CONTEXT = `Sen Kade Media'nın AI asistanısın. Kade Media İstanbul Biruni Teknopark'ta bulunan bir dijital pazarlama ajansıdır. 
Kurucu: Kadir Demir. Şirket 8+ yıllık deneyime sahip, 5 kişilik uzman ekip, 100+ mutlu müşteri.

HİZMETLER:
- Sosyal Medya Yönetimi (Instagram, TikTok, Facebook, YouTube, LinkedIn, X)
- İçerik Üretimi (Grafik Tasarım, Copywriting, Marka Kimliği)
- Reklam Yönetimi (Meta Ads, Google Ads, TikTok Ads)
- Influencer Marketing
- Video Prodüksiyon (Reels, TikTok, YouTube)
- Strateji & Danışmanlık
- Web Sitesi Tasarımı (Responsive, SEO, UI/UX, E-ticaret)

PAKETLER:
- Başlangıç: ₺7.500/ay (2 platform, ayda 20 içerik, temel tasarım)
- Profesyonel: Ücretsiz keşif görüşmesi ile fiyat belirlenir (4 platform, 40 içerik, reklam yönetimi)
- Kurumsal: ₺25.000/ay'dan başlayan fiyatlarla (tüm platformlar, sınırsız içerik, özel strateji danışmanı)

İLETİŞİM:
- E-posta: hello@kademedia.com
- Telefon: 0 506 729 34 23
- WhatsApp: 0 506 729 34 23
- Adres: Biruni Teknopark, Kazlıçeşme, Zeytinburnu/İstanbul
- Çalışma Saatleri: Pazartesi-Cuma 09:00-18:00

Kısa, samimi ve yardımcı cevaplar ver. Emoji kullan. Soruları siteyle ilgili bilgiler çerçevesinde cevapla, belirsiz konularda WhatsApp'a yönlendir.`

const KADE_CONTEXT_EN = `You are Kade Media's AI assistant. Kade Media is a digital marketing agency based in Biruni Teknopark, Istanbul.
Founder: Kadir Demir. 8+ years experience, 5-person expert team, 100+ happy clients.

SERVICES:
- Social Media Management (Instagram, TikTok, Facebook, YouTube, LinkedIn, X)
- Content Production (Graphic Design, Copywriting, Brand Identity)
- Ad Management (Meta Ads, Google Ads, TikTok Ads)
- Influencer Marketing
- Video Production (Reels, TikTok, YouTube)
- Strategy & Consulting
- Web Design (Responsive, SEO, UI/UX, E-commerce)

PACKAGES:
- Starter: ₺7,500/mo ($220/mo) - 2 platforms, 20 posts/month
- Professional: Price determined via free discovery call - 4 platforms, 40 posts
- Enterprise: Starting from ₺25,000/mo ($730/mo) - all platforms, unlimited content

CONTACT:
- Email: hello@kademedia.com
- Phone: +90 506 729 34 23
- WhatsApp: +90 506 729 34 23
- Address: Biruni Teknopark, Istanbul
- Hours: Mon-Fri 09:00-18:00

Give short, friendly, helpful answers. Use emojis. Answer within the scope of the site info, redirect to WhatsApp for uncertain topics.`

// Fallback keyword-based responses  
const fallbackResponses = {
  tr: {
    greetings: { keys: ['merhaba', 'selam', 'hey', 'merhabalar', 'günaydın'], response: 'Merhaba! 👋 Kade Media\'ya hoş geldiniz. Size hizmetlerimiz, fiyatlarımız veya iletişim bilgilerimiz hakkında yardımcı olabilirim. Ne hakkında bilgi almak istersiniz?' },
    services: { keys: ['hizmet', 'servis', 'ne yapıyorsunuz', 'hizmetleriniz'], response: '🚀 Hizmetlerimiz:\n\n📱 Sosyal Medya Yönetimi\n🎨 İçerik Üretimi\n📊 Reklam Yönetimi (Meta, Google, TikTok)\n🤝 Influencer Marketing\n🎬 Video Prodüksiyon\n💡 Strateji & Danışmanlık\n🌐 Web Sitesi Tasarımı\n\nDetay için sormak istediğiniz hizmeti yazabilirsiniz!' },
    pricing: { keys: ['fiyat', 'ücret', 'paket', 'maliyet', 'ne kadar', 'kaça'], response: '💰 Paketlerimiz:\n\n🟡 Başlangıç: ₺7.500/ay\n🟠 Profesyonel: Ücretsiz keşif görüşmesi\n🔴 Kurumsal: ₺25.000/ay\'dan\n\nDetaylı bilgi için /paketler sayfamızı ziyaret edebilirsiniz!' },
    contact: { keys: ['iletişim', 'telefon', 'mail', 'e-posta', 'adres', 'neredesiniz'], response: '📞 İletişim:\n\n📧 hello@kademedia.com\n📱 0 506 729 34 23\n📍 Biruni Teknopark, İstanbul\n⏰ Pzt-Cum 09:00-18:00' },
    web: { keys: ['web', 'site', 'website', 'tasarım'], response: '🌐 Web Sitesi Tasarımı:\n\n• Responsive (mobil uyumlu) tasarım\n• SEO optimizasyonu\n• UI/UX tasarım\n• E-ticaret çözümleri\n\nModern ve etkileyici web siteleri tasarlıyoruz!' },
    thanks: { keys: ['teşekkür', 'sağol', 'sağ ol'], response: 'Rica ederim! 😊 Başka sorunuz olursa yazabilirsiniz.' },
    default: 'Bu konuda size daha detaylı bilgi verebilmem için WhatsApp üzerinden (0 506 729 34 23) veya hello@kademedia.com adresinden bize ulaşabilirsiniz! 🙂',
    quickReplies: ['Hizmetler', 'Fiyatlar', 'İletişim', 'Web Tasarım'],
    welcomeMessage: 'Merhaba! 👋 Ben Kade AI, Kade Media\'nın akıllı asistanıyım. Hizmetler, fiyatlar ve her türlü sorunuz için buradayım. Nasıl yardımcı olabilirim?',
    inputPlaceholder: 'Bir mesaj yazın...',
    whatsappCta: 'Canlı destek için WhatsApp\'tan yazın',
  },
  en: {
    greetings: { keys: ['hello', 'hi', 'hey', 'good morning'], response: 'Hello! 👋 Welcome to Kade Media. I can help you with our services, pricing, or contact info. What would you like to know?' },
    services: { keys: ['service', 'what do you do', 'offer'], response: '🚀 Our Services:\n\n📱 Social Media Management\n🎨 Content Production\n📊 Ad Management\n🤝 Influencer Marketing\n🎬 Video Production\n💡 Strategy & Consulting\n🌐 Web Design\n\nAsk about any service for details!' },
    pricing: { keys: ['price', 'cost', 'package', 'how much'], response: '💰 Packages:\n\n🟡 Starter: $220/mo\n🟠 Professional: Free discovery call\n🔴 Enterprise: From $730/mo\n\nVisit /packages for details!' },
    contact: { keys: ['contact', 'phone', 'email', 'address'], response: '📞 Contact:\n\n📧 hello@kademedia.com\n📱 +90 506 729 34 23\n📍 Biruni Teknopark, Istanbul\n⏰ Mon-Fri 09:00-18:00' },
    web: { keys: ['web', 'site', 'website', 'design'], response: '🌐 Web Design:\n\n• Responsive design\n• SEO optimization\n• UI/UX design\n• E-commerce solutions\n\nWe create modern, impactful websites!' },
    thanks: { keys: ['thank', 'thanks', 'appreciate'], response: 'You\'re welcome! 😊 Feel free to ask anything else.' },
    default: 'For more detailed information, reach us via WhatsApp (+90 506 729 34 23) or hello@kademedia.com! 🙂',
    quickReplies: ['Services', 'Pricing', 'Contact', 'Web Design'],
    welcomeMessage: 'Hello! 👋 I\'m Kade AI, Kade Media\'s smart assistant. I\'m here to help with services, pricing, and any questions. How can I assist you?',
    inputPlaceholder: 'Type a message...',
    whatsappCta: 'Chat on WhatsApp for live support',
  },
}

function findFallbackResponse(message, lang) {
  const fb = fallbackResponses[lang] || fallbackResponses.tr
  const lowerMsg = message.toLowerCase().trim()

  const categories = ['greetings', 'services', 'pricing', 'contact', 'web', 'thanks']
  for (const cat of categories) {
    if (fb[cat]?.keys) {
      for (const keyword of fb[cat].keys) {
        if (lowerMsg.includes(keyword)) return fb[cat].response
      }
    }
  }

  // Additional fuzzy matching for common questions
  if (lang === 'tr') {
    if (lowerMsg.match(/kim|nedir|hakkında|kade/)) return 'Kade Media, İstanbul Biruni Teknopark\'ta bulunan bir dijital pazarlama ajansıdır. 8+ yıllık deneyimimiz ve 5 kişilik uzman ekibimizle markanızı dijital dünyada büyütüyoruz! 🚀'
    if (lowerMsg.match(/nasıl|süreç|adım/)) return 'Çalışma sürecimiz: 1️⃣ Analiz → 2️⃣ Strateji → 3️⃣ Uygulama → 4️⃣ Optimizasyon. Ücretsiz keşif görüşmesi için iletişime geçebilirsiniz! 💡'
  } else {
    if (lowerMsg.match(/who|what is|about|kade/)) return 'Kade Media is a digital marketing agency based in Biruni Teknopark, Istanbul. With 8+ years of experience and a 5-person expert team, we help grow your brand digitally! 🚀'
    if (lowerMsg.match(/how|process|step/)) return 'Our process: 1️⃣ Analysis → 2️⃣ Strategy → 3️⃣ Execution → 4️⃣ Optimization. Contact us for a free discovery call! 💡'
  }

  return fb.default
}

async function getAIResponse(message, lang, history) {
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, lang, history: history.slice(-6) }),
    })

    if (!res.ok) return findFallbackResponse(message, lang)

    const data = await res.json()
    if (data.reply) return data.reply
    return findFallbackResponse(message, lang)
  } catch {
    return findFallbackResponse(message, lang)
  }
}

export default function ChatBot({ isOpen, onClose }) {
  const { lang } = useLanguage()
  const fb = fallbackResponses[lang] || fallbackResponses.tr
  const [messages, setMessages] = useState([
    { type: 'bot', text: fb.welcomeMessage, showQuickReplies: true },
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen])

  useEffect(() => {
    const newFb = fallbackResponses[lang] || fallbackResponses.tr
    setMessages([{ type: 'bot', text: newFb.welcomeMessage, showQuickReplies: true }])
  }, [lang])

  const sendMessage = async (text) => {
    if (!text.trim()) return

    const userMsg = { type: 'user', text: text.trim() }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    try {
      const response = await getAIResponse(text, lang, [...messages, userMsg])
      setMessages((prev) => [...prev, { type: 'bot', text: response, showQuickReplies: true }])
    } catch {
      const fallback = findFallbackResponse(text, lang)
      setMessages((prev) => [...prev, { type: 'bot', text: fallback, showQuickReplies: true }])
    } finally {
      setIsTyping(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleQuickReply = (reply) => {
    sendMessage(reply)
  }

  if (!isOpen) return null

  const phoneNumber = '905067293423'
  const waMsg = encodeURIComponent(
    lang === 'tr'
      ? 'Merhaba! Kade Media web sitesinden yazıyorum. Bilgi almak istiyorum.'
      : 'Hello! I\'m contacting you from the Kade Media website. I\'d like to get information.'
  )
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${waMsg}`

  return (
    <AnimatePresence>
      <motion.div
        className="chatbot-overlay"
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ duration: 0.25 }}
      >
        <div className="chatbot-header">
          <div className="chatbot-header-info">
            <div className="chatbot-avatar">🤖</div>
            <div className="chatbot-header-text">
              <h4>Kade AI</h4>
              <span>{lang === 'tr' ? 'Akıllı Asistan' : 'Smart Assistant'}</span>
            </div>
          </div>
          <button className="chatbot-close" onClick={onClose}>
            <HiX size={18} />
          </button>
        </div>

        <div className="chatbot-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`chat-message ${msg.type}`}>
              <div className="chat-bubble">
                {msg.text.split('\n').map((line, j) => (
                  <span key={j}>
                    {line}
                    {j < msg.text.split('\n').length - 1 && <br />}
                  </span>
                ))}
                {msg.type === 'bot' && msg.showQuickReplies && i === messages.length - 1 && !isTyping && (
                  <div className="chat-quick-replies">
                    {fb.quickReplies.map((reply) => (
                      <button
                        key={reply}
                        className="quick-reply-btn"
                        onClick={() => handleQuickReply(reply)}
                      >
                        {reply}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="chat-message bot">
              <div className="chat-bubble">
                <div className="typing-indicator">
                  <span /><span /><span />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form className="chatbot-input-area" onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            className="chatbot-input"
            placeholder={fb.inputPlaceholder}
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit" className="chatbot-send" disabled={!input.trim()}>
            <HiOutlinePaperAirplane size={16} />
          </button>
        </form>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="chatbot-whatsapp-cta"
        >
          <FaWhatsapp size={16} />
          {fb.whatsappCta}
        </a>
      </motion.div>
    </AnimatePresence>
  )
}
