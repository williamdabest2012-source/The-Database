export type BuildingId =
  | 'fork'
  | 'bit'
  | 'auger'
  | 'brigade'
  | 'griddle'
  | 'press'
  | 'iron'
  | 'singularity'

export type UpgradeId =
  | 'extraBatter'
  | 'mapleInjection'
  | 'toastedTines'
  | 'spinDoctor'
  | 'stickierSyrup'
  | 'unionBreakfast'
  | 'oshaIgnore'
  | 'foldTwice'
  | 'continentalButter'
  | 'eventHorizon'
  | 'goldenGrid'
  | 'planetFlip'

export type Building = {
  id: BuildingId
  name: string
  blurb: string
  baseCost: number
  baseWps: number
  emoji: string
}

export type Upgrade = {
  id: UpgradeId
  name: string
  blurb: string
  cost: number
  requires?: { building: BuildingId; count: number }
  clickAdd?: number
  wpsMul?: number
  buildingMul?: Partial<Record<BuildingId, number>>
  crit?: number
}

export type Layer = {
  id: string
  name: string
  minKm: number
  blurb: string
  stage: 0 | 1 | 2 | 3 | 4
}

export const BUILDINGS: Building[] = [
  { id: 'fork', name: 'Pocket Fork', blurb: 'Poke the dirt. Pretend it is breakfast.', baseCost: 17, baseWps: 0.5, emoji: '🍴' },
  { id: 'bit', name: 'Waffle Bit', blurb: 'A spinning square of batter. Geology hates this.', baseCost: 115, baseWps: 5, emoji: '🧇' },
  { id: 'auger', name: 'Syrup Auger', blurb: 'Lubricates the borehole. Sticky, but legal.', baseCost: 800, baseWps: 33, emoji: '🍯' },
  { id: 'brigade', name: 'Belgian Brigade', blurb: 'Unionized. Grid-pattern certified.', baseCost: 4600, baseWps: 200, emoji: '👷' },
  { id: 'griddle', name: 'Magma Griddle', blurb: 'The mantle is just a very angry hot plate.', baseCost: 29000, baseWps: 1200, emoji: '🌋' },
  { id: 'press', name: 'Inner-Core Press', blurb: 'Fold the planet. Serve immediately.', baseCost: 200000, baseWps: 7700, emoji: '🫓' },
  { id: 'iron', name: 'Continental Iron', blurb: 'One waffle the size of Eurasia. Butter sold separately.', baseCost: 1.58e6, baseWps: 49000, emoji: '🌍' },
  { id: 'singularity', name: 'Breakfast Singularity', blurb: 'All matter becomes waffle. This was always the plan.', baseCost: 1.16e7, baseWps: 330000, emoji: '🌀' },
]

export const UPGRADES: Upgrade[] = [
  { id: 'extraBatter', name: 'Extra Batter', blurb: '+1 waffle per click. More square.', cost: 60, clickAdd: 1 },
  { id: 'mapleInjection', name: 'Maple Injection', blurb: 'Direct-to-crust syrup. +2 waffles per click.', cost: 300, clickAdd: 2 },
  { id: 'toastedTines', name: 'Toasted Tines', blurb: 'Pocket forks now come pre-crisped. x3 forks.', cost: 380, requires: { building: 'fork', count: 1 }, buildingMul: { fork: 3 } },
  { id: 'spinDoctor', name: 'Spin Doctor', blurb: 'Waffle bits rotate in both spacetime directions. x3 bits.', cost: 1900, requires: { building: 'bit', count: 1 }, buildingMul: { bit: 3 } },
  { id: 'stickierSyrup', name: 'Stickier Syrup', blurb: 'The auger refuses to let go of the Earth. x3 augers.', cost: 12000, requires: { building: 'auger', count: 1 }, buildingMul: { auger: 3 } },
  { id: 'unionBreakfast', name: 'Union Breakfast', blurb: 'The brigade negotiates a waffle-tripling clause.', cost: 74000, requires: { building: 'brigade', count: 1 }, buildingMul: { brigade: 3 } },
  { id: 'oshaIgnore', name: 'OSHA? Never Heard of Her', blurb: 'Magma griddles may now operate at fun temperatures. x3.', cost: 504000, requires: { building: 'griddle', count: 1 }, buildingMul: { griddle: 3 } },
  { id: 'foldTwice', name: 'Fold It Twice', blurb: 'Core presses discover lamination. x3 presses.', cost: 3.78e6, requires: { building: 'press', count: 1 }, buildingMul: { press: 3 } },
  { id: 'continentalButter', name: 'Continental Butter', blurb: 'Grease a hemisphere. Slide it into the hole. x3 irons.', cost: 2.94e7, requires: { building: 'iron', count: 1 }, buildingMul: { iron: 3 } },
  { id: 'eventHorizon', name: 'Maple Horizon', blurb: 'Nothing escapes the syrup. Not even lunch. x3 singularities.', cost: 2.31e8, requires: { building: 'singularity', count: 1 }, buildingMul: { singularity: 3 } },
  { id: 'goldenGrid', name: 'Golden Grid', blurb: '4% of clicks become legendary 11x strikes.', cost: 2300, crit: 0.04 },
  { id: 'planetFlip', name: 'Planet Flip', blurb: 'Flip the Earth on the iron. Double every rig.', cost: 5.88e6, wpsMul: 2 },
]

