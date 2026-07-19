export default function OperationsLoading() {
  return (
    <div className="flex h-full flex-col bg-zinc-950" role="status" aria-label="Operasyon Merkezi yükleniyor">
      <div className="flex min-h-[76px] items-center justify-between gap-4 border-b border-cyan-900/50 px-4 lg:px-7">
        <div className="space-y-2">
          <div className="h-3 w-36 animate-pulse rounded bg-zinc-800" />
          <div className="h-2.5 w-56 max-w-[55vw] animate-pulse rounded bg-zinc-900" />
        </div>
        <div className="h-12 w-[min(360px,38vw)] animate-pulse rounded-lg border border-zinc-800 bg-zinc-900" />
      </div>
      <div className="flex min-h-0 flex-1 flex-col px-4 py-6 sm:px-8">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-xl border border-zinc-800 bg-zinc-900" />
          ))}
        </div>
        <div className="mt-4 grid min-h-0 flex-1 gap-4 lg:grid-cols-2">
          <div className="animate-pulse rounded-xl border border-zinc-800 bg-zinc-900" />
          <div className="animate-pulse rounded-xl border border-zinc-800 bg-zinc-900" />
        </div>
      </div>
    </div>
  )
}
