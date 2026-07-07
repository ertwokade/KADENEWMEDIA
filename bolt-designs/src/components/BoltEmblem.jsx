import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/* ── Brushed gold material ── */
function goldMaterial({ bright = false } = {}) {
  return new THREE.MeshStandardMaterial({
    color: bright ? '#d9a53a' : '#8a651f',
    emissive: bright ? '#3a2a08' : '#180f04',
    emissiveIntensity: 0.3,
    metalness: 1,
    roughness: bright ? 0.28 : 0.42,
  })
}

/* ── One triangular facet, extruded with a beveled mitered edge ── */
function Facet({ points, bright }) {
  const shape = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(points[0][0], points[0][1])
    for (let i = 1; i < points.length; i++) s.lineTo(points[i][0], points[i][1])
    s.closePath()
    return s
  }, [points])

  const mat = useMemo(() => goldMaterial({ bright }), [bright])

  return (
    <mesh material={mat}>
      <extrudeGeometry args={[shape, { depth: 0.05, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.01, bevelSegments: 3 }]} />
    </mesh>
  )
}

/* ── Three-bladed gold pinwheel ──
   Every blade is a kite made of 2 triangles that share the exact same
   center hub vertex (0,0) and its own tip — that's what keeps the facets
   welded together instead of floating apart with visible gaps/steps. */
const HUB = [0, 0]

function PinwheelMesh() {
  return (
    <group position={[0, 0, 0.1]}>
      {/* Top spike — tip up-left, wide bright facet on the left, narrow dark sliver on the right */}
      <Facet bright points={[[-0.04, 0.85], [-0.40, 0.04], HUB]} />
      <Facet points={[[-0.04, 0.85], HUB, [0.07, -0.02]]} />

      {/* Right blade — tip right, dark facet on top, bright facet on bottom */}
      <Facet points={[[0.78, 0.22], [0.06, 0.10], HUB]} />
      <Facet bright points={[[0.78, 0.22], HUB, [0.04, -0.14]]} />

      {/* Bottom spike — tip down, dark sliver on the left, wide bright facet on the right */}
      <Facet points={[[0.02, -0.95], [-0.12, -0.05], HUB]} />
      <Facet bright points={[[0.02, -0.95], HUB, [0.16, -0.06]]} />
    </group>
  )
}

export default function BoltEmblem({ scrollY = 0 }) {
  const groupRef = useRef()

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.55
      groupRef.current.position.y = Math.sin(t * 0.35) * 0.08 - scrollY * 0.0008
    }
  })

  return (
    <group ref={groupRef} position={[0.3, 0, 0]}>
      {/* Warm key + cool fill lights for a brushed-gold specular look */}
      <pointLight color="#ffe4a0" intensity={5.5} distance={7} decay={1.5} position={[-3, 3, 3]} />
      <pointLight color="#ffb85c" intensity={4} distance={8} decay={1.5} position={[2, -1, 3]} />
      <pointLight color="#fff2cc" intensity={1.6} distance={6} decay={2} position={[0, -2, -2]} />

      <PinwheelMesh />
    </group>
  )
}
