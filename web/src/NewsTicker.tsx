import type { NewsItem } from './game'

export function NewsTicker({ items }: { items: NewsItem[] }) {
  const line =
    items.length === 0
      ? 'WNN — Breakfast is a planetary resource. This is Waffle News Network.'
      : items.map((item) => `${item.kicker}: ${item.headline}`).join('   •   ')
  const loop = `${line}   •   ${line}`

  return (
    <div className="relative z-40 border-b border-cyan-300/25 bg-[#041018] text-cyan-100">
      <div className="flex items-stretch">
        <span className="shrink-0 bg-red-600 px-2 py-1 text-[10px] font-extrabold tracking-[0.2em] text-white uppercase sm:px-3 sm:text-xs">
          WNN Live
        </span>
        <div className="news-marquee min-w-0 flex-1 overflow-hidden py-1">
          <p className="news-marquee-track whitespace-nowrap font-mono text-[11px] sm:text-xs">{loop}</p>
        </div>
      </div>
    </div>
  )
}

export function BreakingNews({ item, onDone }: { item: NewsItem; onDone: () => void }) {
  return (
    <button
      type="button"
      onClick={onDone}
      className="breaking-in fixed right-3 bottom-3 left-3 z-[76] max-w-xl cursor-pointer rounded-md border border-white/20 bg-[#120808]/95 text-left shadow-2xl sm:right-auto sm:left-6"
    >
      <div className="flex items-center gap-2 bg-red-700 px-3 py-1">
        <span className="text-[10px] font-extrabold tracking-[0.28em] text-white uppercase">Breaking</span>
        {item.kicker.toUpperCase() !== 'BREAKING' && (
          <span className="font-mono text-[10px] text-white/80">{item.kicker}</span>
        )}
      </div>
      <p className="px-3 py-2 text-sm text-batter sm:text-base">{item.headline}</p>
    </button>
  )
}
