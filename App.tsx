import { useCallback, useEffect, useRef, useState, type MouseEvent, type PointerEvent, type ReactNode } from 'react'
import {
  ALIEN_EVERY_MS,
  ALIEN_FIRST_MS,
  BUILDINGS,
  FACTORY_CAP_VISIBLE,
  FACTORY_EVERY,
  LAUNCH_COST,
  WORLDS,
  formatDepth,
  formatNumber,
  formatRate,
  depthKm,
  layersFor,
  toolForStage,
  arcadeKind,
  arcadeName,
  type BuildingId,
  type Layer,
  type World,
  type WorldId,
  type NewsItem,
} from './game'
import { ArcadeNight } from './ArcadeNight'
import { DepthTool } from './DepthTool'
import { BreakingNews, NewsTicker } from './NewsTicker'
import { RocketCutscene } from './RocketCutscene'
import { useGame } from './useGame'

type Particle = {
  id: number
  x: number
  y: number
  dx: number
  dy: number
  kind: 'crumb' | 'floater' | 'crit' | 'syrup'
  text?: string
  born: number
}

export default function App() {
  const game = useGame()
  const { state, stats, layer, upcoming, world, destination } = game
  const prevLayer = useRef(layer.id)
  const prevFactories = useRef(stats.factories)
  const destRef = useRef<WorldId | null>(null)
  const flightRef = useRef(false)
  const aliensOpenRef = useRef(false)
  const armAlien = useRef<(ms: number) => void>(() => {})
  const [banner, setBanner] = useState<string | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const [flight, setFlight] = useState<{ from: World; to: World; maiden: boolean } | null>(null)
  const [showAliens, setShowAliens] = useState(false)
  const [nextAlienAt, setNextAlienAt] = useState(() => Date.now() + alienFirstDelay())
  const [nowTick, setNowTick] = useState(Date.now())
  const [breaking, setBreaking] = useState<NewsItem | null>(null)
  const skipNews = useRef(true)
  const seenNews = useRef(state.news[0]?.id ?? 0)

  flightRef.current = Boolean(flight)
  aliensOpenRef.current = showAliens

  useEffect(() => {
    if (prevLayer.current !== layer.id && state.totalWaffles > 0) {
      setBanner(`${layer.name} — ${layer.blurb}`)
      game.reportNews('GEOLOGY', `${layer.name} on ${world.name}. ${layer.blurb}`)
      const id = window.setTimeout(() => setBanner(null), 3200)
      prevLayer.current = layer.id
      return () => window.clearTimeout(id)
    }
    prevLayer.current = layer.id
  }, [layer, state.totalWaffles])

  useEffect(() => {
    if (stats.factories > prevFactories.current) {
      const n = stats.factories
      setBanner(
        n === 1
          ? 'A waffle factory rose on the surface.'
          : `${n} factories now ring the crust.`,
      )
      const id = window.setTimeout(() => setBanner(null), 3200)
      prevFactories.current = n
      return () => window.clearTimeout(id)
    }
    prevFactories.current = stats.factories
  }, [stats.factories])

  useEffect(() => {
    const latest = state.news[0]
    if (!latest) return
    if (skipNews.current) {
      skipNews.current = false
      seenNews.current = latest.id
      return
    }
    if (latest.id === seenNews.current) return
    seenNews.current = latest.id
    setBreaking(latest)
    const id = window.setTimeout(() => setBreaking(null), 5600)
    return () => window.clearTimeout(id)
  }, [state.news])

  useEffect(() => {
    const id = window.setInterval(() => setNowTick(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    let timer = 0
    armAlien.current = (ms: number) => {
      window.clearTimeout(timer)
      setNextAlienAt(Date.now() + ms)
      timer = window.setTimeout(() => {
        if (flightRef.current || aliensOpenRef.current) {
          armAlien.current(8000)
          return
        }
        setShowAliens(true)
      }, ms)
    }
    armAlien.current(alienFirstDelay())
    return () => window.clearTimeout(timer)
  }, [])

  const startFlight = useCallback(
    (from: World, to: World) => {
      if (!game.canVisit(to.id)) return
      destRef.current = to.id
      setFlight({ from, to, maiden: !state.unlockedWorlds.includes(to.id) })
    },
    [game, state.unlockedWorlds],
  )

  const finishFlight = useCallback(() => {
    const dest = destRef.current
    destRef.current = null
    if (dest) game.travel(dest)
    setFlight(null)
  }, [game])

  const km = depthKm(state.totalWaffles)

  return (
    <div className="relative min-h-svh overflow-hidden bg-[#090605] text-batter">
      <Background world={world} stage={layer.stage} rushing={stats.rushing} />
      <NewsTicker items={state.news} />
      <div className="relative mx-auto grid min-h-svh max-w-[1400px] grid-rows-[auto_1fr] gap-4 p-3 sm:p-5 lg:grid-cols-[92px_minmax(0,1fr)_minmax(300px,420px)] lg:grid-rows-1 lg:gap-6">
        <DepthColumn km={km} layer={layer} world={world} />
        <div className="flex min-h-0 flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div className="hidden lg:block" />
            <header className="relative z-20 flex-1 text-center">
              <p className="text-[11px] font-bold tracking-[0.35em] uppercase" style={{ color: world.accent }}>
                {world.gem} {world.name}
              </p>
              <h1
                className="font-display score-shine mt-1 text-4xl drop-shadow-[0_4px_0_#8b4513] sm:text-6xl"
                style={{ color: world.pocket }}
              >
                {formatNumber(Math.floor(state.waffles))}
              </h1>
              <p className="mt-1 text-sm text-batter/80">
                {world.currency} drilled · {formatRate(stats.wps)}
              </p>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs sm:text-sm">
                <Chip>
                  <span className="mr-1 inline-flex align-middle">
                    <DepthTool stage={layer.stage} className="h-4 w-4" />
                  </span>
                  {toolForStage(layer.stage).label}
                </Chip>
                <Chip>{layer.name}</Chip>
                <Chip>{formatNumber(stats.clickPower)} / click</Chip>
                {stats.gemMul > 1 && <Chip className="border-white/20">Gem x{stats.gemMul.toFixed(2)}</Chip>}
                {state.combo > 1 && (
                  <Chip className="border-magma/50 bg-magma/20 text-magma">COMBO x{state.combo}</Chip>
                )}
                {stats.rushing && (
                  <Chip className="animate-pulse border-waffle bg-waffle text-soil">SYRUP RUSH x7</Chip>
                )}
                {stats.factories > 0 && (
                  <Chip>
                    🏭 {stats.factories} {stats.factories === 1 ? 'factory' : 'factories'}
                  </Chip>
                )}
                {stats.factories === 0 && (
                  <Chip className="border-white/15">
                    🏭 {stats.buys}/{FACTORY_EVERY} to first factory
                  </Chip>
                )}
                {stats.factories > 0 && stats.nextFactoryIn > 0 && (
                  <Chip className="border-white/15">
                    Next factory in {stats.nextFactoryIn}
                  </Chip>
                )}
                <Chip className="border-cyan-400/30">
                  {arcadeName(arcadeKind(state.patrolWins))}
                </Chip>
                {!showAliens && (
                  <Chip className="border-emerald-400/30">👽 patrol {formatEta(nextAlienAt - nowTick)}</Chip>
                )}
              </div>
              <WorldDots
                current={world.id}
                unlocked={state.unlockedWorlds}
                canGo={game.canVisit}
                onGo={(next) => startFlight(world, next)}
              />
              <p className="mt-2 text-[10px] tracking-wide text-batter/50">
                Tap a gem to hop worlds you have unlocked.
              </p>
            </header>
            <div className="flex shrink-0 gap-2">
              <GhostButton onClick={game.toggleMute}>{state.muted ? 'Muted' : 'Sound'}</GhostButton>
              <GhostButton onClick={() => setConfirmReset(true)}>Reset</GhostButton>
            </div>
          </div>
          <div className="lg:hidden">
            <div className="mb-1 flex items-center justify-between text-[10px] font-bold tracking-widest text-waffle/80 uppercase">
              <span>{layer.name}</span>
              <span>{formatDepth(km)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-black/50">
              <div
                className="h-full rounded-full bg-linear-to-r from-waffle to-magma"
                style={{ width: `${Math.min(100, (km / 6371) * 100)}%` }}
              />
            </div>
          </div>
          <div className="relative grid min-h-[360px] flex-1 place-items-center">
            <Planet
              world={world}
              layer={layer}
              rushing={stats.rushing}
              factories={stats.factories}
              golden={game.golden}
              showHint={!state.seenHint}
              onDrill={game.click}
              onGolden={game.catchGolden}
            />
            {destination && !state.unlockedWorlds.includes(destination.id) && game.atCore && (
              game.canLaunch ? (
                <button
                  type="button"
                  onClick={() => startFlight(world, destination)}
                  className="absolute bottom-8 z-30 rounded-full border-2 px-5 py-3 text-sm font-bold shadow-2xl"
                  style={{ background: world.pocket, borderColor: world.crust, color: '#140c08' }}
                >
                  🚀 Spend {formatNumber(LAUNCH_COST)} {world.currency} · Launch to {destination.name}
                </button>
              ) : (
                <div className="absolute bottom-6 z-30 w-[min(90%,320px)] rounded-2xl border border-white/15 bg-black/70 px-4 py-3 text-center">
                  <p className="text-xs font-bold tracking-wide text-batter/80 uppercase">
                    Rocket ticket
                  </p>
                  <p className="mt-1 text-sm text-batter">
                    {formatNumber(Math.floor(state.waffles))} / {formatNumber(LAUNCH_COST)} {world.currency}
                  </p>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/60">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, (state.waffles / LAUNCH_COST) * 100)}%`,
                        background: world.accent,
                      }}
                    />
                  </div>
                  <p className="mt-2 text-[11px] text-batter/55">
                    Stock 500 million {world.currency} to fly to {destination.name}.
                  </p>
                </div>
              )
            )}
            {game.atCore && !destination && (
              <p className="absolute bottom-8 z-30 rounded-full border border-white/20 bg-black/60 px-4 py-2 text-center text-sm">
                Star Core mapped. The breakfast galaxy is yours.
              </p>
            )}
            {upcoming && !game.atCore && (
              <p className="absolute bottom-2 text-center text-xs text-batter/55">
                Next layer: {upcoming.name} at {formatDepth(upcoming.minKm)}
              </p>
            )}
          </div>
        </div>
        <Shop
          state={state}
          world={world}
          perBuilding={stats.perBuilding}
          costOf={game.costOf}
          upgrades={game.upgrades}
          ownedAny={game.ownedAny}
          wave={game.wave}
          onBuy={game.buy}
          onUpgrade={game.buyUpgrade}
        />
      </div>
      {banner && (
        <div
          className="pointer-events-none fixed top-8 left-1/2 z-50 max-w-[90vw] rounded-2xl border border-waffle bg-soil/95 px-5 py-3 text-center shadow-2xl"
          style={{ animation: 'banner-in 3.1s ease forwards' }}
        >
          <p className="font-display text-sm text-waffle sm:text-base">{banner}</p>
        </div>
      )}
      {confirmReset && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
          <div className="max-w-sm rounded-3xl border border-waffle/30 bg-[#1a100a] p-5 text-center">
            <p className="font-display text-xl text-waffle">Abandon the borehole?</p>
            <p className="mt-2 text-sm text-batter/70">
              This wipes your waffles, rigs, toppings, depth, and world. Back to Syrup Earth.
            </p>
            <div className="mt-5 flex justify-center gap-2">
              <GhostButton onClick={() => setConfirmReset(false)}>Keep drilling</GhostButton>
              <button
                type="button"
                className="rounded-md bg-magma px-4 py-2 text-sm font-semibold text-white"
                onClick={() => {
                  game.reset()
                  setConfirmReset(false)
                }}
              >
                Reset run
              </button>
            </div>
          </div>
        </div>
      )}
      {flight && (
        <RocketCutscene from={flight.from} to={flight.to} maiden={flight.maiden} onDone={finishFlight} />
      )}
      {showAliens && !flight && (
        <ArcadeNight
          visit={state.patrolWins}
          onResult={(won, killed) => {
            game.resolvePatrol(won, killed)
            setShowAliens(false)
            armAlien.current(ALIEN_EVERY_MS)
          }}
        />
      )}
      {breaking && !showAliens && !flight && (
        <BreakingNews item={breaking} onDone={() => setBreaking(null)} />
      )}
    </div>
  )
}

