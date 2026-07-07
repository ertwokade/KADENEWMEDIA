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
import Contact from './components/Contact'

function Scene({ scrollY }) {
  return (
    <>
      <ambientLight intensity={0.12} color="#332008" />
      <directionalLight position={[3, 5, 5]} intensity={0.7} color="#ffd9a0" />
      <Environment preset="sunset" />
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
    let ticking = false
    const fn = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        setScrollY(window.scrollY)
        ticking = false
      })
    }
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <div style={{ position: 'relative', background: '#000510', minHeight: '100vh' }}>

      {/* Fixed full-screen Three.js canvas.
          Intentionally no CSS `filter` here: a `position: fixed` element with
          a CSS filter forces a separate compositor layer that some GPU/driver
          combos redraw incorrectly while scrolling (visible as duplicated/
          "ghosted" sections). The contrast/brightness boost is done via
          renderer tone mapping instead, which stays inside the WebGL context. */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
      }}>
        <Canvas
          camera={{ position: [0, 0, 5], fov: 42 }}
          gl={{
            antialias: true,
            alpha: false,
            toneMapping: 4,
            toneMappingExposure: 2.15,
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
        <Contact />
      </div>
    </div>
  )
}
