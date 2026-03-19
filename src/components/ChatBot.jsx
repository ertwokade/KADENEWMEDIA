import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HiOutlinePaperAirplane, HiX } from 'react-icons/hi'
import { FaWhatsapp } from 'react-icons/fa'
import { useLanguage } from '../i18n/LanguageContext'
import './ChatBot.css'

const knowledgeBase = {
  tr: {
    greetings: ['merhaba', 'selam', 'hey', 'merhabalar', 'günaydın', 'iyi günler'],
    greetingResponse: 'Merhaba! 👋 Kade Media\'ya hoş geldiniz. Size nasıl yardımcı olabilirim?\n\n• Hizmetlerimiz hakkında bilgi alabilir\n• Paket fiyatlarını öğrenebilir\n• İletişim bilgilerimize ulaşabilirsiniz',
    
    services: ['hizmet', 'servis', 'ne yapıyorsunuz', 'neler sunuyorsunuz', 'hizmetleriniz'],
    servicesResponse: '🚀 Hizmetlerimiz:\n\n📱 Sosyal Medya Yönetimi\n🎨 İçerik Üretimi\n📊 Reklam Yönetimi (Meta, Google, TikTok)\n🤝 Influencer Marketing\n🎬 Video Prodüksiyon\n💡 Strateji & Danışmanlık\n\nHangi hizmet hakkında detaylı bilgi almak istersiniz?',
    
    pricing: ['fiyat', 'ücret', 'paket', 'maliyet', 'ne kadar', 'kaça'],
    pricingResponse: '💰 Paketlerimiz:\n\n🟡 Başlangıç: Sosyal medyada ilk adım\n🟠 Profesyonel: Büyümek isteyen markalar için\n🔴 Kurumsal: Dijital varlığını maksimize etmek isteyenler için\n\nDetaylı fiyat bilgisi için /paketler sayfamızı ziyaret edebilir veya WhatsApp üzerinden bize ulaşabilirsiniz.',
    
    contact: ['iletişim', 'telefon', 'mail', 'e-posta', 'adres', 'neredesiniz', 'konum'],
    contactResponse: '📞 İletişim Bilgileri:\n\n📧 hello@kademedia.com\n📱 0 506 729 34 23\n📍 Biruni Teknopark, Zeytinburnu/İstanbul\n⏰ Pzt-Cum 09:00-18:00\n\nWhatsApp üzerinden de bize hızlıca ulaşabilirsiniz!',
    
    hours: ['çalışma saatleri', 'saat', 'ne zaman', 'açık mısınız', 'kaçta'],
    hoursResponse: '⏰ Çalışma Saatlerimiz:\n\nPazartesi - Cuma: 09:00 - 18:00\nCumartesi - Pazar: Kapalı\n\nMesai saatleri dışında WhatsApp üzerinden mesaj bırakabilirsiniz, en kısa sürede dönüş yaparız!',
    
    smm: ['sosyal medya', 'instagram', 'tiktok', 'facebook', 'youtube', 'linkedin'],
    smmResponse: '📱 Sosyal Medya Yönetimi:\n\nTüm sosyal medya platformlarınızı profesyonel bir şekilde yönetiyoruz:\n\n• İçerik takvimi oluşturma\n• Topluluk yönetimi\n• Kriz yönetimi\n• Aylık raporlama\n• Platform bazlı strateji\n\nDaha fazla bilgi için iletişime geçebilirsiniz!',
    
    ads: ['reklam', 'google ads', 'meta ads', 'kampanya'],
    adsResponse: '📊 Reklam Yönetimi:\n\n• Meta (Facebook & Instagram) Ads\n• Google Ads\n• TikTok Ads\n• A/B Testleri\n• Performans Raporlama\n\nBütçenizi en verimli şekilde kullanarak hedef kitlenize ulaşmanızı sağlıyoruz.',
    
    thanks: ['teşekkür', 'sağol', 'sağ ol', 'eyvallah'],
    thanksResponse: 'Rica ederim! 😊 Başka bir sorunuz olursa her zaman buradayım. İyi günler!',
    
    defaultResponse: 'Anlıyorum! Bu konuda size daha detaylı bilgi vermek için WhatsApp üzerinden veya 0 506 729 34 23 numarasından bize ulaşabilirsiniz. Ekibimiz size yardımcı olmaktan mutluluk duyacaktır! 🙂',
    
    quickReplies: ['Hizmetler', 'Fiyatlar', 'İletişim', 'Çalışma Saatleri'],
    welcomeMessage: 'Merhaba! 👋 Ben Kade Media asistanıyım. Size hizmetlerimiz, fiyatlarımız ve daha fazlası hakkında bilgi verebilirim. Nasıl yardımcı olabilirim?',
    inputPlaceholder: 'Bir mesaj yazın...',
    whatsappCta: 'Canlı destek için WhatsApp\'tan yazın',
  },
  en: {
    greetings: ['hello', 'hi', 'hey', 'good morning', 'good afternoon'],
    greetingResponse: 'Hello! 👋 Welcome to Kade Media. How can I help you?\n\n• Learn about our services\n• Check package pricing\n• Get our contact information',
    
    services: ['service', 'what do you do', 'offer', 'services'],
    servicesResponse: '🚀 Our Services:\n\n📱 Social Media Management\n🎨 Content Production\n📊 Ad Management (Meta, Google, TikTok)\n🤝 Influencer Marketing\n🎬 Video Production\n💡 Strategy & Consulting\n\nWhich service would you like to know more about?',
    
    pricing: ['price', 'cost', 'package', 'how much', 'pricing'],
    pricingResponse: '💰 Our Packages:\n\n🟡 Starter: First steps in social media\n🟠 Professional: For brands that want to grow\n🔴 Enterprise: Maximize your digital presence\n\nFor detailed pricing, visit our /packages page or reach us via WhatsApp.',
    
    contact: ['contact', 'phone', 'email', 'address', 'where', 'location'],
    contactResponse: '📞 Contact Information:\n\n📧 hello@kademedia.com\n📱 0 506 729 34 23\n📍 Biruni Teknopark, Zeytinburnu/İstanbul\n⏰ Mon-Fri 09:00-18:00\n\nYou can also reach us quickly via WhatsApp!',
    
    hours: ['working hours', 'hours', 'when', 'open', 'schedule'],
    hoursResponse: '⏰ Working Hours:\n\nMonday - Friday: 09:00 - 18:00\nSaturday - Sunday: Closed\n\nYou can leave a message via WhatsApp outside working hours, we\'ll get back to you soon!',
    
    smm: ['social media', 'instagram', 'tiktok', 'facebook', 'youtube', 'linkedin'],
    smmResponse: '📱 Social Media Management:\n\nWe professionally manage all your social media platforms:\n\n• Content calendar creation\n• Community management\n• Crisis management\n• Monthly reporting\n• Platform-specific strategy\n\nContact us for more info!',
    
    ads: ['advertising', 'google ads', 'meta ads', 'campaign', 'ads'],
    adsResponse: '📊 Ad Management:\n\n• Meta (Facebook & Instagram) Ads\n• Google Ads\n• TikTok Ads\n• A/B Testing\n• Performance Reporting\n\nWe ensure your budget is used efficiently to reach your target audience.',
    
    thanks: ['thank', 'thanks', 'appreciate'],
    thanksResponse: 'You\'re welcome! 😊 I\'m always here if you have any other questions. Have a great day!',
    
    defaultResponse: 'I understand! For more detailed information on this topic, you can reach us via WhatsApp or at 0 506 729 34 23. Our team will be happy to help! 🙂',
    
    quickReplies: ['Services', 'Pricing', 'Contact', 'Working Hours'],
    welcomeMessage: 'Hello! 👋 I\'m the Kade Media assistant. I can help you with information about our services, pricing, and more. How can I assist you?',
    inputPlaceholder: 'Type a message...',
    whatsappCta: 'Chat on WhatsApp for live support',
  },
}

