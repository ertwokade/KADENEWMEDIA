import { useRef, useMemo, Suspense, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useGLTF, MeshTransmissionMaterial, Environment, Lightformer } from '@react-three/drei'
import Background from './Background.jsx'

function useHelloGeometry() {
  const gltf = useGLTF('/model/hello.gltf')
  return useMemo(() => {
    let best = null, bestVol = 0
    gltf.scene.traverse((o) => {
      if (!o.isMesh) return
      o.geometry.computeBoundingBox()
      const b = o.geometry.boundingBox
      const v = (b.max.x - b.min.x) * (b.max.y - b.min.y) * (b.max.z - b.min.z)
      if (v > bestVol) { bestVol = v; best = o }
    })
    const geo = best.geometry.clone()
    geo.center(); geo.computeVertexNormals(); geo.computeBoundingBox()
    return geo
  }, [gltf])
}

function Glass({ pointer }) {
  const ref = useRef()
  const { viewport } = useThree()
  const geometry = useHelloGeometry()
  const scale = (viewport.width * 0.5) / 93.5
  useFrame((s) => {
    if (!ref.current) return
    const scroll = window.__kscroll || 0
    ref.current.rotation.y = Math.sin(s.clock.elapsedTime * 0.22) * 0.15 + pointer.current.x * 0.2 + scroll * 1.0
    ref.current.rotation.x = Math.cos(s.clock.elapsedTime * 0.18) * 0.05 - pointer.current.y * 0.14
    ref.current.position.y = scroll * 1.4
  })
  return (
    <mesh ref={ref} geometry={geometry} scale={scale}>
      <MeshTransmissionMaterial
        transmission={1} thickness={3.2} roughness={0.03} ior={1.34} chromaticAberration={0.4}
        anisotropicBlur={0.04} distortion={0.2} distortionScale={0.35} temporalDistortion={0.1}
        backside backsideThickness={1.0} samples={6} resolution={896}
        color="#ffffff" attenuationColor="#f79a1e" attenuationDistance={0.55}
      />
    </mesh>
  )
}

export default function KadeScene({ dark = false }) {
  const pointer = useRef({ x: 0, y: 0 })
  useEffect(() => {
    const onMove = (e) => { pointer.current.x = (e.clientX / innerWidth) * 2 - 1; pointer.current.y = -((e.clientY / innerHeight) * 2 - 1) }
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [])
  return (
    <Canvas className="kade-canvas" style={{ position: 'fixed', inset: 0, zIndex: 0 }} camera={{ position: [0, 0, 6], fov: 45 }} dpr={[1, 2]} gl={{ antialias: true, alpha: false }}>
      <color attach="background" args={[dark ? '#100d06' : '#fbfaf4']} />
      <ambientLight intensity={1.1} />
      <directionalLight position={[-2, 3, 4]} intensity={1.2} />
      <Background dark={dark} />
      <Environment resolution={256}>
        <Lightformer intensity={2} position={[0, 3, 4]} scale={[10, 5, 1]} color="#fff6da" />
        <Lightformer intensity={1.3} position={[-4, 1, 2]} scale={[6, 6, 1]} color="#ffd766" />
      </Environment>
      <Suspense fallback={null}><Glass pointer={pointer} /></Suspense>
    </Canvas>
  )
}
useGLTF.preload('/model/hello.gltf')
