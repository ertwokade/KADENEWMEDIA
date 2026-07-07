export default function CTAButton() {
  return (
    <div style={{
      position: 'fixed',
      bottom: '32px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 1000,
    }}>
      <button style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        background: 'rgba(255,255,255,0.06)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.25)',
        borderRadius: '999px',
        padding: '12px 22px',
        color: '#ffffff',
        fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
        fontSize: '14px',
        fontWeight: '400',
        letterSpacing: '0.02em',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        transition: 'background 0.3s, border-color 0.3s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'rgba(217,164,65,0.1)'
        e.currentTarget.style.borderColor = 'rgba(217,164,65,0.5)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'
      }}
      >
        Get in touch
        <div style={{
          width: '22px',
          height: '22px',
          borderRadius: '50%',
          border: '1px solid rgba(255,255,255,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 8L8 2M8 2H3.5M8 2V6.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </button>
    </div>
  )
}
