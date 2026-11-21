import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import {
  BUILDINGS,
  GOLDEN_MS,
  RUSH_MS,
  RUSH_MULT,
  UPGRADES,
  type BuildingId,
  type GameState,
  type Golden,
  type UpgradeId,
  atCore,
  buildingCost,
  canLaunch,
  canVisit as worldIsOpen,
  currentLayer,
  derived,
  factoryCount,
  gemMultiplier,
  initialState,
  loadState,
  nextLayer,
  nextWorld,
  patrolReward,
  patrolTheft,
  patrolWave,
  arcadeKind,
  arcadeName,
  formatNumber,
  pushNews,
  saveState,
  scaledClick,
  travelTo,
  type WorldId,
  visibleUpgrades,
  worldById,
} from './game'

type Action =
  | { type: 'tick'; dt: number; now: number }
  | { type: 'click'; amount: number; combo: number; now: number }
  | { type: 'buy'; id: BuildingId; qty: number }
  | { type: 'upgrade'; id: UpgradeId }
  | { type: 'golden-click'; now: number }
  | { type: 'travel'; dest: WorldId }
  | { type: 'bonus'; amount: number }
  | { type: 'patrol'; won: boolean; killed: number }
  | { type: 'news'; kicker: string; headline: string }
  | { type: 'mute' }
  | { type: 'reset' }

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'tick': {
      const { wps } = derived(state, action.now)
      const gain = wps * action.dt
      const combo = action.now - state.lastClickAt > 700 ? 0 : state.combo
      if (gain === 0 && combo === state.combo) return state
      return {
        ...state,
        waffles: state.waffles + gain,
        totalWaffles: state.totalWaffles + gain,
        combo,
      }
    }
    case 'click':
      return {
        ...state,
        waffles: state.waffles + action.amount,
        totalWaffles: state.totalWaffles + action.amount,
        combo: action.combo,
        lastClickAt: action.now,
        seenHint: true,
      }
    case 'buy': {
      const owned = state.buildings[action.id]
      const cost = buildingCost(action.id, owned, action.qty)
      if (state.waffles < cost) return state
      const next: GameState = {
        ...state,
        waffles: state.waffles - cost,
        buildings: { ...state.buildings, [action.id]: owned + action.qty },
      }
      if (factoryCount(next) > factoryCount(state)) {
        const world = worldById(state.worldId)
        return pushNews(
          next,
          'INDUSTRY',
          `A new waffle factory rose on ${world.name}. Local syrup futures spiked.`,
        )
      }
      return next
    }
    case 'upgrade': {
      if (state.upgrades.includes(action.id)) return state
      const def = UPGRADES.find((u) => u.id === action.id)
      if (!def || state.waffles < def.cost) return state
      return {
        ...state,
        waffles: state.waffles - def.cost,
        upgrades: [...state.upgrades, action.id],
      }
    }
    case 'golden-click':
      return { ...state, rushUntil: action.now + RUSH_MS }
    case 'travel': {
      const dest = action.dest
      const hopped = travelTo(state, dest)
      if (hopped === state) return state
      const world = worldById(dest)
      return pushNews(hopped, 'SPACE', `Waffle rocket confirmed over ${world.name}. ${world.arriveLine}`)
    }
    case 'bonus':
      return {
        ...state,
        waffles: state.waffles + action.amount,
        totalWaffles: state.totalWaffles + action.amount,
      }
    case 'patrol': {
      const world = worldById(state.worldId)
      if (action.won) {
        const reward = patrolReward(action.killed, state.totalWaffles)
        const next = {
          ...state,
          waffles: state.waffles + reward,
          totalWaffles: state.totalWaffles + reward,
          patrolWins: state.patrolWins + 1,
        }
        const nextGame = arcadeName(arcadeKind(next.patrolWins))
        return pushNews(
          next,
          'PATROL',
          `Invaders routed over ${world.name}. Bonus ${formatNumber(Math.floor(reward))} ${world.currency}. Next cabinet: ${nextGame}.`,
        )
      }
      const stolen = patrolTheft(state.waffles, state.totalWaffles)
      const next = { ...state, waffles: Math.max(0, state.waffles - stolen) }
      return pushNews(
        next,
        'BREAKING',
        `Aliens looted ${formatNumber(Math.floor(stolen))} ${world.currency} from ${world.name}. The take is based on everything you have ever drilled.`,
      )
    }
    case 'news':
      return pushNews(state, action.kicker, action.headline)
    case 'mute':
      return { ...state, muted: !state.muted }
    case 'reset':
      return { ...initialState(), muted: state.muted }
    default:
      return state
  }
}

let audioCtx: AudioContext | null = null

