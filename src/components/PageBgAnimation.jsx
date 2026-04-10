import { useMemo } from 'react'
import './PageBgAnimation.css'

// Seeded pseudo-random — deterministic, no rerenders change positions
function sr(n) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const CONFIGS = {
  home: {
    items: ['⬡', '◈', '◉', '◎', '◆', '◇', '●', '○', '⬡', '◈', '◉', '◆'],
    count: 10,
    cls: 'bg-float',
  },
  services: {
    items: ['Instagram', 'TikTok', 'YouTube', 'LinkedIn', 'Facebook', 'Reels', 'Stories', 'Meta Ads', 'Google Ads'],
    count: 10,
    cls: 'bg-badge',
  },
  packages: {
    items: ['✦', '✧', '★', '✦', '✦', '✧', '★', '✦', '✦', '✧'],
    count: 12,
    cls: 'bg-sparkle',
  },
  contact: {
    items: ['●', '●', '●', '●', '●', '●', '●', '●', '●', '●'],
    count: 8,
    cls: 'bg-node',
  },
  blog: {
    items: ['#içerik', '#sosyal', '#dijital', '#marka', '#viral', '#strateji', '#pazarlama', '#reklam'],
    count: 10,
    cls: 'bg-text',
  },
  careers: {
    items: ['↑', '↑', '↑', '●', '◆', '↑', '●', '◆'],
    count: 10,
    cls: 'bg-rise',
  },
  partners: {
    items: ['◉', '●', '○', '◆', '◇', '◉', '●', '○'],
    count: 10,
    cls: 'bg-float',
  },
}

function AboutBg() {
  return (
    <div className="page-bg-anim page-bg-about" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="bg-pulse-ring"
          style={{
            width: `${200 + i * 200}px`,
            height: `${200 + i * 200}px`,
            '--delay': `${i * 1.5}s`,
            '--dur': '7s',
          }}
        />
      ))}
    </div>
  )
}

export default function PageBgAnimation({ type = 'home' }) {
  const cfg = CONFIGS[type] || CONFIGS.home

  const elements = useMemo(
    () =>
      type === 'about'
        ? []
        : Array.from({ length: cfg.count }, (_, i) => ({
            label: cfg.items[i % cfg.items.length],
            x: sr(i * 7.31) * 90,
            y: sr(i * 3.91) * 90,
            delay: sr(i * 5.71) * 8,
            dur: 10 + sr(i * 2.31) * 15,
            op: 0.12 + sr(i * 1.91) * 0.2,
          })),
    [type, cfg]
  )

  if (type === 'about') return <AboutBg />

  return (
    <div className="page-bg-anim" aria-hidden="true">
      {elements.map((el, i) => (
        <div
          key={i}
          className={`bg-item ${cfg.cls}`}
          style={{
            left: `${el.x}%`,
            top: `${el.y}%`,
            '--delay': `${el.delay}s`,
            '--dur': `${el.dur}s`,
            '--op': el.op,
          }}
        >
          {el.label}
        </div>
      ))}
    </div>
  )
}