function alienFirstDelay() {
  if (typeof window === 'undefined') return ALIEN_FIRST_MS
  return new URLSearchParams(window.location.search).has('patrol') ? 4000 : ALIEN_FIRST_MS
}

function formatEta(ms: number) {
  const seconds = Math.max(0, Math.ceil(ms / 1000))
  const m = Math.floor(seconds / 60)
  const r = seconds % 60
  return `${m}:${r.toString().padStart(2, '0')}`
}

function WorldDots({
  current,
  unlocked,
  canGo,
  onGo,
}: {
  current: World['id']
  unlocked: WorldId[]
  canGo: (id: WorldId) => boolean
  onGo: (world: World) => void
}) {
  return (
    <div className="mt-3 flex items-center justify-center gap-2">
      {WORLDS.map((entry) => {
        const here = entry.id === current
        const open = unlocked.includes(entry.id)
        const go = canGo(entry.id)
        return (
          <button
            key={entry.id}
            type="button"
            disabled={!go}
            title={
              here
                ? `Here: ${entry.name}`
                : go
                  ? `Fly to ${entry.name}`
                  : open
                    ? entry.name
                    : `Locked — reach the core and stock ${formatNumber(LAUNCH_COST)} waffles to open ${entry.name}`
            }
            onClick={() => onGo(entry)}
            className="grid size-8 place-items-center rounded-full text-base transition disabled:cursor-default"
            style={{
              background: here ? entry.accent : open ? `${entry.accent}55` : '#2a1c14',
              boxShadow: here ? `0 0 12px ${entry.accent}` : 'none',
              opacity: open || here || go ? 1 : 0.32,
              outline: here ? `2px solid ${entry.accent}` : 'none',
            }}
          >
            {entry.gem}
          </button>
        )
      })}
    </div>
  )
}

function GhostButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-batter hover:bg-white/10"
    >
      {children}
    </button>
  )
}

function Chip({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-waffle/25 bg-black/35 px-3 py-1 font-semibold tracking-wide text-batter ${className}`}
    >
      {children}
    </span>
  )
}

function Background({ world, stage, rushing }: { world: World; stage: number; rushing: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0">
      <div
        className={`absolute inset-0 ${rushing ? 'rush-pulse' : ''}`}
        style={{
          background: rushing
            ? `radial-gradient(circle at 50% 42%, ${world.pocket}99, ${world.bgDeep} 58%, #090605 78%)`
            : stage >= 3
              ? `radial-gradient(circle at 50% 58%, ${world.drip}66, ${world.bgDeep} 62%, #090605 80%)`
              : `radial-gradient(circle at 50% 38%, ${world.bgMid}55, ${world.bgDeep} 60%, #090605 80%)`,
        }}
      />
      {Array.from({ length: 18 }, (_, i) => (
        <span
          key={i}
          className="float-crumb absolute rounded-full"
          style={{
            left: `${(i * 17) % 100}%`,
            top: `${(i * 29) % 90}%`,
            width: 4 + (i % 5),
            height: 4 + (i % 4),
            background: i % 2 ? world.pocket : world.butter,
            animationDelay: `${i * 0.35}s`,
            animationDuration: `${7 + (i % 5)}s`,
            opacity: 0.35,
          }}
        />
      ))}
      <div
        className="absolute inset-x-0 bottom-0 h-1/3 opacity-40"
        style={{ background: `linear-gradient(to top, ${world.dripDark}88, transparent)` }}
      />
    </div>
  )
}

