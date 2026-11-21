import { useEffect, useRef } from 'react'
import type { World } from './game'

export function RocketCutscene({
  from,
  to,
  maiden = false,
  onDone,
}: {
  from: World
  to: World
  maiden?: boolean
  onDone: () => void
}) {
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  useEffect(() => {
    const id = window.setTimeout(() => onDoneRef.current(), 4800)
    return () => window.clearTimeout(id)
  }, [])

  return (
    <div className="fixed inset-0 z-[80] overflow-hidden bg-[#03010a]">
      <div className="star-warp pointer-events-none absolute inset-0" />
      {Array.from({ length: 42 }, (_, i) => (
        <span
          key={i}
          className="warp-streak"
          style={{
            left: `${4 + ((i * 37) % 92)}%`,
            animationDelay: `${(i % 9) * 0.08}s`,
            height: `${18 + (i % 5) * 10}%`,
            animationDuration: `${0.7 + (i % 5) * 0.12}s`,
          }}
        />
      ))}
      {Array.from({ length: 12 }, (_, i) => (
        <span
          key={`n${i}`}
          className="nebula-blob pointer-events-none absolute rounded-full blur-2xl"
          style={{
            left: `${(i * 23) % 90}%`,
            top: `${(i * 17) % 80}%`,
            width: 80 + (i % 4) * 20,
            height: 80 + (i % 3) * 24,
            background: i % 2 ? '#f4b94233' : '#38bdf833',
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}

      <div className="planet-leave absolute top-[18%] left-1/2">
        <MiniPlanet world={from} />
      </div>

      <div className="waffle-rocket absolute top-1/2 left-1/2 z-20">
        <div className="rocket-shock" />
        <div className="rocket-flame" />
        <div className="rocket-flame rocket-flame-side" />
        <div
          className="waffle-spin grid size-16 grid-cols-4 grid-rows-4 gap-[6%] rounded-[18%] border-4 p-[6%] shadow-[0_0_24px_#f4b942]"
          style={{ background: from.crust, borderColor: from.crust }}
        >
          {Array.from({ length: 16 }, (_, i) => (
            <div key={i} className="rounded-[20%]" style={{ background: from.pocket }} />
          ))}
        </div>
        <div className="absolute top-1/2 -left-3 h-0 w-0 -translate-y-1/2 border-y-8 border-r-[10px] border-y-transparent border-r-stone-400" />
        <div className="absolute top-1/2 -right-3 h-0 w-0 -translate-y-1/2 border-y-8 border-l-[10px] border-y-transparent border-l-stone-400" />
      </div>

      <div className="planet-arrive absolute top-[22%] left-1/2">
        <MiniPlanet world={to} />
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-10 text-center">
        <p className="font-display text-sm tracking-widest text-batter/80 uppercase">
          {maiden && from.launchLine ? from.launchLine : `Leaving ${from.name}`}
        </p>
      </div>
      <div className="arrive-caption pointer-events-none absolute inset-x-0 bottom-14 text-center">
        <p className="font-display text-2xl" style={{ color: to.accent }}>
          {to.gem} {to.name}
        </p>
        <p className="mt-2 text-sm text-batter/80">{to.arriveLine}</p>
      </div>
    </div>
  )
}

function MiniPlanet({ world }: { world: World }) {
  return (
    <div
      className="size-40 rounded-full shadow-[0_0_40px_currentColor] sm:size-52"
      style={{
        color: world.accent,
        background: `radial-gradient(circle at 32% 28%, ${world.glow[0]}, ${world.glow[2]} 46%, ${world.glow[4]})`,
      }}
    />
  )
}