export const LAYERS: Layer[] = [
  { id: 'picnic', name: 'Picnic Blanket', minKm: 0, blurb: 'Ants, grass, and a dangerous amount of optimism.', stage: 0 },
  { id: 'topsoil', name: 'Topsoil', minKm: 0.02, blurb: 'Somebody should have asked the worms first.', stage: 0 },
  { id: 'crust', name: 'Continental Crust', minKm: 8, blurb: 'Bedrock, but make it brunch.', stage: 1 },
  { id: 'moho', name: 'Moho Discontinuity', minKm: 35, blurb: 'The crust ends. The batter thickens.', stage: 1 },
  { id: 'mantle', name: 'Upper Mantle', minKm: 80, blurb: 'Toasty. Perfect waffle weather.', stage: 2 },
  { id: 'transition', name: 'Transition Zone', minKm: 410, blurb: 'Minerals rearrange themselves into a grid.', stage: 2 },
  { id: 'lower', name: 'Lower Mantle', minKm: 660, blurb: 'Syrup crystallizes into jewelry down here.', stage: 3 },
  { id: 'outer', name: 'Outer Core', minKm: 2890, blurb: 'Liquid iron. Or batter. The lab is split.', stage: 3 },
  { id: 'inner', name: 'Inner Core', minKm: 5150, blurb: 'Solid, spinning, and suspiciously square.', stage: 4 },
  { id: 'core', name: 'The Waffle Core', minKm: 6368, blurb: 'Breakfast was always down here.', stage: 4 },
]

export type WorldId = 'syrup' | 'ruby' | 'jade' | 'sapphire'

export type World = {
  id: WorldId
  name: string
  currency: string
  blurb: string
  coreName: string
  coreBlurb: string
  launchLine: string
  arriveLine: string
  gem: string
  pocket: string
  crust: string
  drip: string
  dripDark: string
  glow: [string, string, string, string, string]
  pool: string
  poolDark: string
  butter: string
  rim: string
  bgMid: string
  bgDeep: string
  accent: string
}

