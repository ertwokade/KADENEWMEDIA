/**
 * Sayfalar arası geçişte gösterilen iskelet.
 *
 * Renkler sabit koyu yazılmıştı (bg-zinc-950, border-zinc-800): açık temada
 * her geçişte ekran önce koyuya düşüp sonra aydınlanıyordu. Bu, yükleme
 * gerçekte uzamasa bile "geç açılıyor" hissi veriyordu. Artık tema
 * tokenlarından besleniyor, iskelet ile sayfa aynı zeminde.
 */
export default function DashboardLoading() {
  return (
    <div
      className="flex h-full min-h-0 flex-col bg-[color:var(--kade-bg)]"
      role="status"
      aria-label="Sayfa yükleniyor"
    >
      <div className="flex min-h-[76px] items-center justify-between gap-4 border-b border-[color:var(--kade-line)] px-4 lg:px-7">
        <div className="space-y-2">
          <div className="h-3 w-40 animate-pulse rounded bg-[color:var(--kade-surface-raised)]" />
          <div className="h-2.5 w-64 max-w-[52vw] animate-pulse rounded bg-[color:var(--kade-surface-soft)]" />
        </div>
        <div className="h-12 w-[min(360px,38vw)] animate-pulse rounded-[var(--kade-r-inner)] border border-[color:var(--kade-line)] bg-[color:var(--kade-surface-soft)]" />
      </div>

      <div className="grid min-h-0 flex-1 gap-4 overflow-hidden p-4 sm:p-6 lg:grid-cols-[minmax(260px,360px)_1fr]">
        <div className="space-y-3">
          <div className="h-24 animate-pulse rounded-[var(--kade-r-card)] border border-[color:var(--kade-line)] bg-[color:var(--kade-surface-soft)]" />
          <div className="h-14 animate-pulse rounded-[var(--kade-r-card)] border border-[color:var(--kade-line)] bg-[color:var(--kade-surface-soft)]" />
          <div className="h-14 animate-pulse rounded-[var(--kade-r-card)] border border-[color:var(--kade-line)] bg-[color:var(--kade-surface-soft)]" />
          <div className="h-32 animate-pulse rounded-[var(--kade-r-card)] border border-[color:var(--kade-line)] bg-[color:var(--kade-surface-soft)]" />
        </div>
        <div className="min-h-[260px] animate-pulse rounded-[var(--kade-r-card)] border border-[color:var(--kade-line)] bg-[color:var(--kade-surface-soft)]" />
      </div>
    </div>
  )
}
