import { useEffect, useRef, useState, type PointerEvent, type ReactNode, type MutableRefObject } from 'react'
import { arcadeKind, arcadeName, patrolWave, type ArcadeKind } from './game'

type Props = {
  visit: number
  onResult: (won: boolean, killed: number) => void
}

export function ArcadeNight({ visit, onResult }: Props) {
  const kind = arcadeKind(visit)
  if (kind === 'breakout') return <BreakoutGame onResult={onResult} />
  if (kind === 'meteors') return <MeteorsGame onResult={onResult} />
  return <InvadersGame onResult={onResult} />
}

function ArcadeShell({
  title,
  hud,
  hint,
  shake,
  flash,
  done,
  won,
  children,
}: {
  title: string
  hud: string
  hint: string
  shake: boolean
  flash: boolean
  done: boolean
  won: boolean
  children: ReactNode
}) {
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-black/85 p-3">
      <div
        className={`arcade-cabinet relative h-[min(82vh,560px)] w-full max-w-2xl overflow-hidden rounded-3xl border-4 border-cyan-300/40 bg-[#030816] ${shake ? 'arcade-shake' : ''} ${flash ? 'arcade-flash' : ''}`}
      >
        <div className="arcade-scanlines pointer-events-none absolute inset-0 z-30" />
        <div className="arcade-vignette pointer-events-none absolute inset-0 z-20" />
        <p className="pointer-events-none pt-2 text-center font-mono text-[10px] tracking-[0.35em] text-cyan-300/80 uppercase">
          Waffleson Arcade · 1 credit
        </p>
        <h2 className="font-display pointer-events-none px-4 text-center text-xl text-lime-300 sm:text-2xl">{title}</h2>
        <p className="pointer-events-none text-center font-mono text-xs text-cyan-100/85">{hud}</p>
        <div className="relative z-10 mx-auto mt-1 h-[68%] w-[94%] overflow-hidden rounded-md border border-cyan-400/20 bg-[#07101c]">
          {children}
        </div>
        <p className="pointer-events-none absolute inset-x-0 bottom-2 z-0 text-center font-mono text-[10px] tracking-[0.22em] text-lime-400/80 uppercase">
          {hint}
        </p>
        {done && (
          <p className="font-display arcade-result pointer-events-none absolute inset-x-0 top-1/2 z-40 -translate-y-1/2 text-center text-3xl text-waffle">
            {won ? 'STAGE CLEAR' : 'GAME OVER'}
          </p>
        )}
      </div>
    </div>
  )
}

