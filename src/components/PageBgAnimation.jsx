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
    count: 16,
    cls: 'bg-float',
  },
  services: {
    items: ['Instagram', 'TikTok', 'YouTube', 'LinkedIn', 'X', 'Facebook', 'Reels', 'Stories', 'Meta Ads', 'Google Ads'],
    count: 14,
    cls: 'bg-badge',
  },
  packages: {
    items: ['✦', '✧', '★', '✦', '✦', '✧', '★', '✦', '✦', '✧'],
    count: 26,
    cls: 'bg-sparkle',
  },
  contact: {
    items: ['●', '●', '●', '●', '●', '●', '●', '●', '●', '●'],
    count: 14,
    cls: 'bg-node',
  },
  blog: {
    items: ['#içerik', '#sosyal', '#dijital', '#marka', '#viral', '#influencer', '#pazarlama', '#reklam'],
    count: 16,
    cls: 'bg-text',
  },
  careers: {
    items: ['↑', '↑', '↑', '●', '◆', '↑', '●', '◆'],
    count: 20,
    cls: 'bg-rise',
  },
  partners: {
    items: ['◉', '●', '○', '◆', '◇', '◉', '●', '○'],
    count: 14,
    cls: 'bg-float',
  },
}

function AboutBg() {
  return (
    <div className="page-bg-anim page-bg-about" aria-hidden="true">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="bg-pulse-ring"
          style={{
            width: `${160 + i * 130}px`,
            height: `${160 + i * 130}px`,
            '--delay': `${i * 1.1}s`,
            '--dur': '6s',
          }}
        />
      ))}
    </div>
  )
}

export default function PageBgAnimation({ type = 'home' }) {
  if (type === 'about') return <AboutBg />

  const cfg = CONFIGS[type] || CONFIGS.home

  const elements = useMemo(
    () =>
      Array.from({ length: cfg.count }, (_, i) => ({
        label: cfg.items[i % cfg.items.length],
        x: sr(i * 7.31) * 90,
        y: sr(i * 3.91) * 90,
        delay: sr(i * 5.71) * 8,
        dur: 10 + sr(i * 2.31) * 15,
        op: 0.12 + sr(i * 1.91) * 0.2,
      })),
    [cfg]
  )

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