function findResponse(message, lang) {
  const kb = knowledgeBase[lang] || knowledgeBase.tr
  const lowerMsg = message.toLowerCase().trim()
  
  const categories = [
    { keywords: kb.greetings, response: kb.greetingResponse },
    { keywords: kb.services, response: kb.servicesResponse },
    { keywords: kb.pricing, response: kb.pricingResponse },
    { keywords: kb.contact, response: kb.contactResponse },
    { keywords: kb.hours, response: kb.hoursResponse },
    { keywords: kb.smm, response: kb.smmResponse },
    { keywords: kb.ads, response: kb.adsResponse },
    { keywords: kb.thanks, response: kb.thanksResponse },
  ]
  
  for (const cat of categories) {
    for (const keyword of cat.keywords) {
      if (lowerMsg.includes(keyword)) {
        return cat.response
      }
    }
  }
  
  return kb.defaultResponse
}

export default function ChatBot({ isOpen, onClose }) {
  const { lang } = useLanguage()
  const kb = knowledgeBase[lang] || knowledgeBase.tr
  const [messages, setMessages] = useState([
    { type: 'bot', text: kb.welcomeMessage, showQuickReplies: true },
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

  // Update welcome when language changes
  useEffect(() => {
    const newKb = knowledgeBase[lang] || knowledgeBase.tr
    setMessages([{ type: 'bot', text: newKb.welcomeMessage, showQuickReplies: true }])
  }, [lang])

  const sendMessage = (text) => {
    if (!text.trim()) return

    const userMsg = { type: 'user', text: text.trim() }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    setTimeout(() => {
      const response = findResponse(text, lang)
      setMessages((prev) => [...prev, { type: 'bot', text: response, showQuickReplies: true }])
      setIsTyping(false)
    }, 800 + Math.random() * 600)
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
            <div className="chatbot-avatar">K</div>
            <div className="chatbot-header-text">
              <h4>Kade Media</h4>
              <span>{lang === 'tr' ? 'Çevrimiçi' : 'Online'}</span>
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
                    {kb.quickReplies.map((reply) => (
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
            placeholder={kb.inputPlaceholder}
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
          {kb.whatsappCta}
        </a>
      </motion.div>
    </AnimatePresence>
  )
}
