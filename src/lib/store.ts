import { computed, reactive, watch } from 'vue'
import { CROP_BY_ID, cropDuration, FAMILIES, kasMonths, NO_ROTATION, type Crop } from './crops'
import { absWeek, isoWeek, monthStartWeek, weekToMonth, WEEKS_PER_YEAR } from './time'

export const GARDEN = { width: 630, height: 410 } // cm

export interface Rect { x: number; y: number; w: number; h: number }

export interface Bed extends Rect {
  id: string
  name: string
  /** The (unheated) greenhouse: drawn next to the garden, not inside it. */
  greenhouse?: boolean
}

/** Gap between the garden and the greenhouse on the plan (cm). */
export const KAS_GAP = 60
export const KAS_MAX = { w: 400, h: GARDEN.height }
/** An unheated greenhouse lets crops go in ~1 month earlier and harvest ~4 weeks longer. */
const KAS_EXTRA_WEEKS = 4

/** A crop occupying part of a bed for a period. x/y are relative to the bed. */
export interface Planting extends Rect {
  id: string
  bedId: string
  cropId: string
  /** Absolute week the crop goes into the bed (sown or planted out). */
  start: number
  /** Absolute week the spot is cleared again. */
  end: number
}

export type Soil = 'klei' | 'normaal'

interface PersistedState {
  beds: Bed[]
  plantings: Planting[]
  soil?: Soil
}

export type Selection = { kind: 'bed' | 'planting'; id: string } | null

const STORAGE_KEY = 'vegz-garden:v1'
const today = new Date()

function defaultBeds(): Bed[] {
  return [1, 2, 3, 4].map((n) => ({
    id: crypto.randomUUID(),
    name: `Bed ${n}`,
    x: 30 + (n - 1) * 150,
    y: 40,
    w: 120,
    h: 330,
  }))
}

function withGreenhouse(data: PersistedState): PersistedState {
  if (!data.beds.some((b) => b.greenhouse)) {
    data.beds.push({ id: crypto.randomUUID(), name: 'Kas', greenhouse: true, x: GARDEN.width + KAS_GAP, y: 0, w: 185, h: 250 })
  }
  return data
}

function load(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return withGreenhouse(JSON.parse(raw) as PersistedState)
  } catch {
    /* corrupt or unavailable storage: start fresh */
  }
  return withGreenhouse({ beds: defaultBeds(), plantings: [] })
}

const loaded = load()

export const state = reactive({
  beds: loaded.beds,
  plantings: loaded.plantings,
  soil: loaded.soil ?? ('klei' as Soil),
  year: today.getFullYear(),
  week: isoWeek(today),
  selection: null as Selection,
  armedCropId: null as string | null,
  showWholeYear: false,
})

watch(
  () => ({ beds: state.beds, plantings: state.plantings, soil: state.soil }),
  (value) => localStorage.setItem(STORAGE_KEY, JSON.stringify(value)),
  { deep: true },
)

export const greenhouse = computed(() => state.beds.find((b) => b.greenhouse)!)

export const currentAbs = computed(() => absWeek(state.year, state.week))
export const todayAbs = absWeek(today.getFullYear(), isoWeek(today))

export const cropOf = (p: Planting): Crop => CROP_BY_ID[p.cropId]
export const bedOf = (p: Planting): Bed | undefined => state.beds.find((b) => b.id === p.bedId)

/** Keep plantings inside their bed when the bed shrinks: trim them first, only shift when needed. */
function fitPlantingsInBeds() {
  for (const p of state.plantings) {
    const bed = bedOf(p)
    if (!bed) continue
    p.w = Math.max(5, Math.min(p.w, bed.w - p.x))
    p.h = Math.max(5, Math.min(p.h, bed.h - p.y))
    p.x = Math.max(0, Math.min(p.x, bed.w - p.w))
    p.y = Math.max(0, Math.min(p.y, bed.h - p.h))
  }
}
watch(() => state.beds.map((b) => `${b.w}x${b.h}`).join(), fitPlantingsInBeds, { immediate: true })

export const isActiveAt = (p: Planting, abs: number) => p.start <= abs && abs <= p.end

