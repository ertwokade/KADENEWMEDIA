import { useState, useEffect, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import Background from './components/Background'
import BoltEmblem from './components/BoltEmblem'
import LogoPill from './components/LogoPill'
import CTAButton from './components/CTAButton'
import Hero from './components/Hero'
import Services from './components/Services'
import Manifesto from './components/Manifesto'
import Projects from './components/Projects'

function Scene({ scrollY }) {
  return (
    <>
      <ambientLight intensity={0.08} color="#001833" />
      <directionalLight position={[3, 5, 5]} intensity={0.6} color="#44aaff" />
      <Environment preset="night" />
      <Background />
      <Suspense fallback={null}>
        <BoltEmblem scrollY={scrollY} />
      </Suspense>
    </>
  )
}

export default function App() {
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const fn = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <div style={{ position: 'relative', background: '#000510', minHeight: '100vh' }}>

      {/* Fixed full-screen Three.js canvas — CSS filter for bloom glow */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        filter: 'contrast(1.15) brightness(1.22) saturate(1.4)',
      }}>
        <Canvas
          camera={{ position: [0, 0, 5], fov: 42 }}
          gl={{
            antialias: true,
            alpha: false,
            toneMapping: 4,
            toneMappingExposure: 1.8,
          }}
          dpr={[1, 2]}
        >
          <Scene scrollY={scrollY} />
        </Canvas>
      </div>

      {/* Fixed UI */}
      <LogoPill />
      <CTAButton />

      {/* Scrollable content */}
      <div style={{ position: 'relative', zIndex: 10 }}>
        <Hero />
        <Services />
        <Manifesto />
        <Projects />
      </div>
    </div>
  )
}