function DepthColumn({ km, layer, world }: { km: number; layer: Layer; world: World }) {
  const progress = Math.min(1, km / 6371)
  const layers = layersFor(world)
  return (
    <aside className="hidden h-full w-[92px] shrink-0 flex-col items-center lg:flex">
      <p className="mb-2 text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: world.accent }}>
        Borehole
      </p>
      <DepthTool stage={layer.stage} className="mb-2 h-8 w-8" />
      <div className="relative flex h-full w-11 flex-col overflow-hidden rounded-full border bg-black/50" style={{ borderColor: `${world.accent}40` }}>
        {layers.map((entry, i) => {
          const next = layers[i + 1]
          const start = entry.minKm / 6371
          const end = (next?.minKm ?? 6371) / 6371
          const reached = km >= entry.minKm
          const fill = [world.poolDark, world.pool, world.drip, world.pocket, world.butter][entry.stage]
          return (
            <div
              key={entry.id}
              className="relative"
              style={{
                height: `${Math.max(4, (end - start) * 100)}%`,
                background: reached ? fill : '#1a120c',
                opacity: reached ? 1 : 0.35,
              }}
            >
              {layer.id === entry.id && (
                <span
                  className="absolute top-1/2 left-full z-20 ml-2 w-24 -translate-y-1/2 text-[10px] leading-tight font-semibold"
                  style={{ color: world.accent }}
                >
                  {entry.name}
                </span>
              )}
            </div>
          )
        })}
        <div
          className="absolute right-0 left-0 z-20 h-1 bg-batter shadow-[0_0_12px_#fff3d6]"
          style={{ top: `${progress * 92 + 4}%` }}
        />
      </div>
      <p className="mt-3 font-mono text-xs text-batter/80">{formatDepth(km)}</p>
    </aside>
  )
}

