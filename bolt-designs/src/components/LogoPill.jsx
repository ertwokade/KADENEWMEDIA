export default function LogoPill() {
  return (
    <div style={{
      position: 'fixed',
      top: '24px',
      left: '24px',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      background: '#ffffff',
      borderRadius: '999px',
      padding: '6px 16px 6px 8px',
      width: '148px',
      boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
      userSelect: 'none',
    }}>
      {/* Lightning icon circle */}
      <div style={{
        width: '24px',
        height: '24px',
        borderRadius: '50%',
        background: '#0a0a0a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <svg width="12" height="14" viewBox="0 0 12 14" fill="none">
          <path
            d="M7 1L2 8H6L5 13L10 6H6L7 1Z"
            fill="white"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <span style={{
        fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
        fontSize: '12px',
        fontWeight: '500',
        color: '#0a0a0a',
        letterSpacing: '-0.01em',
        whiteSpace: 'nowrap',
      }}>
        Bolt — Designs
      </span>
    </div>
  )
}
