import { useRef, useMemo, useState, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, MeshDistortMaterial, Sphere, Torus, Box } from '@react-three/drei'
import * as THREE from 'three'

function GlowingSphere({ position, scale, speed, color }) {
  const meshRef = useRef()
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * speed * 0.3
      meshRef.current.rotation.y = state.clock.elapsedTime * speed * 0.2
    }
  })

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <Sphere ref={meshRef} args={[1, 32, 32]} position={position} scale={scale}>
        <MeshDistortMaterial
          color={color}
          roughness={0.2}
          metalness={0.8}
          distort={0.3}
          speed={1.5}
          transparent
          opacity={0.7}
        />
      </Sphere>
    </Float>
  )
}

function FloatingTorus({ position, scale, speed }) {
  const meshRef = useRef()

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * speed
      meshRef.current.rotation.z = state.clock.elapsedTime * speed * 0.5
    }
  })

  return (
    <Float speed={1.5} rotationIntensity={1} floatIntensity={0.8}>
      <Torus ref={meshRef} args={[1, 0.3, 16, 32]} position={position} scale={scale}>
        <meshStandardMaterial
          color="#B84A24"
          roughness={0.3}
          metalness={0.9}
          emissive="#B84A24"
          emissiveIntensity={0.15}
          transparent
          opacity={0.6}
        />
      </Torus>
    </Float>
  )
}

function FloatingCube({ position, scale, speed }) {
  const meshRef = useRef()

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * speed * 0.4
      meshRef.current.rotation.y = state.clock.elapsedTime * speed * 0.6
    }
  })

  return (
    <Float speed={1.8} rotationIntensity={0.8} floatIntensity={1.2}>
      <Box ref={meshRef} args={[1, 1, 1]} position={position} scale={scale}>
        <meshStandardMaterial
          color="#B84A24"
          roughness={0.4}
          metalness={0.7}
          transparent
          opacity={0.4}
          wireframe
        />
      </Box>
    </Float>
  )
}

function Particles() {
  const count = 40
  const meshRef = useRef()

  const [particles] = useState(() => {
    const temp = []
    for (let i = 0; i < count; i++) {
      temp.push({
        position: [
          (Math.random() - 0.5) * 15,
          (Math.random() - 0.5) * 15,
          (Math.random() - 0.5) * 10,
        ],
        scale: Math.random() * 0.04 + 0.01,
      })
    }
    return temp
  })

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.02
    }
  })

  return (
    <group ref={meshRef}>
      {particles.map((particle, i) => (
        <mesh key={i} position={particle.position}>
          <sphereGeometry args={[particle.scale, 6, 6]} />
          <meshBasicMaterial color="#B84A24" transparent opacity={0.5} />
        </mesh>
      ))}
    </group>
  )
}

export default function Scene3D({ style, className }) {
  const [isVisible, setIsVisible] = useState(true)
  const containerRef = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting)
      },
      { threshold: 0, rootMargin: '100px' }
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <div ref={containerRef} style={{ position: 'absolute', inset: 0, ...style }} className={className}>
      {isVisible && (
        <Canvas
          camera={{ position: [0, 0, 8], fov: 45 }}
          style={{ background: 'transparent' }}
          gl={{ alpha: true, antialias: false, powerPreference: 'high-performance' }}
          dpr={[1, 1.5]}
          frameloop="always"
        >
          <ambientLight intensity={0.3} />
          <directionalLight position={[5, 5, 5]} intensity={0.8} color="#B84A24" />
          <pointLight position={[-5, -5, 5]} intensity={0.5} color="#B84A24" />
          
          <GlowingSphere position={[3, 1, 0]} scale={1.2} speed={0.5} color="#B84A24" />
          <GlowingSphere position={[-3.5, -1.5, -2]} scale={0.8} speed={0.7} color="#B84A24" />
          <FloatingTorus position={[-2, 2, -1]} scale={0.6} speed={0.3} />
          <FloatingTorus position={[4, -2, -3]} scale={0.4} speed={0.5} />
          <FloatingCube position={[1.5, -2, -1]} scale={0.5} speed={0.4} />
          <FloatingCube position={[-4, 0.5, -2]} scale={0.35} speed={0.6} />
          <Particles />
        </Canvas>
      )}
    </div>
  )
}