function Planet({
  world,
  layer,
  rushing,
  factories,
  golden,
  showHint,
  onDrill,
  onGolden,
}: {
  world: World
  layer: Layer
  rushing: boolean
  factories: number
  golden: { x: number; y: number } | null
  showHint: boolean
  onDrill: () => { amount: number; combo: number; crit: boolean }
  onGolden: () => void
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [rumble, setRumble] = useState(false)
  const [particles, setParticles] = useState<Particle[]>([])
  const particlesRef = useRef(0)
  particlesRef.current = particles.length
  const [shock, setShock] = useState<{ id: number; x: number; y: number }[]>([])
  const [pressed, setPressed] = useState(false)
  const idRef = useRef(1)
  const rumbleTimer = useRef<number | undefined>(undefined)

  const drillAt = (clientX: number | null, clientY: number | null) => {
    const result = onDrill()
    const rect = wrapRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = clientX === null ? rect.width / 2 : clientX - rect.left
    const y = clientY === null ? rect.height / 2 : clientY - rect.top
    const now = Date.now()
    const next: Particle[] = [
      {
        id: now + idRef.current++,
        x: x + (Math.random() - 0.5) * 28,
        y,
        dx: 0,
        dy: -80,
        born: now,
        kind: result.crit ? 'crit' : 'floater',
        text: `+${formatNumber(result.amount)}`,
      },
    ]
    const busy = particlesRef.current > 24
    const burst = result.crit ? 16 : busy ? 5 : 10
    for (let i = 0; i < burst; i++) {
      const angle = Math.random() * Math.PI * 2
      const dist = 48 + Math.random() * 90
      next.push({
        id: now + idRef.current++,
        x,
        y,
        dx: Math.cos(angle) * dist,
        dy: Math.sin(angle) * dist - 30,
        born: now,
        kind: i % 2 === 0 ? 'crumb' : 'syrup',
      })
    }
    setParticles((prev) => [...prev.filter((p) => now - p.born < 950).slice(-40), ...next])
    setShock((prev) => [...prev.slice(-3), { id: now + idRef.current++, x, y }])
    setRumble(false)
    window.clearTimeout(rumbleTimer.current)
    window.requestAnimationFrame(() => setRumble(true))
    rumbleTimer.current = window.setTimeout(() => setRumble(false), 200)
    window.setTimeout(() => {
      setParticles((prev) => prev.filter((p) => Date.now() - p.born < 950))
      setShock((prev) => prev.slice(1))
    }, 960)
  }

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    setPressed(true)
    drillAt(event.clientX, event.clientY)
  }

  const handleKeyboardClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (event.detail === 0) drillAt(null, null)
  }

  return (
    <div ref={wrapRef} className="relative mx-auto grid place-items-center">
      {showHint && (
        <p className="absolute -top-2 z-30 rounded-full bg-waffle px-3 py-1 text-xs font-bold text-soil shadow-lg sm:text-sm">
          Click Waffleson. Breakfast is down there.
        </p>
      )}
      <div
        className={`pointer-events-none absolute inset-0 rounded-full blur-3xl ${rushing ? 'bg-waffle/45' : 'bg-syrup/35'}`}
        style={{ animation: 'pulse-glow 2.4s ease-in-out infinite' }}
      />
      <div className={`planet-press relative mx-auto w-max ${pressed ? 'planet-pressed' : ''}`}>
        <button
          type="button"
          aria-label="Drill the Earth"
          onPointerDown={handlePointerDown}
          onPointerUp={() => setPressed(false)}
          onPointerLeave={() => setPressed(false)}
          onPointerCancel={() => setPressed(false)}
          onClick={handleKeyboardClick}
          className={`planet-button relative z-0 size-[min(72vw,380px)] cursor-pointer overflow-visible rounded-full border-0 bg-transparent p-0 select-none ${rumble ? 'rumble rumble-hard' : ''} ${rushing ? 'planet-rush' : 'planet-idle'}`}
        >
          <EarthVisual world={world} stage={layer.stage} rushing={rushing} />
          <SurfaceFactories count={factories} />
          <SyrupDrips world={world} stage={layer.stage} />
          {shock.map((ring) => (
            <span
              key={ring.id}
              className="shockwave pointer-events-none absolute z-10 rounded-full border-2"
              style={{ left: ring.x, top: ring.y, borderColor: world.accent }}
            />
          ))}
          <div
            className="pointer-events-none tool-swing absolute top-[-22px] left-1/2 z-20 -translate-x-1/2 drop-shadow-lg"
            title={toolForStage(layer.stage).label}
          >
            <DepthTool stage={layer.stage} className="h-11 w-11" />
          </div>
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <Waffleson world={world} />
          </div>
        </button>
      </div>
      {golden && (
        <button
          type="button"
          aria-label="Catch the golden waffle"
          onClick={onGolden}
          className="golden-sparkle absolute z-40 size-16 cursor-pointer border-0 bg-transparent text-5xl drop-shadow-[0_0_18px_#f4b942]"
          style={{
            left: `${golden.x}%`,
            top: `${golden.y}%`,
            animation: 'golden-bob 0.7s ease-in-out infinite',
          }}
        >
          🧇
        </button>
      )}
      {particles.map((particle) =>
        particle.kind === 'floater' || particle.kind === 'crit' ? (
          <span
            key={particle.id}
            className={`pointer-events-none absolute z-30 font-display whitespace-nowrap ${particle.kind === 'crit' ? 'text-2xl text-magma' : 'text-lg text-waffle'}`}
            style={{
              left: particle.x,
              top: particle.y,
              animation: 'float-up 0.9s ease-out forwards',
              textShadow: '0 2px 0 #8b4513',
            }}
          >
            {particle.text}
            {particle.kind === 'crit' ? ' CRIT!' : ''}
          </span>
        ) : (
          <span
            key={particle.id}
            className={`pointer-events-none absolute z-30 ${particle.kind === 'syrup' ? 'rounded-full' : 'rounded-[3px]'}`}
            style={{
              left: particle.x,
              top: particle.y,
              width: particle.kind === 'syrup' ? 10 : 12,
              height: particle.kind === 'syrup' ? 14 : 12,
              background: particle.kind === 'syrup' ? world.drip : world.pocket,
              boxShadow:
                particle.kind === 'syrup' ? `inset 0 -2px 0 ${world.dripDark}` : `inset 0 0 0 1px ${world.crust}`,
              ['--dx' as string]: `${particle.dx}px`,
              ['--dy' as string]: `${particle.dy}px`,
              animation: 'crumb 0.8s ease-out forwards',
            }}
          />
        ),
      )}
    </div>
  )
}