export const overlapsYear = (p: Planting, year: number) =>
  p.start <= absWeek(year, WEEKS_PER_YEAR) && p.end >= absWeek(year, 1)

function plantGrid(p: Planting) {
  const c = cropOf(p)
  return { cols: Math.max(1, Math.floor(p.w / c.spacing)), rows: Math.max(1, Math.floor(p.h / c.rowSpacing)) }
}

export function plantCount(p: Planting): number {
  const { cols, rows } = plantGrid(p)
  return cols * rows
}

/** Distance (cm) from each bed edge to the outermost plants of a planting. */
export function edgeDistances(p: Planting, bed: Bed) {
  const c = cropOf(p)
  const { cols, rows } = plantGrid(p)
  const left = p.x + c.spacing / 2
  const top = p.y + c.rowSpacing / 2
  return {
    left,
    top,
    right: bed.w - (left + (cols - 1) * c.spacing),
    bottom: bed.h - (top + (rows - 1) * c.rowSpacing),
  }
}

const rectsIntersect = (a: Rect, b: Rect) =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h

const timeOverlap = (a: Planting, b: Planting) => a.start <= b.end && b.start <= a.end

// ---------- mutations ----------

export function select(sel: Selection) {
  state.selection = sel
}

export function addBed() {
  const number = state.beds.filter((b) => !b.greenhouse).length + 1
  const bed: Bed = { id: crypto.randomUUID(), name: `Bed ${number}`, x: 20, y: 20, w: 120, h: 120 }
  state.beds.push(bed)
  select({ kind: 'bed', id: bed.id })
}

export function removeBed(id: string) {
  state.beds = state.beds.filter((b) => b.id !== id)
  state.plantings = state.plantings.filter((p) => p.bedId !== id)
  select(null)
}

export function addPlanting(cropId: string, bed: Bed, gardenX: number, gardenY: number) {
  const crop = CROP_BY_ID[cropId]
  const w = Math.min(bed.w, Math.max(30, crop.spacing * 2))
  const h = Math.min(bed.h, Math.max(30, crop.rowSpacing * 2))
  const snap = (v: number) => Math.round(v / 5) * 5
  const x = Math.min(Math.max(0, snap(gardenX - bed.x - w / 2)), bed.w - w)
  const y = Math.min(Math.max(0, snap(gardenY - bed.y - h / 2)), bed.h - h)
  const planting: Planting = {
    id: crypto.randomUUID(),
    bedId: bed.id,
    cropId,
    x, y, w, h,
    start: currentAbs.value,
    end: currentAbs.value + cropDuration(crop) + (bed.greenhouse ? KAS_EXTRA_WEEKS : 0) - 1,
  }
  state.plantings.push(planting)
  select({ kind: 'planting', id: planting.id })
}

/** Plan a follow-up crop on the same spot, starting right after this one. */
export function addSuccession(p: Planting, cropId: string) {
  const crop = CROP_BY_ID[cropId]
  const extra = bedOf(p)?.greenhouse ? KAS_EXTRA_WEEKS : 0
  const next: Planting = { ...p, id: crypto.randomUUID(), cropId, start: p.end + 1, end: p.end + cropDuration(crop) + extra }
  state.plantings.push(next)
  select({ kind: 'planting', id: next.id })
  goToAbs(next.start)
}

export function removePlanting(id: string) {
  state.plantings = state.plantings.filter((p) => p.id !== id)
  select(null)
}

export function goToAbs(abs: number) {
  state.year = Math.floor((abs - 1) / WEEKS_PER_YEAR)
  state.week = abs - state.year * WEEKS_PER_YEAR
}

// ---------- advice ----------

export interface Advice { level: 'warn' | 'good' | 'tip'; text: string }