export const WORLDS: World[] = [
  {
    id: 'syrup',
    name: 'Syrup Earth',
    currency: 'waffles',
    blurb: 'Melted maple. Drill breakfast.',
    coreName: 'The Waffle Core',
    coreBlurb: 'Breakfast was always down here.',
    launchLine: 'Core breach. Board the waffle rocket.',
    arriveLine: 'Touchdown on Syrup Earth.',
    gem: '🧇',
    pocket: '#f4b942',
    crust: '#8b4513',
    drip: '#c45c12',
    dripDark: '#7a2e8',
    glow: ['#ffe7a8', '#f4b942', '#c45c12', '#7a2e8', '#3a1408'],
    pool: '#7a2e8',
    poolDark: '#5c2208',
    butter: '#f4d27a',
    rim: '#f4d27a',
    bgMid: '#c45c12',
    bgDeep: '#2a1208',
    accent: '#f4b942',
  },
  {
    id: 'ruby',
    name: 'Ruby Fold',
    currency: 'ruby waffles',
    blurb: 'Pockets cut like garnets. The syrup is lava candy.',
    coreName: 'The Garnet Heart',
    coreBlurb: 'A red jewel the size of a city, still slightly sticky.',
    launchLine: 'Garnet Heart cracked. Next stop: jade.',
    arriveLine: 'Ruby Fold fills the canopy. Do not lick the crust.',
    gem: '♦️',
    pocket: '#ff6b6b',
    crust: '#6b1020',
    drip: '#e11d48',
    dripDark: '#7f1d1d',
    glow: ['#fecdd3', '#fb7185', '#e11d48', '#9f1239', '#4c0519'],
    pool: '#9f1239',
    poolDark: '#4c0519',
    butter: '#fecaca',
    rim: '#fda4af',
    bgMid: '#e11d48',
    bgDeep: '#1c0508',
    accent: '#fb7185',
  },
  {
    id: 'jade',
    name: 'Jade Batter',
    currency: 'jade waffles',
    blurb: 'Mint crystal syrup. Photosynthesis was a condiment.',
    coreName: 'The Jade Kernel',
    coreBlurb: 'Green light, square pockets, extremely expensive tea.',
    launchLine: 'Jade Kernel sung. The rocket wants starlight next.',
    arriveLine: 'Jade Batter below. The air smells like toasted matcha.',
    gem: '💚',
    pocket: '#86efac',
    crust: '#14532d',
    drip: '#22c55e',
    dripDark: '#166534',
    glow: ['#dcfce7', '#86efac', '#22c55e', '#15803d', '#052e16'],
    pool: '#166534',
    poolDark: '#052e16',
    butter: '#bbf7d0',
    rim: '#86efac',
    bgMid: '#16a34a',
    bgDeep: '#04160b',
    accent: '#86efac',
  },
  {
    id: 'sapphire',
    name: 'Star Sapphire',
    currency: 'sapphire waffles',
    blurb: 'Frozen cosmic butter. Breakfast at the edge of the map.',
    coreName: 'The Star Core',
    coreBlurb: 'A blue diamond spinning in batter. The map ends here.',
    launchLine: '',
    arriveLine: 'Star Sapphire. The last kitchen in the sky.',
    gem: '💎',
    pocket: '#93c5fd',
    crust: '#1e3a8a',
    drip: '#38bdf8',
    dripDark: '#1d4ed8',
    glow: ['#e0f2fe', '#7dd3fc', '#38bdf8', '#2563eb', '#0b1b4a'],
    pool: '#1e3a8a',
    poolDark: '#0b1b4a',
    butter: '#c4b5fd',
    rim: '#a5b4fc',
    bgMid: '#2563eb',
    bgDeep: '#050816',
    accent: '#7dd3fc',
  },
]

export const COST_GROWTH = 1.14
export const RUSH_MULT = 7
export const RUSH_MS = 13000
export const GOLDEN_MS = 14000
export const SAVE_KEY = 'waffleson-web-v4'
export const WORLD_GEM_MULT = 1.45
export const ROCKET_MS = 4800
export const ALIEN_FIRST_MS = 7 * 60 * 1000
export const ALIEN_EVERY_MS = 7 * 60 * 1000
export const ALIEN_WAVE_MS = 18000
export const LAUNCH_COST = 500_000_000
export const DEPTH_CORE_AT = 400_000_000
export const EARTH_RADIUS_KM = 6371
export const FACTORY_EVERY = 40
export const FACTORY_WPS = 400
export const FACTORY_CAP_VISIBLE = 12

/**
 * A click is worth 1 waffle. Each rig or topping you buy adds a little more, in a straight line.
 * Production, not clicking, is what snowballs. Spending never lowers it. Capped at 1M.
 */
export const CLICK_CAP = 1_000_000
export const CLICK_PER_PURCHASE = 0.1

export function lootTier(total: number): number {
  const t = Math.max(0, total)
  const base = t < 1000 ? 1 + 19 * Math.sqrt(t / 1000) : 20 * (t / 1000) ** 0.57
  return Math.min(CLICK_CAP, base)
}

export function scaledClick(
  purchases: number,
  clickAdd: number,
  rush: number,
  gemMul: number,
  crit = false,
): number {
  const base = Math.floor(1 + clickAdd + CLICK_PER_PURCHASE * purchases)
  const whole = Math.max(1, Math.round(base * rush * gemMul)) * (crit ? 11 : 1)
  return Math.min(CLICK_CAP, whole)
}