function SurfaceFactories({ count }: { count: number }) {
  const shown = Math.min(count, FACTORY_CAP_VISIBLE)
  if (shown <= 0) return null
  const angles = [-82, -52, -22, 12, 48, 82, 118, 152, -118, -148, 178, -178]
  return (
    <div className="pointer-events-none absolute inset-[4%] z-10">
      {Array.from({ length: shown }, (_, i) => {
        const rad = ((angles[i] ?? i * 30) * Math.PI) / 180
        return (
          <span
            key={i}
            className="factory-pop relative absolute text-[22px] drop-shadow-[0_2px_4px_rgba(0,0,0,0.65)] sm:text-[26px]"
            style={{
              left: `${50 + Math.cos(rad) * 47}%`,
              top: `${50 + Math.sin(rad) * 47}%`,
            }}
            title="Surface factory"
          >
            🏭
            <span className="factory-steam" />
          </span>
        )
      })}
    </div>
  )
}

function Waffleson({ world }: { world: World }) {
  const pockets = [0, 1, 2, 3]
  return (
    <div
      className="waffle-idle waffle-shine relative grid size-[42%] grid-cols-4 grid-rows-4 gap-[7%] rounded-[18%] border-4 p-[6%] shadow-xl"
      style={{ background: world.crust, borderColor: world.crust }}
    >
      {pockets.flatMap((row) =>
        pockets.map((col) => (
          <div
            key={`${row}-${col}`}
            className="rounded-[22%] shadow-[inset_0_2px_4px_rgba(0,0,0,0.35)]"
            style={{ background: world.pocket }}
          />
        )),
      )}
    </div>
  )
}

