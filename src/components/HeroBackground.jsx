import KadeParticleCanvas from './KadeParticleCanvas'

export default function HeroBackground() {
  return (
    <KadeParticleCanvas
      className="kade-particle-canvas--hero"
      density={1.08}
      intensity={1}
      ambient
    />
  )
}
