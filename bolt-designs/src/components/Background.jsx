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

  /* ── Base: deep space black ── */
  vec3 col = vec3(0.0, 0.008, 0.03);

  /* ── LEFT side: dedicated GREEN aurora (independent FBM pass) ── */
  float leftWeight = clamp(1.8 - uv.x * 2.8, 0.0, 1.0);
  /* Separate warp for green channel */
  vec2 gq = vec2(fbm(uv*2.0 + vec2(3.0, t*0.25)), fbm(uv*2.0 + vec2(8.0, t*0.2+1.3)));
  float gf = fbm(uv*1.6 + 3.5*gq + vec2(6.2, 0.0) + t*0.07);
  /* Pure green colors — very low blue to avoid mixing into cyan */
  col += vec3(0.0,  0.92, 0.04) * smoothstep(0.25, 0.58, gf) * leftWeight * 2.2;
  col += vec3(0.04, 0.70, 0.06) * smoothstep(0.18, 0.48, gf) * leftWeight * 1.8;
  col += vec3(0.18, 1.0,  0.08) * smoothstep(0.60, 0.85, gf) * leftWeight * 2.0; /* lime peaks */

  /* ── RIGHT side: electric cyan aurora — strict rightWeight, no base bleed ── */
  float rightWeight = clamp(uv.x * 2.8 - 0.55, 0.0, 1.0);
  float cyanLayer = smoothstep(0.36, 0.70, f);
  col += vec3(0.0, 0.72, 1.0)  * cyanLayer * rightWeight * 2.8;
  col += vec3(0.0, 0.92, 1.0)  * smoothstep(0.58, 0.84, f) * rightWeight * 2.8;
  /* Vertical bright cyan streaks on far right */
  float vStreak = exp(-pow((uv.x - 0.88)*6.0, 2.0));
  col += vec3(0.3, 0.95, 1.0) * vStreak * smoothstep(0.45, 0.72, f) * 1.6;

  /* ── CENTER blend: green→cyan meetpoint shifted right ── */
  float centerX = clamp(1.0 - abs(uv.x - 0.58) * 3.5, 0.0, 1.0);
  col += vec3(0.0, 0.65, 0.55) * smoothstep(0.46, 0.78, f) * centerX * 1.1;

  /* ── Peak highlights ── */
  col += vec3(0.3, 1.0, 0.7) * smoothstep(0.82, 0.97, gf) * leftWeight * 2.5;
  col += vec3(0.2, 1.0, 1.0) * smoothstep(0.82, 0.97, f)  * rightWeight * 2.5;

  /* ── Depth fbm layer — separated by side ── */
  float f2 = fbm(uv * 3.5 + r + t * 0.06);
  col += vec3(0.0, 0.55, 0.20) * smoothstep(0.50, 0.70, f2) * leftWeight * 0.8;
  col += vec3(0.0, 0.28, 0.52) * smoothstep(0.55, 0.78, f2) * rightWeight * 0.5;

  /* ── Contrast boost: make darks darker, brights brighter ── */
  col = pow(max(col, 0.0), vec3(0.68));

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