function InvadersGame({ onResult }: { onResult: Props['onResult'] }) {
  const wave = patrolWave()
  const kind: ArcadeKind = 'invaders'
  const fieldRef = useRef<HTMLDivElement>(null)
  const onResultRef = useRef(onResult)
  onResultRef.current = onResult
  const finished = useRef(false)
  const keys = useRef({ left: false, right: false })
  const fireHeld = useRef(false)
  const [shake, setShake] = useState(false)
  const [flash, setFlash] = useState(false)
  const [view, setView] = useState(() => freshInvaders(wave.aliens, wave.seconds))
  const shipXRef = useRef(50)
  const stRef = useRef<InvState | null>(null)

  useEffect(() => {
    const st = freshInvaders(wave.aliens, wave.seconds)
    stRef.current = st
    let last = performance.now()
    let stepAcc = 0
    let fireAcc = 0
    let bombAcc = 0
    let raf = 0
    const stepMs = 820

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      if (!st.done) {
        st.timeLeft = Math.max(0, st.timeLeft - dt)
        const spd = (keys.current.left ? -1 : 0) + (keys.current.right ? 1 : 0)
        if (spd !== 0) {
          st.shipX = clamp(st.shipX + spd * 70 * dt, 8, 92)
          shipXRef.current = st.shipX
        } else {
          st.shipX = shipXRef.current
        }
        fireAcc += dt
        if (fireHeld.current && fireAcc > 0.28 && st.shots.filter((s) => s.friendly).length < 3) {
          fireAcc = 0
          st.shots.push({ x: st.shipX, y: 86, vy: -110, friendly: true, id: st.nextId++ })
        }
        stepAcc += dt * 1000
        if (stepAcc >= stepMs) {
          stepAcc = 0
          const alive = st.invaders.filter((a) => !a.dead)
          const xs = alive.map((a) => st.ox + a.c * 11)
          const minX = Math.min(...xs, 50)
          const maxX = Math.max(...xs, 50)
          if ((st.dir > 0 && maxX > 88) || (st.dir < 0 && minX < 8)) {
            st.dir *= -1
            st.oy += 5
          } else {
            st.ox += st.dir * 4
          }
        }
        bombAcc += dt
        if (bombAcc > 3.4) {
          bombAcc = 0
          const shooters = st.invaders.filter((a) => !a.dead)
          if (shooters.length) {
            const a = shooters[Math.floor(Math.random() * shooters.length)]
            st.shots.push({
              x: st.ox + a.c * 11,
              y: st.oy + a.r * 11 + 6,
              vy: 38,
              friendly: false,
              id: st.nextId++,
            })
          }
        }
        st.shots = st.shots.filter((s) => {
          s.y += s.vy * dt
          return s.y > 2 && s.y < 98
        })
        for (const s of st.shots) {
          if (!s.friendly) {
            if (Math.abs(s.x - st.shipX) < 5 && s.y > 84 && s.y < 94) {
              s.y = 200
              st.hits += 1
              setShake(true)
              window.setTimeout(() => setShake(false), 180)
            }
            continue
          }
          for (const a of st.invaders) {
            if (a.dead) continue
            const ax = st.ox + a.c * 11
            const ay = st.oy + a.r * 11
            if (Math.abs(s.x - ax) < 5.5 && Math.abs(s.y - ay) < 6) {
              a.dead = true
              s.y = -20
              st.killed += 1
              st.booms.push({ x: ax, y: ay, t: 0, id: st.nextId++ })
              setFlash(true)
              window.setTimeout(() => setFlash(false), 80)
            }
          }
        }
        st.booms = st.booms.filter((b) => {
          b.t += dt
          return b.t < 0.45
        })
        const rows = st.invaders.filter((a) => !a.dead).map((a) => a.r)
        const lowest = rows.length ? Math.max(...rows) : 0
        const landed = st.oy + 11 * lowest > 86
        if (st.killed >= wave.need) {
          st.done = true
          st.won = true
        } else if (st.timeLeft <= 0 || st.hits >= 4 || landed) {
          st.done = true
          st.won = false
        }
      }
      setView({ ...st, invaders: st.invaders.map((a) => ({ ...a })), shots: [...st.shots], booms: [...st.booms] })
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [wave.aliens, wave.need, wave.seconds])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.current.left = true
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.current.right = true
      if (e.key === ' ' || e.key === 'ArrowUp') {
        e.preventDefault()
        fireHeld.current = true
      }
    }
    const up = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.current.left = false
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.current.right = false
      if (e.key === ' ' || e.key === 'ArrowUp') fireHeld.current = false
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])

  useFinish(view.done, view.won, view.killed, finished, onResultRef)

  const move = (e: PointerEvent<HTMLDivElement>) => {
    const rect = fieldRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = clamp(((e.clientX - rect.left) / rect.width) * 100, 8, 92)
    shipXRef.current = x
  }

  const tap = (e: PointerEvent<HTMLDivElement>) => {
    e.stopPropagation()
    const rect = fieldRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = clamp(((e.clientX - rect.left) / rect.width) * 100, 0, 100)
    const y = clamp(((e.clientY - rect.top) / rect.height) * 100, 0, 100)
    shipXRef.current = clamp(x, 8, 92)
    fireHeld.current = true
    const st = stRef.current
    if (!st || st.done) return
    for (const a of st.invaders) {
      if (a.dead) continue
      const ax = st.ox + a.c * 11
      const ay = st.oy + a.r * 11
      if (Math.abs(x - ax) < 11 && Math.abs(y - ay) < 12) {
        a.dead = true
        st.killed += 1
        st.booms.push({ x: ax, y: ay, t: 0, id: st.nextId++ })
        st.shots.push({ x: st.shipX, y: 86, vy: -110, friendly: true, id: st.nextId++ })
        break
      }
    }
  }

  return (
    <ArcadeShell
      title={arcadeName(kind)}
      hud={
        view.done
          ? view.won
            ? 'Kitchen secured'
            : 'They nicked the batter'
          : `KILL ${view.killed}/${wave.need}  ${Math.ceil(view.timeLeft)}s`
      }
      hint="Tap aliens or slide and hold to fire"
      shake={shake}
      flash={flash}
      done={view.done}
      won={view.won}
    >
      <div
        ref={fieldRef}
        className="absolute inset-0 z-10 cursor-crosshair touch-none"
        onPointerMove={move}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          tap(e)
        }}
        onPointerUp={() => {
          fireHeld.current = false
        }}
      >
        <div className="invader-ufo pointer-events-none absolute top-2 h-4 w-8 rounded-full bg-[#e879f9] shadow-[0_0_12px_#e879f9]" style={{ left: `${(view.timeLeft * 13) % 90}%` }} />
        {view.invaders.map((a) =>
          a.dead ? null : (
            <InvaderSprite
              key={a.id}
              x={view.ox + a.c * 11}
              y={view.oy + a.r * 11}
              frame={Math.floor(view.timeLeft * 4) % 2}
            />
          ),
        )}
        {view.shots.map((s) => (
          <span
            key={s.id}
            className={`absolute w-[3px] rounded-full ${s.friendly ? 'h-4 bg-lime-300 shadow-[0_0_8px_#bef264]' : 'h-3 bg-rose-400 shadow-[0_0_8px_#fb7185]'}`}
            style={{ left: `${s.x}%`, top: `${s.y}%`, transform: 'translate(-50%, -50%)' }}
          />
        ))}
        {view.booms.map((b) => (
          <span
            key={b.id}
            className="boom-pop absolute"
            style={{ left: `${b.x}%`, top: `${b.y}%` }}
          />
        ))}
        <PixelTank x={view.shipX} player />
      </div>
    </ArcadeShell>
  )
}

