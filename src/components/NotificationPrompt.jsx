import { useEffect, useState } from 'react'
import { HiOutlineBell, HiOutlineX } from 'react-icons/hi'
import { savePushSubscriptionApi } from '../api'
import './NotificationPrompt.css'

const STORAGE_KEY = 'kade_push_prompt_closed'

export default function NotificationPrompt() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!('Notification' in window)) return
    if (Notification.permission !== 'default') return
    if (localStorage.getItem(STORAGE_KEY) === 'true') return
    const timer = setTimeout(() => setVisible(true), 12000)
    return () => clearTimeout(timer)
  }, [])

  const close = () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    setVisible(false)
  }

  const enable = async () => {
    try {
      const permission = await Notification.requestPermission()
      await savePushSubscriptionApi({ permission, endpoint: '', keys: {} })
      if (permission === 'granted') {
        new Notification('Kade New Media', {
          body: 'Yeni rehberler ve ajans güncellemeleri için bildirimler aktif.',
          icon: '/favicon-192.png',
        })
      }
    } catch {
      // Browser support varies; silently keep the site flow intact.
    } finally {
      close()
    }
  }

  if (!visible) return null

  return (
    <div className="notification-prompt">
      <button className="notification-prompt-close" onClick={close} aria-label="Kapat">
        <HiOutlineX size={16} />
      </button>
      <div className="notification-prompt-icon">
        <HiOutlineBell size={20} />
      </div>
      <div>
        <strong>Güncellemeleri kaçırmayın</strong>
        <p>Yeni rehberler, webinarlar ve ajans haberleri için tarayıcı bildirimi alın.</p>
        <button className="btn btn-primary" onClick={enable}>Bildirimleri Aç</button>
      </div>
    </div>
  )
}
