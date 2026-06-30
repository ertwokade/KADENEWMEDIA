import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/* ── Chrome ring shader ── */
const ringVert = `
varying vec3 vNormal; varying vec3 vViewDir; varying vec2 vUv;
void main(){
  vNormal  = normalize(normalMatrix * normal);
  vec4 mvp = modelViewMatrix * vec4(position,1.);
  vViewDir = normalize(-mvp.xyz);
  vUv      = uv;
  gl_Position = projectionMatrix * mvp;
}`
const ringFrag = `
varying vec3 vNormal; varying vec3 vViewDir; varying vec2 vUv;
uniform float uTime;
void main(){
  vec3 N = normalize(vNormal), V = normalize(vViewDir);
  vec3 L1 = normalize(vec3(2., 3., 4.));
  vec3 L2 = normalize(vec3(-2., 1., 3.));
  float d1 = max(dot(N,L1), 0.);
  float d2 = max(dot(N,L2), 0.);
  vec3 H1  = normalize(L1+V);
  float sp = pow(max(dot(N,H1), 0.), 180.);
  float fr = pow(1. - max(dot(N,V), 0.), 1.8);
  float band = sin(vUv.y * 22.0 + uTime * 1.2) * .5 + .5;
  vec3 chrome = mix(vec3(.04,.12,.28), vec3(.0,.45,.72), band);
  vec3 col = chrome * (d1*.9 + d2*.15);
  col += vec3(.9,1.,1.) * sp * 3.0;
  col += vec3(0.,.6,.9) * fr * 0.8;
  gl_FragColor = vec4(col, 1.);
}`

/* ── Lightning bolt — 2 angular triangle pieces (matching reference) ── */
function BoltMesh() {
  const topShape = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo( 0.00,  0.42)
    s.lineTo(-0.16,  0.02)
    s.lineTo( 0.06,  0.02)
    s.closePath()
    return s
  }, [])

  const botShape = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(-0.06, -0.02)
    s.lineTo( 0.16, -0.02)
    s.lineTo( 0.00, -0.42)
    s.closePath()
    return s
  }, [])

  const mat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#0a2035',
    emissive: '#0d3a60',
    emissiveIntensity: 0.5,
    metalness: 0.95,
    roughness: 0.1,
  }), [])

  return (
    <group position={[0, 0, 0.12]}>
      <mesh material={mat}>
        <extrudeGeometry args={[topShape, { depth: 0.07, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.01, bevelSegments: 4 }]} />
      </mesh>
      <mesh material={mat}>
        <extrudeGeometry args={[botShape, { depth: 0.07, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.01, bevelSegments: 4 }]} />
      </mesh>
    </group>
  )
}

export default function BoltEmblem({ scrollY = 0 }) {
  const groupRef  = useRef()
  const outerRing = useRef()
  const innerRing = useRef()
  const ringUni   = useMemo(() => ({ uTime: { value: 0 } }), [])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    ringUni.uTime.value = t

    if (groupRef.current) {
      /* Full Y-axis spin (matches reference — ring shows edge-on sometimes) */
      groupRef.current.rotation.y = t * 0.55
      /* Gentle bob + scroll parallax */
      groupRef.current.position.y = Math.sin(t * 0.35) * 0.08 - scrollY * 0.0008
    }
    if (outerRing.current) outerRing.current.rotation.z =  t * 0.18
    if (innerRing.current) innerRing.current.rotation.z = -t * 0.28
  })

  return (
    /* Centered slightly right, matching reference layout */
    <group ref={groupRef} position={[0.3, 0, 0]}>

      {/* ── Point lights to illuminate the emblem ── */}
      <pointLight color="#00ccff" intensity={10} distance={7} decay={1.5} position={[-3, 2, 3]} />
      <pointLight color="#0066aa" intensity={6}  distance={8} decay={1.5} position={[ 2,-1, 3]} />
      <pointLight color="#00ff88" intensity={4}  distance={6} decay={2}   position={[ 0, 3, 2]} />

      {/* ── Dark backing disc ── */}
      <mesh position={[0, 0, 0.04]}>
        <circleGeometry args={[0.62, 128]} />
        <meshStandardMaterial color="#010a18" emissive="#020d22" emissiveIntensity={0.4} metalness={0.1} roughness={0.9} />
      </mesh>

      {/* ── Main chrome torus ring ── */}
      <mesh>
        <torusGeometry args={[0.72, 0.068, 48, 160]} />
        <shaderMaterial vertexShader={ringVert} fragmentShader={ringFrag} uniforms={ringUni} />
      </mesh>

      {/* ── Outer thin accent ring (slow spin) ── */}
      <mesh ref={outerRing}>
        <torusGeometry args={[0.86, 0.008, 6, 80]} />
        <meshStandardMaterial color="#00ccff" emissive="#00aadd" emissiveIntensity={3} transparent opacity={0.55} />
      </mesh>

      {/* ── Inner thin accent ring (counter spin) ── */}
      <mesh ref={innerRing}>
        <torusGeometry args={[0.58, 0.006, 6, 60]} />
        <meshStandardMaterial color="#0088bb" emissive="#006688" emissiveIntensity={2.5} transparent opacity={0.45} />
      </mesh>

      {/* ── Lightning bolt ── */}
      <BoltMesh />
    </group>
  )
}