export function adviceFor(p: Planting): Advice[] {
  const crop = cropOf(p)
  const out: Advice[] = []
  const neighbours = state.plantings.filter((o) => o.id !== p.id && o.bedId === p.bedId && timeOverlap(o, p))

  for (const o of neighbours) {
    if (rectsIntersect(o, p)) out.push({ level: 'warn', text: `Overlapt met ${cropOf(o).name} in dezelfde periode` })
  }

  const seen = new Set<string>()
  for (const o of neighbours) {
    const other = cropOf(o)
    if (seen.has(other.id)) continue
    seen.add(other.id)
    if (crop.bad.includes(other.id) || other.bad.includes(crop.id)) {
      out.push({ level: 'warn', text: `Slechte buren: ${other.name}` })
    } else if (crop.good.includes(other.id) || other.good.includes(crop.id)) {
      out.push({ level: 'good', text: `Goede buren: ${other.name}` })
    }
  }

  if (!NO_ROTATION.includes(crop.family)) {
    const earlier = state.plantings.find(
      (o) =>
        o.bedId === p.bedId &&
        o.id !== p.id &&
        o.end < p.start &&
        p.start - o.end < WEEKS_PER_YEAR * 3 &&
        cropOf(o).family === crop.family &&
        rectsIntersect(o, p),
    )
    if (earlier) {
      out.push({
        level: 'warn',
        text: `Vruchtwisseling: hier stond eerder ${cropOf(earlier).name} (${FAMILIES[crop.family]}). Wacht liefst 3 jaar.`,
      })
    }
  }

  const startMonth = weekToMonth(((p.start - 1) % WEEKS_PER_YEAR) + 1)
  const inKas = bedOf(p)?.greenhouse ?? false
  const inSeason = inKas ? kasMonths(crop) : [...crop.sowOutdoors, ...crop.plantOut]
  if (inSeason.length && !inSeason.includes(startMonth)) {
    out.push({
      level: 'warn',
      text: `${crop.name} gaat normaal niet in deze maand de grond in${inKas ? ', ook niet in de kas' : ''}`,
    })
  }

  if (state.soil === 'klei' && !inKas) {
    const week = ((p.start - 1) % WEEKS_PER_YEAR) + 1
    if (isEarlyClaySpring(crop, startMonth, week)) {
      out.push({ level: 'warn', text: 'Kleigrond is nu vaak nog koud en nat: zaai of plant liefst 1–2 weken later.' })
    }
    if (crop.clayTip) out.push({ level: 'tip', text: `Op klei: ${crop.clayTip}` })
  }

  return out
}

/** First two weeks of a crop's spring outdoor window (feb–mei): too early on cold, wet clay. */
function isEarlyClaySpring(crop: Crop, month: number, week: number): boolean {
  const outdoor = [...crop.sowOutdoors, ...crop.plantOut]
  const prev = ((month + 10) % 12) + 1
  const windowStart = outdoor.includes(month) && !outdoor.includes(prev)
  return windowStart && month >= 2 && month <= 5 && week < monthStartWeek(month) + 2
}

// ---------- tasks ----------

export interface Task { abs: number; label: string; planting: Planting }

export function tasksBetween(from: number, to: number): Task[] {
  const tasks: Task[] = []
  for (const p of state.plantings) {
    const c = cropOf(p)
    const events: Task[] = []
    if (c.preSowWeeks > 0) {
      events.push({ abs: p.start - c.preSowWeeks, label: `${c.name} voorzaaien (binnen of in de kas)`, planting: p })
      events.push({ abs: p.start, label: `${c.name} uitplanten`, planting: p })
    } else {
      events.push({ abs: p.start, label: `${c.name} zaaien / poten`, planting: p })
    }
    events.push({ abs: p.start + c.weeksToHarvest, label: `${c.name} ${c.family === 'bloem' ? 'begin bloei' : 'begin oogst'}`, planting: p })
    events.push({ abs: p.end + 1, label: `${c.name} opruimen, plek komt vrij`, planting: p })
    tasks.push(...events.filter((e) => e.abs >= from && e.abs <= to))
  }
  return tasks.sort((a, b) => a.abs - b.abs)
}

// ---------- import / export ----------

export function exportJson(): string {
  return JSON.stringify({ beds: state.beds, plantings: state.plantings, soil: state.soil }, null, 2)
}

export function importJson(json: string) {
  const data = JSON.parse(json) as PersistedState
  if (!Array.isArray(data.beds) || !Array.isArray(data.plantings)) throw new Error('Ongeldig bestand')
  const withKas = withGreenhouse(data)
  state.beds = withKas.beds
  state.plantings = withKas.plantings
  if (data.soil) state.soil = data.soil
  select(null)
}
