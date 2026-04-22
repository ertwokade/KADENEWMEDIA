import './AuroraBackground.css'

export default function AuroraBackground({ variant = 'default' }) {
  return (
    <div className={`aurora aurora--${variant}`} aria-hidden="true">
      <div className="aurora__blob aurora__blob--1" />
      <div className="aurora__blob aurora__blob--2" />
      <div className="aurora__blob aurora__blob--3" />
      <div className="aurora__blob aurora__blob--4" />
      <div className="aurora__grid" />
    </div>
  )
}