const SUFFIXES = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc']

export function formatNumber(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return '0'
  const sign = value < 0 ? '-' : ''
  const abs = Math.abs(value)
  if (abs < 1000) {
    if (abs < 10 && abs % 1 !== 0) return sign + abs.toFixed(1)
    return sign + Math.floor(abs).toLocaleString('en-US')
  }
  const exp = Math.min(SUFFIXES.length - 1, Math.floor(Math.log10(abs) / 3))
  const scaled = abs / 1000 ** exp
  const text =
    scaled >= 100 ? scaled.toFixed(0) : scaled >= 10 ? scaled.toFixed(1) : scaled.toFixed(digits)
  return `${sign}${text.replace(/\.0+$/, '')}${SUFFIXES[exp]}`
}

export function formatRate(value: number): string {
  return `${formatNumber(value, 1)}/sec`
}

export function depthKm(total: number): number {
  return Math.min(EARTH_RADIUS_KM, EARTH_RADIUS_KM * Math.sqrt(Math.max(0, total) / DEPTH_CORE_AT))
}

export function formatDepth(km: number): string {
  if (km < 1) return `${Math.max(0, Math.floor(km * 1000))} m`
  if (km < 100) return `${km.toFixed(1)} km`
  return `${km.toFixed(0)} km`
}

export function emptyBuildings(): Record<BuildingId, number> {
  return {
    fork: 0,
    bit: 0,
    auger: 0,
    brigade: 0,
    griddle: 0,
    press: 0,
    iron: 0,
    singularity: 0,
  }
}

export type WorldSave = {
  waffles: number
  totalWaffles: number
  buildings: Record<BuildingId, number>
  upgrades: UpgradeId[]
}

export type NewsItem = {
  id: number
  kicker: string
  headline: string
}

export type GameState = {
  waffles: number
  totalWaffles: number
  buildings: Record<BuildingId, number>
  upgrades: UpgradeId[]
  combo: number
  lastClickAt: number
  rushUntil: number
  muted: boolean
  seenHint: boolean
  worldId: WorldId
  unlockedWorlds: WorldId[]
  worldSaves: Partial<Record<WorldId, WorldSave>>
  patrolWins: number
  news: NewsItem[]
  newsSeq: number
}

export type Golden = { x: number; y: number; until: number }

export function worldById(id: WorldId): World {
  return WORLDS.find((world) => world.id === id) ?? WORLDS[0]
}

export function nextWorld(id: WorldId): World | undefined {
  const index = WORLDS.findIndex((world) => world.id === id)
  return WORLDS[index + 1]
}

export function worldIndex(id: WorldId): number {
  return Math.max(0, WORLDS.findIndex((world) => world.id === id))
}

export function gemMultiplier(id: WorldId): number {
  return WORLD_GEM_MULT ** worldIndex(id)
}

export function layersFor(world: World): Layer[] {
  return LAYERS.map((layer) =>
    layer.id === 'core' ? { ...layer, name: world.coreName, blurb: world.coreBlurb } : layer,
  )
}

export function initialState(): GameState {
  return {
    waffles: 0,
    totalWaffles: 0,
    buildings: emptyBuildings(),
    upgrades: [],
    combo: 0,
    lastClickAt: 0,
    rushUntil: 0,
    muted: false,
    seenHint: false,
    worldId: 'syrup',
    unlockedWorlds: ['syrup'],
    worldSaves: {},
    patrolWins: 0,
    news: [
      {
        id: 1,
        kicker: 'WNN',
        headline: 'Breakfast thieves spotted in high orbit. Arcade patrols arrive every seven minutes. Bigger hauls mean bigger loot.',
      },
    ],
    newsSeq: 1,
  }
}

function inferUnlocked(worldId: WorldId, extra: WorldId[] = []): WorldId[] {
  const idx = worldIndex(worldId)
  const chain = WORLDS.slice(0, idx + 1).map((world) => world.id)
  return Array.from(new Set<WorldId>(['syrup', ...chain, ...extra]))
}

const RETIRED_NEWS = /\bCPU\b|fleet|escort|hull|warship|\bships?\b|Cabinets drop|difficulty/i

