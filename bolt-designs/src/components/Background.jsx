import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

const vert = `varying vec2 vUv;
void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`

/* ── Aurora / fluid swirl shader — domain-warped FBM (Inigo Quilez technique) ── */
const frag = `
varying vec2 vUv;
uniform float uTime;

float hash(vec2 p){
  p = fract(p * vec2(127.1, 311.7));
  p += dot(p, p + 74.39);
  return fract(p.x * p.y);
}

float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  f = f*f*(3.-2.*f);
  float a=hash(i), b=hash(i+vec2(1,0)), c=hash(i+vec2(0,1)), d=hash(i+vec2(1,1));
  return mix(mix(a,b,f.x), mix(c,d,f.x), f.y);
}

float fbm(vec2 p){
  float v=0., a=.5;
  mat2 m = mat2(1.6,1.2,-1.2,1.6);
  for(int i=0;i<6;i++){ v+=a*noise(p); p=m*p; a*=.5; }
  return v;
}

void main(){
  vec2 uv = vUv;
  float t = uTime * 0.055;

  /* ── 3-level Quilez domain warp ── */
  vec2 q = vec2(
    fbm(uv * 2.2 + vec2(t * 0.4, t * 0.2)),
    fbm(uv * 2.2 + vec2(5.2 + t*0.3, 1.3))
  );
  vec2 r = vec2(
    fbm(uv * 2.0 + 4.2*q + vec2(1.7, 9.2) + t*0.15),
    fbm(uv * 2.0 + 4.2*q + vec2(8.3, 2.8) + t*0.1)
  );
  float f = fbm(uv * 1.6 + 4.5 * r + t * 0.08);

  /* ── Base: deep warm-black ── */
  vec3 col = vec3(0.025, 0.008, 0.0);

  /* ── LEFT side: dedicated GOLD aurora (independent FBM pass) ── */
  float leftWeight = clamp(1.8 - uv.x * 2.8, 0.0, 1.0);
  /* Separate warp for gold channel */
  vec2 gq = vec2(fbm(uv*2.0 + vec2(3.0, t*0.25)), fbm(uv*2.0 + vec2(8.0, t*0.2+1.3)));
  float gf = fbm(uv*1.6 + 3.5*gq + vec2(6.2, 0.0) + t*0.07);
  /* Warm amber/gold tones — muted so wisps stay wisps, not a solid fill */
  col += vec3(0.62, 0.40, 0.03) * smoothstep(0.32, 0.62, gf) * leftWeight * 1.3;
  col += vec3(0.40, 0.24, 0.02) * smoothstep(0.24, 0.52, gf) * leftWeight * 1.0;
  col += vec3(0.78, 0.62, 0.20) * smoothstep(0.68, 0.90, gf) * leftWeight * 1.15; /* bright gold peaks */

  /* ── RIGHT side: deep copper/red-bronze aurora — hue-separated from the gold left ── */
  float rightWeight = clamp(uv.x * 2.8 - 0.55, 0.0, 1.0);
  float cyanLayer = smoothstep(0.40, 0.72, f);
  col += vec3(0.45, 0.10, 0.03)  * cyanLayer * rightWeight * 1.6;
  col += vec3(0.62, 0.18, 0.04)  * smoothstep(0.62, 0.86, f) * rightWeight * 1.6;
  /* Vertical bronze streaks on far right */
  float vStreak = exp(-pow((uv.x - 0.88)*6.0, 2.0));
  col += vec3(0.7, 0.32, 0.08) * vStreak * smoothstep(0.50, 0.75, f) * 0.9;

  /* ── CENTER blend: gold→copper meetpoint shifted right ── */
  float centerX = clamp(1.0 - abs(uv.x - 0.58) * 3.5, 0.0, 1.0);
  col += vec3(0.45, 0.26, 0.08) * smoothstep(0.50, 0.80, f) * centerX * 0.6;

  /* ── Peak highlights ── */
  col += vec3(0.85, 0.66, 0.24) * smoothstep(0.86, 0.98, gf) * leftWeight * 1.4;
  col += vec3(0.72, 0.24, 0.06) * smoothstep(0.86, 0.98, f)  * rightWeight * 1.4;

  /* ── Depth fbm layer — separated by side ── */
  float f2 = fbm(uv * 3.5 + r + t * 0.06);
  col += vec3(0.28, 0.18, 0.02) * smoothstep(0.55, 0.74, f2) * leftWeight * 0.5;
  col += vec3(0.22, 0.08, 0.01) * smoothstep(0.58, 0.80, f2) * rightWeight * 0.35;

  /* ── Contrast boost: make darks darker, brights brighter ── */
  col = pow(max(col, 0.0), vec3(0.85));

  /* ── Soft vignette ── */
  vec2 vig = uv - 0.5;
  col *= clamp(1.0 - dot(vig, vig) * 1.8, 0.0, 1.0);

  col = clamp(col, 0.0, 1.0);
  gl_FragColor = vec4(col, 1.0);
}
`

export default function Background() {
  const mesh = useRef()
  const { viewport } = useThree()
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), [])
  useFrame(s => { uniforms.uTime.value = s.clock.elapsedTime })
  return (
    <mesh ref={mesh} position={[0, 0, -8]}>
      <planeGeometry args={[viewport.width * 3, viewport.height * 3]} />
      <shaderMaterial vertexShader={vert} fragmentShader={frag} uniforms={uniforms} depthWrite={false} />
    </mesh>
  )
}