function beep(kind: 'click' | 'buy' | 'golden' | 'crit' | 'laser' | 'alarm', muted: boolean) {
  if (muted) return
  try {
    audioCtx ??= new AudioContext()
    const ctx = audioCtx
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = kind === 'golden' || kind === 'laser' ? 'sawtooth' : kind === 'alarm' ? 'square' : 'triangle'
    const freq =
      kind === 'buy'
        ? 240
        : kind === 'golden'
          ? 520
          : kind === 'crit'
            ? 640
            : kind === 'laser'
              ? 880
              : kind === 'alarm'
                ? 140
                : 190 + Math.random() * 70
    osc.frequency.setValueAtTime(freq, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(freq * 1.6, ctx.currentTime + 0.08)
    gain.gain.setValueAtTime(0.04, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.14)
  } catch {
    /* optional juice */
  }
}

export function useGame() {
  const [state, dispatch] = useReducer(reducer, undefined, loadState)
  const stateRef = useRef(state)
  stateRef.current = state
  const [golden, setGolden] = useState<Golden | null>(null)
  const world = worldById(state.worldId)
  const stats = useMemo(() => derived(state), [state])
  const layer = currentLayer(state.totalWaffles, world)
  const upcoming = nextLayer(state.totalWaffles, world)
  const destination = nextWorld(state.worldId)

  useEffect(() => {
    let last = performance.now()
    let acc = 0
    let raf = 0
    const loop = (now: number) => {
      const dt = Math.min(0.25, (now - last) / 1000)
      last = now
      acc += dt
      if (acc >= 0.05) {
        dispatch({ type: 'tick', dt: acc, now: Date.now() })
        acc = 0
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  useEffect(() => {
    const id = window.setInterval(() => saveState(stateRef.current), 1000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    const spawn = () => {
      if (stateRef.current.totalWaffles < 12) return
      setGolden({
        x: 12 + Math.random() * 70,
        y: 16 + Math.random() * 55,
        until: Date.now() + GOLDEN_MS,
      })
    }
    const first = window.setTimeout(spawn, 8000)
    const id = window.setInterval(spawn, 38000)
    const expire = window.setInterval(() => {
      setGolden((g) => (g && g.until < Date.now() ? null : g))
    }, 400)
    return () => {
      window.clearTimeout(first)
      window.clearInterval(id)
      window.clearInterval(expire)
    }
  }, [])

  const click = useCallback(() => {
    const now = Date.now()
    const current = stateRef.current
    const next = derived(current, now)
    const combo = now - current.lastClickAt < 480 ? Math.min(25, current.combo + 1) : 1
    const crit = Math.random() < next.crit
    const rushing = now < current.rushUntil
    const gemMul = gemMultiplier(current.worldId)
    const amount = scaledClick(
      next.buys,
      next.clickAdd,
      rushing ? RUSH_MULT : 1,
      gemMul,
      crit,
    )
    dispatch({ type: 'click', amount, combo, now })
    beep(crit ? 'crit' : 'click', current.muted)
    return { amount, combo, crit }
  }, [])

  const buy = useCallback((id: BuildingId, qty: number) => {
    const current = stateRef.current
    if (current.waffles < buildingCost(id, current.buildings[id], qty)) return false
    dispatch({ type: 'buy', id, qty })
    beep('buy', current.muted)
    return true
  }, [])

  const buyUpgrade = useCallback((id: UpgradeId) => {
    const current = stateRef.current
    const def = UPGRADES.find((u) => u.id === id)
    if (!def || current.waffles < def.cost) return false
    dispatch({ type: 'upgrade', id })
    beep('buy', current.muted)
    return true
  }, [])

  const catchGolden = useCallback(() => {
    setGolden(null)
    dispatch({ type: 'golden-click', now: Date.now() })
    beep('golden', stateRef.current.muted)
  }, [])

  const travel = useCallback((dest: WorldId) => {
    if (!worldIsOpen(stateRef.current, dest)) return false
    dispatch({ type: 'travel', dest })
    beep('golden', stateRef.current.muted)
    return true
  }, [])

  const grantBonus = useCallback((amount: number) => {
    dispatch({ type: 'bonus', amount })
  }, [])

  const resolvePatrol = useCallback((won: boolean, killed: number) => {
    dispatch({ type: 'patrol', won, killed })
    beep(won ? 'golden' : 'alarm', stateRef.current.muted)
  }, [])

  const reportNews = useCallback((kicker: string, headline: string) => {
    dispatch({ type: 'news', kicker, headline })
  }, [])

  return {
    state,
    stats,
    world,
    destination,
    layer,
    upcoming,
    golden,
    atCore: atCore(state),
    canLaunch: canLaunch(state),
    click,
    buy,
    buyUpgrade,
    catchGolden,
    travel,
    grantBonus,
    resolvePatrol,
    reportNews,
    wave: patrolWave(),
    canVisit: (id: WorldId) => worldIsOpen(state, id),
    costOf: (id: BuildingId, qty: number) => buildingCost(id, state.buildings[id], qty),
    upgrades: visibleUpgrades(state),
    ownedAny: BUILDINGS.some((b) => state.buildings[b.id] > 0),
    unlockedWorlds: state.unlockedWorlds,
    toggleMute: () => dispatch({ type: 'mute' }),
    reset: () => dispatch({ type: 'reset' }),
  }
}