type InvState = {
  invaders: { id: number; c: number; r: number; dead: boolean }[]
  ox: number
  oy: number
  dir: number
  shipX: number
  shots: { id: number; x: number; y: number; vy: number; friendly: boolean }[]
  booms: { id: number; x: number; y: number; t: number }[]
  killed: number
  hits: number
  timeLeft: number
  done: boolean
  won: boolean
  nextId: number
}

function freshInvaders(count: number, seconds: number): InvState {
  const cols = Math.min(6, Math.max(4, Math.ceil(count / 3)))
  const invaders = Array.from({ length: count }, (_, i) => ({
    id: i,
    c: i % cols,
    r: Math.floor(i / cols),
    dead: false,
  }))
  return {
    invaders,
    ox: 10,
    oy: 10,
    dir: 1,
    shipX: 50,
    shots: [],
    booms: [],
    killed: 0,
    hits: 0,
    timeLeft: seconds,
    done: false,
    won: false,
    nextId: 100,
  }
}

function InvaderSprite({ x, y, frame }: { x: number; y: number; frame: number }) {
  return (
    <svg
      viewBox="0 0 16 12"
      className="pointer-events-none absolute h-7 w-9"
      style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
    >
      <g fill="#86efac">
        <rect x="4" y="0" width="8" height="2" />
        <rect x="2" y="2" width="12" height="2" />
        <rect x="0" y="4" width="16" height="4" />
        {frame === 0 ? (
          <>
            <rect x="2" y="8" width="2" height="2" />
            <rect x="12" y="8" width="2" height="2" />
            <rect x="4" y="10" width="2" height="2" />
            <rect x="10" y="10" width="2" height="2" />
          </>
        ) : (
          <>
            <rect x="0" y="8" width="2" height="2" />
            <rect x="14" y="8" width="2" height="2" />
            <rect x="2" y="10" width="2" height="2" />
            <rect x="12" y="10" width="2" height="2" />
          </>
        )}
        <rect x="4" y="4" width="2" height="2" fill="#030816" />
        <rect x="10" y="4" width="2" height="2" fill="#030816" />
      </g>
    </svg>
  )
}