function EarthVisual({ world, stage, rushing }: { world: World; stage: 0 | 1 | 2 | 3 | 4; rushing: boolean }) {
  const melt = (stage + 1) / 5
  const gid = world.id
  return (
    <svg viewBox="0 0 200 200" className="size-full overflow-visible drop-shadow-[0_18px_28px_rgba(0,0,0,0.65)]">
      <defs>
        <radialGradient id={`${gid}-glow`} cx="32%" cy="28%">
          <stop offset="0%" stopColor={world.glow[0]} stopOpacity={rushing ? 0.95 : 0.7} />
          <stop offset="28%" stopColor={world.glow[1]} />
          <stop offset="58%" stopColor={world.glow[2]} />
          <stop offset="82%" stopColor={world.glow[3]} />
          <stop offset="100%" stopColor={world.glow[4]} />
        </radialGradient>
        <radialGradient id={`${gid}-core`} cx="50%" cy="50%">
          <stop offset="0%" stopColor={world.butter} />
          <stop offset="45%" stopColor={world.pocket} />
          <stop offset="100%" stopColor={world.drip} stopOpacity="0" />
        </radialGradient>
        <pattern id={`${gid}-grid`} width="18" height="18" patternUnits="userSpaceOnUse">
          <rect width="18" height="18" fill={world.pocket} />
          <rect x="0" y="7" width="18" height="4" fill={world.crust} />
          <rect x="7" y="0" width="4" height="18" fill={world.crust} />
        </pattern>
        <clipPath id={`${gid}-clip`}>
          <circle cx="100" cy="100" r="92" />
        </clipPath>
      </defs>
      <circle cx="100" cy="100" r="97" fill={rushing ? world.pocket : world.glow[4]} opacity="0.55" />
      <circle cx="100" cy="100" r="92" fill={`url(#${gid}-glow)`} />
      <g clipPath={`url(#${gid}-clip)`}>
        <rect x="0" y="0" width="200" height="200" fill={`url(#${gid}-grid)`} opacity={0.22 + melt * 0.35} />
        <ellipse cx="62" cy="78" rx="40" ry="26" fill={world.pool} opacity="0.72" />
        <ellipse cx="148" cy="118" rx="44" ry="30" fill={world.poolDark} opacity="0.68" />
        <ellipse cx="118" cy="52" rx="22" ry="12" fill={world.butter} opacity={0.35 + melt * 0.25} />
        <ellipse cx="78" cy="142" rx="28" ry="16" fill={world.drip} opacity="0.45" />
        <path d="M28 70 C 48 90, 40 130, 58 160" stroke={world.poolDark} strokeWidth="10" fill="none" opacity="0.35" strokeLinecap="round" />
        <path d="M150 40 C 140 90, 168 120, 152 168" stroke={world.poolDark} strokeWidth="8" fill="none" opacity="0.3" strokeLinecap="round" />
        {stage >= 2 && (
          <circle cx="100" cy="100" r={36 + stage * 8} fill={`url(#${gid}-core)`} opacity={0.35 + melt * 0.3} />
        )}
        {stage >= 4 && <circle cx="100" cy="100" r="22" fill={world.butter} opacity="0.85" />}
        <ellipse cx="70" cy="58" rx="38" ry="18" fill={world.butter} opacity="0.22" />
        <rect x="97" y="8" width="6" height="92" fill="#1a120c" opacity="0.5" />
      </g>
      <circle cx="100" cy="100" r="92" fill="none" stroke={world.rim} strokeWidth="2" opacity="0.28" />
    </svg>
  )
}

function SyrupDrips({ world, stage }: { world: World; stage: number }) {
  const extra = stage >= 2
  return (
    <svg
      viewBox="0 0 200 70"
      className="pointer-events-none absolute right-0 -bottom-9 left-0 h-[22%] overflow-visible"
    >
      <g className="syrup-drip">
        <path d="M92 0 C90 22 86 38 100 62 C114 38 110 22 108 0 Z" fill={world.drip} />
        <path d="M96 4 C95 20 93 32 100 48 C107 32 105 20 104 4 Z" fill={world.pocket} opacity="0.7" />
        <circle cx="100" cy="60" r="7" fill={world.drip} className="syrup-blob" />
      </g>
      <g className="syrup-drip syrup-drip-delay">
        <path d="M58 2 C56 16 54 28 64 44 C74 28 72 16 70 2 Z" fill={world.dripDark} />
        <circle cx="64" cy="42" r="5.5" fill={world.dripDark} />
      </g>
      <g className="syrup-drip" style={{ animationDelay: '-0.6s' }}>
        <path d="M132 0 C131 14 128 26 140 40 C151 24 148 12 146 0 Z" fill={world.drip} />
        <circle cx="140" cy="38" r="5" fill={world.drip} />
      </g>
      {extra && (
        <g className="syrup-drip syrup-drip-delay">
          <path d="M28 8 C27 18 24 28 34 38 C44 26 42 16 40 8 Z" fill={world.dripDark} />
          <circle cx="34" cy="36" r="4.5" fill={world.dripDark} />
        </g>
      )}
    </svg>
  )
}

