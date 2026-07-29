import * as THREE from 'three'
import { useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'

// Warm yellow caustics / light-streak backdrop (the glass refracts this).
const vertex = /* glsl */ `
  varying vec2 vUv;
  void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
`
const fragment = /* glsl */ `
  precision highp float;
  uniform float uTime; uniform vec3 uColorA; uniform vec3 uColorB; uniform vec3 uStreak;
  varying vec2 vUv;
  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
  float noise(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.0-2.0*f);
    return mix(mix(hash(i),hash(i+vec2(1,0)),u.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x), u.y); }
  void main(){
    vec2 uv = vUv;
    vec3 col = mix(uColorB, uColorA, smoothstep(0.0,1.0,uv.y));
    float d = uv.x*0.9 + uv.y*0.6; float streaks = 0.0;
    for(int i=0;i<4;i++){ float fi=float(i); float phase=uTime*(0.03+fi*0.01)+fi*1.7;
      float band=sin((d+phase)*(6.0+fi*2.0)); band=smoothstep(0.6,1.0,band); streaks+=band*(0.25-fi*0.04); }
    float n = noise(uv*6.0+uTime*0.05)*noise(uv*3.0-uTime*0.03); streaks += n*0.12;
    col = mix(col, uStreak, clamp(streaks,0.0,1.0));
    gl_FragColor = vec4(col,1.0);
  }
`
export default function Background({ dark = false }) {
  const { viewport } = useThree()
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColorA: { value: new THREE.Color('#fdf2d2') },
    uColorB: { value: new THREE.Color('#fbfaf4') },
    uStreak: { value: new THREE.Color('#ffffff') },
  }), [])
  useFrame((s) => {
    /* eslint-disable react-hooks/immutability */
    uniforms.uTime.value = s.clock.elapsedTime
    if (dark) { uniforms.uColorA.value.set('#241a06'); uniforms.uColorB.value.set('#12100a'); uniforms.uStreak.value.set('#8a6a1e') }
    else { uniforms.uColorA.value.set('#fdf2d2'); uniforms.uColorB.value.set('#fbfaf4'); uniforms.uStreak.value.set('#ffffff') }
    /* eslint-enable react-hooks/immutability */
  })
  return (
    <mesh position={[0, 0, -6]} scale={[viewport.width * 2.2, viewport.height * 2.2, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial vertexShader={vertex} fragmentShader={fragment} uniforms={uniforms} depthWrite={false} />
    </mesh>
  )
}