function PixelTank({ x, player = false }: { x: number; player?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 16"
      className={`absolute ${player ? 'h-7 w-10' : 'h-5 w-7 opacity-90'}`}
      style={{ left: `${x}%`, top: player ? '90%' : '93%', transform: 'translate(-50%, -50%)' }}
    >
      <rect x="9" y="0" width="6" height="4" fill={player ? '#f4b942' : '#7dd3fc'} />
      <rect x="2" y="4" width="20" height="8" fill={player ? '#f4b942' : '#7dd3fc'} />
      <rect x="0" y="12" width="24" height="4" fill={player ? '#c45c12' : '#2563eb'} />
      <rect x="10" y="14" width="4" height="3" fill="#ff5a1f" className="ship-thrust" />
    </svg>
  )
}

function BreakoutGame({ onResult }: { onResult: Props['onResult'] }) {
  const need = 5
  const onResultRef = useRef(onResult)
  onResultRef.current = onResult
  const finished = useRef(false)
  const fieldRef = useRef<HTMLDivElement>(null)
  const [shake, setShake] = useState(false)
  const [view, setView] = useState(() => freshBreakout(need))
  const paddleRef = useRef(50)

  useEffect(() => {
    const st = freshBreakout(need)
    let last = performance.now()
    let raf = 0
    const loop = (now: number) => {
      const dt = Math.min(0.04, (now - last) / 1000)
      last = now
      if (!st.done) {
        st.timeLeft = Math.max(0, st.timeLeft - dt)
        st.paddle = paddleRef.current
        st.ball.x += st.ball.vx * dt
        st.ball.y += st.ball.vy * dt
        if (st.ball.x < 4 || st.ball.x > 96) st.ball.vx *= -1
        if (st.ball.y < 4) st.ball.vy = Math.abs(st.ball.vy)
        const half = 9
        if (st.ball.y > 86 && st.ball.y < 94 && Math.abs(st.ball.x - st.paddle) < half && st.ball.vy > 0) {
          st.ball.vy = -Math.abs(st.ball.vy)
          st.ball.vx += (st.ball.x - st.paddle) * 3
        }
        for (const b of st.bricks) {
          if (b.dead) continue
          if (Math.abs(st.ball.x - b.x) < 7 && Math.abs(st.ball.y - b.y) < 5) {
            b.dead = true
            st.ball.vy *= -1
            st.killed += 1
            st.booms.push({ x: b.x, y: b.y, t: 0, id: st.nextId++ })
          }
        }
        st.booms = st.booms.filter((b) => {
          b.t += dt
          return b.t < 0.4
        })
        if (st.ball.y > 100) {
          st.lives -= 1
          st.ball = { x: st.paddle, y: 70, vx: 28, vy: -42 }
          setShake(true)
          window.setTimeout(() => setShake(false), 180)
        }
        if (st.killed >= need) {
          st.done = true
          st.won = true
        } else if (st.lives <= 0 || st.timeLeft <= 0) {
          st.done = true
          st.won = false
        }
      }
      setView({ ...st, bricks: st.bricks.map((b) => ({ ...b })), booms: [...st.booms], ball: { ...st.ball } })
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [need])

  useFinish(view.done, view.won, view.killed, finished, onResultRef)

  const move = (e: PointerEvent<HTMLDivElement>) => {
    const rect = fieldRef.current?.getBoundingClientRect()
    if (!rect) return
    view.paddle = clamp(((e.clientX - rect.left) / rect.width) * 100, 10, 90)
    paddleRef.current = view.paddle
  }

  return (
    <ArcadeShell
      title={arcadeName('breakout')}
      hud={
        view.done
          ? view.won
            ? 'Grid smashed'
            : 'Ball in the syrup'
          : `BREAK ${view.killed}/${need}  BALLS ${view.lives}  ${Math.ceil(view.timeLeft)}s`
      }
      hint="Slide to move the iron · bounce the waffle through the grid"
      shake={shake}
      flash={false}
      done={view.done}
      won={view.won}
    >
      <div ref={fieldRef} className="absolute inset-0 cursor-ew-resize" onPointerMove={move} onPointerDown={move}>
        {view.bricks.map((b) =>
          b.dead ? null : (
            <span
              key={b.id}
              className="waffle-brick absolute rounded-[3px]"
              style={{ left: `${b.x}%`, top: `${b.y}%`, background: b.color }}
            />
          ),
        )}
        {view.booms.map((b) => (
          <span key={b.id} className="boom-pop absolute" style={{ left: `${b.x}%`, top: `${b.y}%` }} />
        ))}
        <span
          className="absolute size-3 rounded-full bg-waffle shadow-[0_0_12px_#f4b942] waffle-spin"
          style={{ left: `${view.ball.x}%`, top: `${view.ball.y}%`, transform: 'translate(-50%, -50%)' }}
        />
        <span
          className="absolute h-2 rounded-full bg-cyan-200 shadow-[0_0_10px_#a5f3fc]"
          style={{
            left: `${view.paddle}%`,
            top: '90%',
            width: '18%',
            transform: 'translate(-50%, -50%)',
          }}
        />
      </div>
    </ArcadeShell>
  )
}

function freshBreakout(need: number) {
  const cols = 6
  const rows = 3
  const bricks = Array.from({ length: cols * rows }, (_, i) => {
    const c = i % cols
    const r = Math.floor(i / cols)
    const colors = ['#f4b942', '#fb7185', '#86efac', '#7dd3fc']
    return { id: i, x: 14 + c * 14.5, y: 14 + r * 12, dead: false, color: colors[r % colors.length] }
  })
  return {
    bricks,
    ball: { x: 50, y: 60, vx: 32, vy: -46 },
    paddle: 50,
    killed: 0,
    lives: 2,
    timeLeft: 20,
    done: false,
    won: false,
    booms: [] as { id: number; x: number; y: number; t: number }[],
    nextId: 50,
    need,
  }
}

function MeteorsGame({ onResult }: { onResult: Props['onResult'] }) {
  const wave = patrolWave()
  const onResultRef = useRef(onResult)
  onResultRef.current = onResult
  const finished = useRef(false)
  const fieldRef = useRef<HTMLDivElement>(null)
  const fireHeld = useRef(false)
  const [shake, setShake] = useState(false)
  const [flash, setFlash] = useState(false)
  const [view, setView] = useState(() => freshMeteors(wave.seconds))
  const shipXRef = useRef(50)

  useEffect(() => {
    const st = freshMeteors(wave.seconds)
    let last = performance.now()
    let spawn = 0
    let fireAcc = 0
    let raf = 0
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      if (!st.done) {
        st.timeLeft = Math.max(0, st.timeLeft - dt)
        st.shipX = shipXRef.current
        spawn += dt
        if (spawn > 1.1) {
          spawn = 0
          st.rocks.push({
            id: st.nextId++,
            x: 8 + Math.random() * 84,
            y: -4,
            vy: 18 + Math.random() * 14,
            r: 4 + Math.random() * 4,
            rot: Math.random() * 360,
          })
        }
        fireAcc += dt
        if (fireHeld.current && fireAcc > 0.22) {
          fireAcc = 0
          st.shots.push({ id: st.nextId++, x: st.shipX, y: 86, vy: -120 })
        }
        st.shots = st.shots.filter((s) => {
          s.y += s.vy * dt
          return s.y > 0
        })
        st.rocks = st.rocks.filter((r) => {
          r.y += r.vy * dt
          r.rot += 80 * dt
          if (r.y > 96) {
            st.leaks += 1
            setShake(true)
            window.setTimeout(() => setShake(false), 160)
            return false
          }
          return true
        })
        for (const s of st.shots) {
          for (const r of st.rocks) {
            if (Math.abs(s.x - r.x) < r.r + 2 && Math.abs(s.y - r.y) < r.r + 2) {
              st.booms.push({ x: r.x, y: r.y, t: 0, id: st.nextId++ })
              r.y = 200
              s.y = -20
              st.killed += 1
              setFlash(true)
              window.setTimeout(() => setFlash(false), 70)
            }
          }
        }
        st.rocks = st.rocks.filter((r) => r.y < 199)
        st.booms = st.booms.filter((b) => {
          b.t += dt
          return b.t < 0.4
        })
        if (st.killed >= wave.need) {
          st.done = true
          st.won = true
        } else if (st.leaks >= 3 || st.timeLeft <= 0) {
          st.done = true
          st.won = false
        }
      }
      setView({ ...st, rocks: [...st.rocks], shots: [...st.shots], booms: [...st.booms] })
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [wave.need, wave.seconds])

  useFinish(view.done, view.won, view.killed, finished, onResultRef)

  const move = (e: PointerEvent<HTMLDivElement>) => {
    const rect = fieldRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = clamp(((e.clientX - rect.left) / rect.width) * 100, 8, 92)
    view.shipX = x
    shipXRef.current = x
  }

  return (
    <ArcadeShell
      title={arcadeName('meteors')}
      hud={
        view.done
          ? view.won
            ? 'Sky cleared'
            : 'Syrup storm got through'
          : `BLAST ${view.killed}/${wave.need}  LEAKS ${view.leaks}/3  ${Math.ceil(view.timeLeft)}s`
      }
      hint="Slide to aim · hold to fire"
      shake={shake}
      flash={flash}
      done={view.done}
      won={view.won}
    >
      <div
        ref={fieldRef}
        className="absolute inset-0 cursor-crosshair"
        onPointerMove={move}
        onPointerDown={(e) => {
          fireHeld.current = true
          move(e)
        }}
        onPointerUp={() => {
          fireHeld.current = false
        }}
      >
        {view.rocks.map((r) => (
          <span
            key={r.id}
            className="meteor-rock absolute rounded-full"
            style={{
              left: `${r.x}%`,
              top: `${r.y}%`,
              width: `${r.r * 6}px`,
              height: `${r.r * 6}px`,
              transform: `translate(-50%, -50%) rotate(${r.rot}deg)`,
            }}
          />
        ))}
        {view.shots.map((s) => (
          <span
            key={s.id}
            className="absolute h-4 w-[3px] rounded-full bg-lime-300 shadow-[0_0_8px_#bef264]"
            style={{ left: `${s.x}%`, top: `${s.y}%`, transform: 'translate(-50%, -50%)' }}
          />
        ))}
        {view.booms.map((b) => (
          <span key={b.id} className="boom-pop absolute" style={{ left: `${b.x}%`, top: `${b.y}%` }} />
        ))}
        <PixelTank x={view.shipX} player />
      </div>
    </ArcadeShell>
  )
}

function freshMeteors(seconds: number) {
  return {
    rocks: [] as { id: number; x: number; y: number; vy: number; r: number; rot: number }[],
    shots: [] as { id: number; x: number; y: number; vy: number }[],
    booms: [] as { id: number; x: number; y: number; t: number }[],
    shipX: 50,
    killed: 0,
    leaks: 0,
    timeLeft: seconds,
    done: false,
    won: false,
    nextId: 1,
  }
}

function useFinish(
  done: boolean,
  won: boolean,
  killed: number,
  finished: MutableRefObject<boolean>,
  onResultRef: MutableRefObject<(won: boolean, killed: number) => void>,
) {
  useEffect(() => {
    if (!done || finished.current) return
    finished.current = true
    const wonNow = won
    const killedNow = killed
    const id = window.setTimeout(() => onResultRef.current(wonNow, killedNow), 1400)
    return () => window.clearTimeout(id)
  }, [done])
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n))
}