export function loadState(): GameState {
  const fresh = initialState()
  try {
    const raw =
      localStorage.getItem(SAVE_KEY) ??
      localStorage.getItem('waffleson-web-v3') ??
      localStorage.getItem('waffleson-web-v2')
    if (!raw) return fresh
    const parsed = JSON.parse(raw) as Partial<GameState>
    const worldId = parsed.worldId ?? 'syrup'
    const cleanNews = (parsed.news ?? [])
      .filter((item) => !RETIRED_NEWS.test(`${item.kicker} ${item.headline}`))
      .slice(0, 10)
    if (cleanNews.length === 0) cleanNews.push(...fresh.news)
    return {
      ...fresh,
      ...parsed,
      buildings: { ...fresh.buildings, ...parsed.buildings },
      upgrades: parsed.upgrades ?? [],
      combo: 0,
      worldId,
      unlockedWorlds: inferUnlocked(worldId, parsed.unlockedWorlds ?? []),
      worldSaves: parsed.worldSaves ?? {},
      patrolWins: parsed.patrolWins ?? 0,
      news: cleanNews,
      newsSeq: parsed.newsSeq ?? parsed.news?.length ?? 1,
    }
  } catch {
    return fresh
  }
}

export function saveState(state: GameState) {
  localStorage.setItem(
    SAVE_KEY,
    JSON.stringify({
      waffles: state.waffles,
      totalWaffles: state.totalWaffles,
      buildings: state.buildings,
      upgrades: state.upgrades,
      rushUntil: state.rushUntil,
      muted: state.muted,
      seenHint: state.seenHint,
      worldId: state.worldId,
      unlockedWorlds: state.unlockedWorlds,
      worldSaves: state.worldSaves,
      patrolWins: state.patrolWins,
      news: state.news,
      newsSeq: state.newsSeq,
    }),
  )
}

export function buildingCost(id: BuildingId, owned: number, qty: number): number {
  const def = BUILDINGS.find((b) => b.id === id)!
  let total = 0
  for (let i = 0; i < qty; i++) total += def.baseCost * COST_GROWTH ** (owned + i)
  return total
}

export function currentLayer(total: number, world: World = WORLDS[0]): Layer {
  const km = depthKm(total)
  const layers = layersFor(world)
  return [...layers].reverse().find((l) => km >= l.minKm) ?? layers[0]
}

export function nextLayer(total: number, world: World = WORLDS[0]): Layer | undefined {
  const layers = layersFor(world)
  const cur = currentLayer(total, world)
  return layers[layers.findIndex((l) => l.id === cur.id) + 1]
}

export function atCore(state: GameState): boolean {
  return currentLayer(state.totalWaffles, worldById(state.worldId)).id === 'core'
}

export function canLaunch(state: GameState): boolean {
  const next = nextWorld(state.worldId)
  if (!next || state.unlockedWorlds.includes(next.id)) return false
  return atCore(state) && state.waffles >= LAUNCH_COST
}

export function purchaseCount(state: GameState): number {
  const rigs = BUILDINGS.reduce((sum, building) => sum + state.buildings[building.id], 0)
  return rigs + state.upgrades.length
}

export function factoryCount(state: GameState): number {
  return Math.floor(purchaseCount(state) / FACTORY_EVERY)
}

export function canVisit(state: GameState, dest: WorldId): boolean {
  if (dest === state.worldId) return false
  if (state.unlockedWorlds.includes(dest)) return true
  return canLaunch(state) && nextWorld(state.worldId)?.id === dest
}

export function snapshotWorld(state: GameState): WorldSave {
  return {
    waffles: state.waffles,
    totalWaffles: state.totalWaffles,
    buildings: { ...state.buildings },
    upgrades: [...state.upgrades],
  }
}

export function emptyWorldSave(): WorldSave {
  return {
    waffles: 0,
    totalWaffles: 0,
    buildings: emptyBuildings(),
    upgrades: [],
  }
}

