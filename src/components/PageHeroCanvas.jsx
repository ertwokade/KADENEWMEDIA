import KadeParticleCanvas from './KadeParticleCanvas'

export default function PageHeroCanvas({ type = 'home' }) {
  return (
    <KadeParticleCanvas
      fixed
      className={`page-particles page-particles--${type}`}
      density={0.52}
      intensity={0.72}
      ambient
    />
  )
}
