import { NavLink } from 'react-router-dom'
import {
  HiOutlineChartBar, HiOutlineClipboardList, HiOutlineCog, HiOutlineDocumentText,
  HiOutlineLightBulb, HiOutlineSparkles, HiOutlineUsers,
} from 'react-icons/hi'
import { useCustomer } from '../contexts/CustomerContext'
import '../pages/OrganizationKit.css'

const organizationKitItems = [
  { label: 'Organizasyon Paneli', path: '/organizasyon-kiti', icon: HiOutlineChartBar },
  { label: 'Medya Yol Haritası', path: '/organizasyon-kiti/medya-yol-haritasi', icon: HiOutlineClipboardList },
  { label: 'Yönetim Toplantıları', path: '/organizasyon-kiti/yonetim-toplantilari', icon: HiOutlineUsers },
  { label: 'Ekip ve Süreçler', path: '/organizasyon-kiti/ekip-surecler', icon: HiOutlineCog },
  { label: 'Stratejik Kararlar', path: '/organizasyon-kiti/stratejik-kararlar', icon: HiOutlineLightBulb },
  { label: 'Danışmanlık Notları', path: '/organizasyon-kiti/notlar', icon: HiOutlineDocumentText },
]

export default function OrganizationKitNav() {
  const { entitlements } = useCustomer()

  if (!entitlements?.hasOrganizationKitAccess && !entitlements?.hasKadeKitBusinessAccess) return null

  return (
    <aside className="ok-sidebar" aria-label="Kade Organizasyon Kiti menüsü">
      {entitlements?.hasOrganizationKitAccess && (
        <>
          <div className="ok-sidebar-head">
            <span className="ok-sidebar-kicker">DANIŞMANLIK</span>
            <div className="ok-sidebar-title-row">
              <strong>Kade Organizasyon Kiti</strong>
              <span>Aktif Plan</span>
            </div>
          </div>
          <nav className="ok-sidebar-nav">
            {organizationKitItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/organizasyon-kiti'}
                  className={({ isActive }) => `ok-sidebar-link ${isActive ? 'active' : ''}`}
                >
                  <Icon size={17} />
                  <span>{item.label}</span>
                </NavLink>
              )
            })}
          </nav>
        </>
      )}

      {entitlements?.hasKadeKitBusinessAccess && (
        <div className="ok-sidebar-business">
          <div className="ok-sidebar-head">
            <span className="ok-sidebar-kicker">ÜRETİM MERKEZİ</span>
            <div className="ok-sidebar-title-row">
              <strong>Kade Kit Business</strong>
              <span>Premium</span>
            </div>
          </div>
          <nav className="ok-sidebar-nav">
            <NavLink
              to="/kade-kit-business"
              className={({ isActive }) => `ok-sidebar-link ${isActive ? 'active' : ''}`}
            >
              <HiOutlineSparkles size={17} />
              <span>AI Üretim Merkezi</span>
            </NavLink>
          </nav>
        </div>
      )}
    </aside>
  )
}