export function travelTo(state: GameState, dest: WorldId): GameState {
  if (!canVisit(state, dest)) return state
  const maiden = !state.unlockedWorlds.includes(dest)
  if (maiden && state.waffles < LAUNCH_COST) return state
  const paid: GameState = maiden ? { ...state, waffles: state.waffles - LAUNCH_COST } : state
  const unlocked = maiden ? [...state.unlockedWorlds, dest] : state.unlockedWorlds
  const packed = {
    ...paid.worldSaves,
    [paid.worldId]: snapshotWorld(paid),
  }
  const incoming = packed[dest] ?? emptyWorldSave()
  return {
    ...paid,
    worldId: dest,
    unlockedWorlds: unlocked,
    worldSaves: packed,
    waffles: incoming.waffles,
    totalWaffles: incoming.totalWaffles,
    buildings: { ...emptyBuildings(), ...incoming.buildings },
    upgrades: [...incoming.upgrades],
    combo: 0,
    lastClickAt: 0,
    rushUntil: 0,
    seenHint: true,
  }
}

export function toolForStage(stage: number): { kind: 'spatula' | 'drill'; label: string } {
  if (stage <= 1) return { kind: 'spatula', label: stage === 0 ? 'Breakfast spatula' : 'Heavy spatula' }
  if (stage === 2) return { kind: 'drill', label: 'Hand drill' }
  if (stage === 3) return { kind: 'drill', label: 'Magma drill' }
  return { kind: 'drill', label: 'Core drill' }
}

export function derived(state: GameState, now = Date.now()) {
  let clickAdd = 0
  let wpsMul = 1
  let crit = 0
  const buildingMul = emptyBuildings()
  for (const id of Object.keys(buildingMul) as BuildingId[]) buildingMul[id] = 1
  for (const upgrade of UPGRADES.filter((u) => state.upgrades.includes(u.id))) {
    clickAdd += upgrade.clickAdd ?? 0
    wpsMul *= upgrade.wpsMul ?? 1
    crit += upgrade.crit ?? 0
    if (upgrade.buildingMul) {
      for (const [id, mul] of Object.entries(upgrade.buildingMul)) {
        buildingMul[id as BuildingId] *= mul
      }
    }
  }
  const rushing = now < state.rushUntil
  const rush = rushing ? RUSH_MULT : 1
  const gemMul = gemMultiplier(state.worldId)
  const perBuilding = emptyBuildings()
  let wps = 0
  for (const b of BUILDINGS) {
    const each = b.baseWps * buildingMul[b.id] * wpsMul * rush * gemMul
    perBuilding[b.id] = each
    wps += each * state.buildings[b.id]
  }
  const factories = factoryCount(state)
  const factoryWps = factories * FACTORY_WPS * wpsMul * rush * gemMul
  wps += factoryWps
  const buys = purchaseCount(state)
  return {
    clickAdd,
    wps,
    clickPower: scaledClick(buys, clickAdd, rush, gemMul),
    rushing,
    crit,
    gemMul,
    perBuilding,
    factories,
    factoryWps,
    buys,
    nextFactoryIn: factories * FACTORY_EVERY + FACTORY_EVERY - buys,
  }
}

export function visibleUpgrades(state: GameState): Upgrade[] {
  return UPGRADES.filter((u) => {
    if (state.upgrades.includes(u.id)) return false
    if (u.requires && state.buildings[u.requires.building] < u.requires.count) return false
    return state.totalWaffles >= u.cost * 0.06
  })
}

export function patrolWave() {
  return { aliens: 5, need: 3, seconds: 18 }
}

export const ARCADES = ['invaders', 'breakout', 'meteors'] as const
export type ArcadeKind = (typeof ARCADES)[number]

export function arcadeKind(visits: number): ArcadeKind {
  return ARCADES[visits % 3]
}

export function arcadeName(kind: ArcadeKind): string {
  if (kind === 'breakout') return 'Syrup Breakout'
  if (kind === 'meteors') return 'Meteor Batter'
  return 'Waffle Invaders'
}

export function patrolTheft(wallet: number, total: number): number {
  if (wallet <= 0) return 0
  const intended = Math.min(CLICK_CAP, Math.max(1, Math.floor(lootTier(total) * 3)))
  return Math.min(wallet, intended)
}

export function patrolReward(killed: number, total: number): number {
  const wave = patrolWave()
  const share = Math.min(1, Math.max(0.25, killed / wave.need))
  return Math.min(CLICK_CAP, Math.max(8, Math.floor(lootTier(total) * 5 * share)))
}

export function pushNews(state: GameState, kicker: string, headline: string): GameState {
  const id = state.newsSeq + 1
  return {
    ...state,
    newsSeq: id,
    news: [{ id, kicker, headline }, ...state.news].slice(0, 10),
  }
}