function Shop({
  state,
  world,
  perBuilding,
  costOf,
  upgrades,
  ownedAny,
  wave,
  onBuy,
  onUpgrade,
}: {
  state: ReturnType<typeof useGame>['state']
  world: World
  perBuilding: Record<BuildingId, number>
  costOf: (id: BuildingId, qty: number) => number
  upgrades: ReturnType<typeof useGame>['upgrades']
  ownedAny: boolean
  wave: ReturnType<typeof useGame>['wave']
  onBuy: (id: BuildingId, qty: number) => boolean
  onUpgrade: (id: ReturnType<typeof useGame>['upgrades'][number]['id']) => boolean
}) {
  const [tab, setTab] = useState<'rigs' | 'toppings'>('rigs')
  const [qty, setQty] = useState<1 | 10 | 100>(1)
  return (
    <section className="flex h-full min-h-[320px] flex-col rounded-3xl border border-waffle/20 bg-black/35 p-3 shadow-[inset_0_1px_0_rgba(255,243,214,0.08)] backdrop-blur-md sm:p-4 lg:min-h-0">
      <div className="mb-3 flex items-center gap-2">
        <Tab active={tab === 'rigs'} onClick={() => setTab('rigs')}>
          Rigs
        </Tab>
        <Tab active={tab === 'toppings'} onClick={() => setTab('toppings')}>
          Toppings
          {upgrades.length > 0 && (
            <span className="ml-1 rounded-full bg-magma px-1.5 text-[10px] text-white">{upgrades.length}</span>
          )}
        </Tab>
        {tab === 'rigs' && (
          <div className="ml-auto flex rounded-full bg-black/40 p-0.5">
            {([1, 10, 100] as const).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setQty(n)}
                className={`rounded-full px-2.5 py-1 text-xs font-bold ${qty === n ? 'bg-waffle text-soil' : 'text-batter/70'}`}
              >
                x{n}
              </button>
            ))}
          </div>
        )}
      </div>
      <p className="mb-2 text-[11px] text-batter/55">
        Next patrol: {arcadeName(arcadeKind(state.patrolWins))} · {wave.need} to clear · same cabinet every time ·
        loot scales with drilled total
      </p>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
        {tab === 'rigs' ? (
          <>
            {!ownedAny && (
              <p className="rounded-2xl border border-dashed border-waffle/30 px-3 py-3 text-sm text-batter/70">
                Earn a few waffles, then hire a Pocket Fork. Auto-drilling starts here. Every 40 rigs and
                toppings, a factory rises on the crust.
              </p>
            )}
            {BUILDINGS.map((building) => {
              const owned = state.buildings[building.id]
              const cost = costOf(building.id, qty)
              const can = state.waffles >= cost
              const locked = owned === 0 && state.totalWaffles < building.baseCost * 0.25
              return (
                <button
                  key={building.id}
                  type="button"
                  disabled={!can || locked}
                  onClick={() => onBuy(building.id, qty)}
                  className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition ${
                    locked
                      ? 'border-white/10 bg-white/5 opacity-40'
                      : can
                        ? 'border-waffle/50 bg-waffle/10 hover:bg-waffle/20'
                        : 'border-white/10 bg-white/5'
                  }`}
                >
                  <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-black/30 text-2xl">
                    {building.emoji}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="font-bold text-batter">{building.name}</span>
                      <span className="font-mono text-xs text-waffle">x{owned}</span>
                    </span>
                    <span className="block truncate text-xs text-batter/60">
                      {locked ? 'Keep drilling to unlock' : building.blurb}
                    </span>
                    <span className="mt-0.5 block text-xs text-waffle/90">
                      {formatRate(perBuilding[building.id])} each · {formatNumber(cost)} {world.currency}
                    </span>
                  </span>
                </button>
              )
            })}
          </>
        ) : upgrades.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-waffle/30 px-3 py-8 text-center text-sm text-batter/70">
            No toppings yet. Buy rigs, drill deeper, then come back hungry.
          </p>
        ) : (
          upgrades.map((upgrade) => {
            const can = state.waffles >= upgrade.cost
            return (
              <div
                key={upgrade.id}
                className={`flex items-center gap-3 rounded-2xl border px-3 py-3 ${can ? 'border-waffle/50 bg-waffle/10' : 'border-white/10 bg-white/5'}`}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-batter">{upgrade.name}</p>
                  <p className="text-xs text-batter/65">{upgrade.blurb}</p>
                </div>
                <button
                  type="button"
                  disabled={!can}
                  onClick={() => onUpgrade(upgrade.id)}
                  className="rounded-md bg-waffle px-3 py-2 text-xs font-bold text-soil disabled:opacity-45"
                >
                  {formatNumber(upgrade.cost)}
                </button>
              </div>
            )
          })
        )}
      </div>
    </section>
  )
}

function Tab({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-sm font-bold ${active ? 'bg-waffle text-soil' : 'bg-white/5 text-batter/70 hover:bg-white/10'}`}
    >
      {children}
    </button>
  )
}
