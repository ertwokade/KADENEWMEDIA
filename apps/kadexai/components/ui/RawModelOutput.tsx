import ModelOutput from './ModelOutput'

interface RawModelOutputProps {
  content?: string
}

export default function RawModelOutput({ content }: RawModelOutputProps) {
  if (!content) return null

  return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
      <p className="mb-2 text-xs font-semibold text-amber-400">Model çıktısı</p>
      <ModelOutput content={content} />
    </div>
  )
}
