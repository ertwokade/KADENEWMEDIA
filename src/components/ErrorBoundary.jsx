import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center',
          justifyContent: 'center', flexDirection: 'column', gap: '16px',
          background: '#0a0a0a', color: '#fff', textAlign: 'center', padding: '20px',
        }}>
          <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Bir şeyler ters gitti</h2>
          <p style={{ color: '#888', margin: 0 }}>Sayfa yüklenirken bir hata oluştu.</p>
          <button
            onClick={() => { this.setState({ hasError: false }); window.location.reload() }}
            style={{
              padding: '12px 28px', background: '#eac321', color: '#000',
              border: 'none', borderRadius: '8px', fontWeight: 600,
              cursor: 'pointer', fontSize: '1rem',
            }}
          >
            Tekrar Dene
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
