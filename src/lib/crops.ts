export type Family =
  | 'nachtschade'
  | 'kool'
  | 'ui'
  | 'vlinderbloemig'
  | 'schermbloemig'
  | 'komkommer'
  | 'composiet'
  | 'ganzevoet'
  | 'overig'
  | 'bloem'

/** Families excluded from crop-rotation warnings. */
export const NO_ROTATION: Family[] = ['overig', 'bloem']

export const FAMILIES: Record<Family, string> = {
  bloem: 'Bloemen',
  nachtschade: 'Nachtschadefamilie',
  kool: 'Koolfamilie',
  ui: 'Uienfamilie',
  vlinderbloemig: 'Vlinderbloemigen',
  schermbloemig: 'Schermbloemigen',
  komkommer: 'Komkommerfamilie',
  composiet: 'Composieten',
  ganzevoet: 'Ganzenvoetfamilie',
  overig: 'Overig',
}

export interface Crop {
  id: string
  name: string
  emoji: string
  color: string
  family: Family
  /** Distance between plants in the row (cm). */
  spacing: number
  /** Distance between rows (cm). */
  rowSpacing: number
  sowIndoors: number[]
  sowOutdoors: number[]
  plantOut: number[]
  harvest: number[]
  /** Weeks of indoor pre-growing before planting out (0 = direct sowing). */
  preSowWeeks: number
  /** Weeks from sowing/planting in the bed until first harvest. */
  weeksToHarvest: number
  /** Weeks the harvest lasts. */
  harvestWeeks: number
  good: string[]
  bad: string[]
  /** Advice when growing on clay soil. */
  clayTip?: string
}

export const KINDS = [
  { key: 'sowIndoors', label: 'Binnen zaaien' },
  { key: 'sowOutdoors', label: 'Buiten zaaien / poten' },
  { key: 'plantOut', label: 'Uitplanten' },
  { key: 'kas', label: 'In de kas' },
  { key: 'harvest', label: 'Oogsten / bloei' },
] as const

export type KindKey = (typeof KINDS)[number]['key']

const prevMonth = (m: number) => ((m + 10) % 12) + 1

/** Months a crop can go into the unheated greenhouse: the outdoor months plus one month earlier. */
export function kasMonths(crop: Crop): number[] {
  const outdoor = [...crop.sowOutdoors, ...crop.plantOut]
  return [...new Set([...outdoor, ...outdoor.map(prevMonth)])].sort((a, b) => a - b)
}

export function monthsFor(crop: Crop, kind: KindKey): number[] {
  return kind === 'kas' ? kasMonths(crop) : crop[kind]
}

const r = (from: number, to: number): number[] => {
  const out: number[] = []
  for (let m = from; ; m = (m % 12) + 1) {
    out.push(m)
    if (m === to) return out
  }
}

const ALLIUMS = ['ui', 'prei', 'knoflook', 'sjalot']
const BEANS = ['stamboon', 'stokboon', 'tuinboon', 'erwt', 'capucijner']

export const CROPS: Crop[] = [
  { id: 'tomaat', name: 'Tomaat', emoji: '🍅', color: '#d9483b', family: 'nachtschade', spacing: 50, rowSpacing: 70,
    sowIndoors: r(3, 4), sowOutdoors: [], plantOut: r(5, 6), harvest: r(7, 10), preSowWeeks: 8, weeksToHarvest: 10, harvestWeeks: 10,
    good: ['basilicum', 'wortel', 'peterselie', 'goudsbloem', 'ui', 'knoflook'], bad: ['aardappel', 'venkel', 'sluitkool', 'mais'] },
  { id: 'paprika', name: 'Paprika', emoji: '🫑', color: '#e0702d', family: 'nachtschade', spacing: 45, rowSpacing: 50,
    sowIndoors: r(2, 3), sowOutdoors: [], plantOut: r(5, 6), harvest: r(7, 10), preSowWeeks: 10, weeksToHarvest: 12, harvestWeeks: 8,
    good: ['basilicum', 'ui', 'wortel'], bad: ['venkel'] },
  { id: 'aardappel', name: 'Aardappel', emoji: '🥔', color: '#a8844f', family: 'nachtschade', spacing: 35, rowSpacing: 70,
    sowIndoors: [], sowOutdoors: r(4, 5), plantOut: [], harvest: r(6, 9), preSowWeeks: 0, weeksToHarvest: 12, harvestWeeks: 6,
    good: ['tuinboon', 'stamboon', 'goudsbloem', 'spinazie'], bad: ['tomaat', 'komkommer', 'pompoen', 'courgette'] },
  { id: 'courgette', name: 'Courgette', emoji: '🥒', color: '#4f8a3a', family: 'komkommer', spacing: 100, rowSpacing: 100,
    sowIndoors: r(4, 5), sowOutdoors: r(5, 6), plantOut: r(5, 6), harvest: r(7, 10), preSowWeeks: 4, weeksToHarvest: 8, harvestWeeks: 10,
    good: ['stamboon', 'stokboon', 'mais', 'goudsbloem'], bad: ['aardappel'] },
  { id: 'komkommer', name: 'Komkommer', emoji: '🥒', color: '#6fae4a', family: 'komkommer', spacing: 50, rowSpacing: 100,
    sowIndoors: r(4, 5), sowOutdoors: [], plantOut: r(5, 6), harvest: r(7, 9), preSowWeeks: 4, weeksToHarvest: 8, harvestWeeks: 8,
    good: ['stamboon', 'erwt', 'sla', 'mais'], bad: ['aardappel'] },
  { id: 'pompoen', name: 'Pompoen', emoji: '🎃', color: '#e8902a', family: 'komkommer', spacing: 150, rowSpacing: 150,
    sowIndoors: r(4, 5), sowOutdoors: [], plantOut: r(5, 6), harvest: r(9, 10), preSowWeeks: 4, weeksToHarvest: 16, harvestWeeks: 4,
    good: ['mais', 'stokboon'], bad: ['aardappel'] },
  { id: 'sla', name: 'Sla', emoji: '🥬', color: '#8cc152', family: 'composiet', spacing: 25, rowSpacing: 25,
    sowIndoors: r(2, 4), sowOutdoors: r(3, 8), plantOut: r(4, 9), harvest: r(5, 10), preSowWeeks: 4, weeksToHarvest: 6, harvestWeeks: 3,
    good: ['wortel', 'radijs', 'aardbei', 'ui', 'komkommer'], bad: ['peterselie'] },
  { id: 'andijvie', name: 'Andijvie', emoji: '🥬', color: '#a6c95a', family: 'composiet', spacing: 30, rowSpacing: 30,
    sowIndoors: r(5, 6), sowOutdoors: r(6, 7), plantOut: r(6, 8), harvest: r(8, 11), preSowWeeks: 4, weeksToHarvest: 10, harvestWeeks: 6,
    good: ['prei', 'venkel'], bad: [] },
  { id: 'spinazie', name: 'Spinazie', emoji: '🌿', color: '#3d7a3a', family: 'ganzevoet', spacing: 10, rowSpacing: 20,
    sowIndoors: [], sowOutdoors: [3, 4, 8, 9], plantOut: [], harvest: [4, 5, 6, 10, 11], preSowWeeks: 0, weeksToHarvest: 6, harvestWeeks: 4,
    good: ['aardbei', 'radijs', 'sluitkool', 'tuinboon'], bad: ['rode-biet', 'snijbiet'] },
  { id: 'rode-biet', name: 'Rode biet', emoji: '🟣', color: '#8e2a4a', family: 'ganzevoet', spacing: 10, rowSpacing: 30,
    sowIndoors: [], sowOutdoors: r(4, 7), plantOut: [], harvest: r(7, 10), preSowWeeks: 0, weeksToHarvest: 12, harvestWeeks: 8,
    good: ['ui', 'sla', 'sluitkool', 'koolrabi'], bad: ['stokboon', 'spinazie'] },
  { id: 'snijbiet', name: 'Snijbiet', emoji: '🌈', color: '#c44569', family: 'ganzevoet', spacing: 30, rowSpacing: 40,
    sowIndoors: [], sowOutdoors: r(4, 7), plantOut: [], harvest: r(6, 11), preSowWeeks: 0, weeksToHarvest: 8, harvestWeeks: 16,
    good: ['ui', 'sla', 'stamboon'], bad: ['spinazie'] },
  { id: 'wortel', name: 'Wortel', emoji: '🥕', color: '#f08a24', family: 'schermbloemig', spacing: 4, rowSpacing: 20,
    sowIndoors: [], sowOutdoors: r(3, 7), plantOut: [], harvest: r(6, 11), preSowWeeks: 0, weeksToHarvest: 12, harvestWeeks: 8,
    good: ['ui', 'prei', 'sla', 'tomaat', 'radijs', 'erwt'], bad: ['dille'] },
  { id: 'pastinaak', name: 'Pastinaak', emoji: '🥕', color: '#e8d8a8', family: 'schermbloemig', spacing: 10, rowSpacing: 30,
    sowIndoors: [], sowOutdoors: r(3, 5), plantOut: [], harvest: r(10, 2), preSowWeeks: 0, weeksToHarvest: 22, harvestWeeks: 12,
    good: ['ui', 'radijs'], bad: [] },
  { id: 'knolselderij', name: 'Knolselderij', emoji: '🥬', color: '#b7c99a', family: 'schermbloemig', spacing: 40, rowSpacing: 40,
    sowIndoors: r(2, 3), sowOutdoors: [], plantOut: r(5, 6), harvest: r(9, 11), preSowWeeks: 10, weeksToHarvest: 18, harvestWeeks: 8,
    good: ['prei', 'sluitkool', 'boerenkool', 'tomaat'], bad: [] },
  { id: 'venkel', name: 'Knolvenkel', emoji: '🌿', color: '#c9dca0', family: 'schermbloemig', spacing: 25, rowSpacing: 40,
    sowIndoors: [], sowOutdoors: r(6, 7), plantOut: [], harvest: r(8, 10), preSowWeeks: 0, weeksToHarvest: 12, harvestWeeks: 4,
    good: ['andijvie', 'sla'], bad: ['tomaat', 'paprika', 'stamboon', 'stokboon'] },
  { id: 'peterselie', name: 'Peterselie', emoji: '🌿', color: '#2f8f46', family: 'schermbloemig', spacing: 15, rowSpacing: 25,
    sowIndoors: [], sowOutdoors: r(3, 7), plantOut: [], harvest: r(5, 11), preSowWeeks: 0, weeksToHarvest: 10, harvestWeeks: 20,
    good: ['tomaat', 'ui', 'wortel'], bad: ['sla'] },
  { id: 'dille', name: 'Dille', emoji: '🌿', color: '#9cc06a', family: 'schermbloemig', spacing: 20, rowSpacing: 30,
    sowIndoors: [], sowOutdoors: r(4, 7), plantOut: [], harvest: r(6, 9), preSowWeeks: 0, weeksToHarvest: 8, harvestWeeks: 8,
    good: ['komkommer', 'sla', 'sluitkool'], bad: ['wortel', 'tomaat'] },
  { id: 'radijs', name: 'Radijs', emoji: '🔴', color: '#e05a7a', family: 'kool', spacing: 3, rowSpacing: 10,
    sowIndoors: [], sowOutdoors: r(3, 9), plantOut: [], harvest: r(4, 10), preSowWeeks: 0, weeksToHarvest: 4, harvestWeeks: 2,
    good: ['sla', 'wortel', 'spinazie', 'erwt', 'pastinaak'], bad: [] },
  { id: 'boerenkool', name: 'Boerenkool', emoji: '🥬', color: '#2e5e3e', family: 'kool', spacing: 50, rowSpacing: 60,
    sowIndoors: r(5, 6), sowOutdoors: [], plantOut: r(6, 7), harvest: r(10, 2), preSowWeeks: 6, weeksToHarvest: 16, harvestWeeks: 16,
    good: ['knolselderij', 'ui', 'aardappel', 'dille'], bad: ['aardbei', 'tomaat'] },
  { id: 'spruitkool', name: 'Spruitkool', emoji: '🥦', color: '#4a7a3a', family: 'kool', spacing: 60, rowSpacing: 60,
    sowIndoors: r(3, 4), sowOutdoors: [], plantOut: r(5, 6), harvest: r(10, 2), preSowWeeks: 6, weeksToHarvest: 20, harvestWeeks: 14,
    good: ['knolselderij', 'ui', 'dille'], bad: ['aardbei', 'tomaat'] },
  { id: 'broccoli', name: 'Broccoli', emoji: '🥦', color: '#3b8a4a', family: 'kool', spacing: 50, rowSpacing: 60,
    sowIndoors: r(3, 6), sowOutdoors: [], plantOut: r(4, 7), harvest: r(6, 10), preSowWeeks: 5, weeksToHarvest: 10, harvestWeeks: 4,
    good: ['knolselderij', 'ui', 'dille', 'rode-biet'], bad: ['aardbei', 'tomaat'] },
  { id: 'bloemkool', name: 'Bloemkool', emoji: '🥦', color: '#e9e4c9', family: 'kool', spacing: 50, rowSpacing: 60,
    sowIndoors: r(3, 5), sowOutdoors: [], plantOut: r(4, 6), harvest: r(7, 10), preSowWeeks: 6, weeksToHarvest: 12, harvestWeeks: 4,
    good: ['knolselderij', 'ui', 'dille'], bad: ['aardbei', 'tomaat'] },
  { id: 'sluitkool', name: 'Sluitkool (rood/wit)', emoji: '🥬', color: '#7b4a8a', family: 'kool', spacing: 50, rowSpacing: 60,
    sowIndoors: r(3, 4), sowOutdoors: [], plantOut: r(5, 6), harvest: r(8, 11), preSowWeeks: 6, weeksToHarvest: 16, harvestWeeks: 8,
    good: ['knolselderij', 'ui', 'dille', 'spinazie'], bad: ['aardbei', 'tomaat'] },
  { id: 'koolrabi', name: 'Koolrabi', emoji: '🥬', color: '#a59fd0', family: 'kool', spacing: 25, rowSpacing: 30,
    sowIndoors: r(3, 4), sowOutdoors: r(5, 7), plantOut: r(4, 8), harvest: r(6, 10), preSowWeeks: 4, weeksToHarvest: 8, harvestWeeks: 3,
    good: ['rode-biet', 'sla', 'ui'], bad: ['tomaat'] },
  { id: 'palmkool', name: 'Palmkool', emoji: '🥬', color: '#1f4a35', family: 'kool', spacing: 50, rowSpacing: 60,
    sowIndoors: r(4, 6), sowOutdoors: [], plantOut: r(5, 7), harvest: r(9, 2), preSowWeeks: 6, weeksToHarvest: 14, harvestWeeks: 18,
    good: ['knolselderij', 'ui', 'dille', 'rode-biet'], bad: ['aardbei', 'tomaat'] },
  { id: 'ui', name: 'Ui', emoji: '🧅', color: '#c9a25a', family: 'ui', spacing: 10, rowSpacing: 20,
    sowIndoors: [], sowOutdoors: r(3, 4), plantOut: [], harvest: r(7, 8), preSowWeeks: 0, weeksToHarvest: 16, harvestWeeks: 4,
    good: ['wortel', 'rode-biet', 'sla', 'aardbei', 'tomaat'], bad: BEANS },
  { id: 'sjalot', name: 'Sjalot', emoji: '🧅', color: '#b0745a', family: 'ui', spacing: 15, rowSpacing: 25,
    sowIndoors: [], sowOutdoors: r(2, 4), plantOut: [], harvest: r(7, 8), preSowWeeks: 0, weeksToHarvest: 16, harvestWeeks: 3,
    good: ['wortel', 'rode-biet', 'aardbei'], bad: BEANS },
  { id: 'prei', name: 'Prei', emoji: '🌱', color: '#5e9c6a', family: 'ui', spacing: 15, rowSpacing: 30,
    sowIndoors: r(2, 4), sowOutdoors: [], plantOut: r(5, 7), harvest: r(9, 3), preSowWeeks: 10, weeksToHarvest: 16, harvestWeeks: 20,
    good: ['wortel', 'knolselderij', 'aardbei', 'andijvie'], bad: BEANS },
  { id: 'knoflook', name: 'Knoflook', emoji: '🧄', color: '#ddd6c4', family: 'ui', spacing: 12, rowSpacing: 20,
    sowIndoors: [], sowOutdoors: [10, 11, 2, 3], plantOut: [], harvest: r(6, 7), preSowWeeks: 0, weeksToHarvest: 30, harvestWeeks: 4,
    good: ['tomaat', 'aardbei', 'wortel', 'rode-biet'], bad: BEANS },
  { id: 'stamboon', name: 'Stamboon', emoji: '🫘', color: '#6aa84f', family: 'vlinderbloemig', spacing: 10, rowSpacing: 40,
    sowIndoors: [], sowOutdoors: r(5, 7), plantOut: [], harvest: r(7, 9), preSowWeeks: 0, weeksToHarvest: 9, harvestWeeks: 6,
    good: ['aardappel', 'komkommer', 'mais', 'wortel', 'aardbei', 'courgette'], bad: [...ALLIUMS, 'venkel'] },
  { id: 'stokboon', name: 'Stokboon', emoji: '🫛', color: '#5a9440', family: 'vlinderbloemig', spacing: 20, rowSpacing: 60,
    sowIndoors: [], sowOutdoors: r(5, 6), plantOut: [], harvest: r(7, 9), preSowWeeks: 0, weeksToHarvest: 10, harvestWeeks: 8,
    good: ['mais', 'komkommer', 'pompoen', 'sla', 'courgette'], bad: [...ALLIUMS, 'rode-biet', 'venkel'] },
  { id: 'tuinboon', name: 'Tuinboon', emoji: '🫘', color: '#7da45a', family: 'vlinderbloemig', spacing: 15, rowSpacing: 40,
    sowIndoors: [], sowOutdoors: [2, 3, 4, 11], plantOut: [], harvest: r(6, 7), preSowWeeks: 0, weeksToHarvest: 14, harvestWeeks: 4,
    good: ['aardappel', 'spinazie', 'sla'], bad: ALLIUMS },
  { id: 'erwt', name: 'Erwt', emoji: '🫛', color: '#94c26a', family: 'vlinderbloemig', spacing: 5, rowSpacing: 40,
    sowIndoors: [], sowOutdoors: r(3, 5), plantOut: [], harvest: r(6, 7), preSowWeeks: 0, weeksToHarvest: 11, harvestWeeks: 4,
    good: ['wortel', 'radijs', 'komkommer', 'mais'], bad: ALLIUMS },
  { id: 'capucijner', name: 'Capucijner', emoji: '🫛', color: '#8a6d3b', family: 'vlinderbloemig', spacing: 5, rowSpacing: 50,
    sowIndoors: [], sowOutdoors: r(4, 5), plantOut: [], harvest: r(7, 9), preSowWeeks: 0, weeksToHarvest: 12, harvestWeeks: 6,
    good: ['wortel', 'radijs', 'komkommer', 'mais', 'aardappel'], bad: ALLIUMS },
  { id: 'mais', name: 'Maïs', emoji: '🌽', color: '#e8c547', family: 'overig', spacing: 30, rowSpacing: 60,
    sowIndoors: r(4, 5), sowOutdoors: [5], plantOut: r(5, 6), harvest: r(8, 9), preSowWeeks: 4, weeksToHarvest: 14, harvestWeeks: 4,
    good: ['stokboon', 'stamboon', 'pompoen', 'courgette', 'komkommer'], bad: ['tomaat'] },
  { id: 'aardbei', name: 'Aardbei', emoji: '🍓', color: '#e0405a', family: 'overig', spacing: 30, rowSpacing: 50,
    sowIndoors: [], sowOutdoors: [], plantOut: [3, 4, 8, 9], harvest: r(6, 7), preSowWeeks: 0, weeksToHarvest: 10, harvestWeeks: 6,
    good: ['ui', 'knoflook', 'prei', 'spinazie', 'sla', 'stamboon'], bad: ['sluitkool', 'boerenkool', 'spruitkool', 'broccoli', 'bloemkool'] },
  { id: 'zoete-aardappel', name: 'Zoete aardappel', emoji: '🍠', color: '#c0603a', family: 'overig', spacing: 40, rowSpacing: 75,
    sowIndoors: r(3, 4), sowOutdoors: [], plantOut: r(5, 6), harvest: r(9, 10), preSowWeeks: 8, weeksToHarvest: 16, harvestWeeks: 4,
    good: ['stamboon', 'basilicum'], bad: [] },
  { id: 'veldsla', name: 'Veldsla', emoji: '🌱', color: '#4e8f3a', family: 'overig', spacing: 5, rowSpacing: 15,
    sowIndoors: [], sowOutdoors: r(8, 10), plantOut: [], harvest: r(10, 3), preSowWeeks: 0, weeksToHarvest: 8, harvestWeeks: 16,
    good: ['ui', 'prei'], bad: [] },
  { id: 'basilicum', name: 'Basilicum', emoji: '🌿', color: '#3f9b5a', family: 'overig', spacing: 20, rowSpacing: 25,
    sowIndoors: r(3, 5), sowOutdoors: [], plantOut: r(5, 6), harvest: r(6, 9), preSowWeeks: 6, weeksToHarvest: 6, harvestWeeks: 12,
    good: ['tomaat', 'paprika'], bad: [] },
  { id: 'goudsbloem', name: 'Goudsbloem', emoji: '🌼', color: '#f2a516', family: 'composiet', spacing: 30, rowSpacing: 30,
    sowIndoors: [], sowOutdoors: r(4, 5), plantOut: [], harvest: r(6, 10), preSowWeeks: 0, weeksToHarvest: 8, harvestWeeks: 16,
    good: ['tomaat', 'aardappel', 'courgette'], bad: [] },

  // Bloemen: "harvest" = bloeiperiode
  { id: 'dahlia', name: 'Dahlia', emoji: '🌺', color: '#c2185b', family: 'bloem', spacing: 50, rowSpacing: 60,
    sowIndoors: r(3, 4), sowOutdoors: [], plantOut: r(5, 6), harvest: r(7, 10), preSowWeeks: 6, weeksToHarvest: 10, harvestWeeks: 14,
    good: [], bad: [] },
  { id: 'zonnebloem', name: 'Zonnebloem', emoji: '🌻', color: '#f5c518', family: 'bloem', spacing: 40, rowSpacing: 60,
    sowIndoors: [4], sowOutdoors: r(5, 6), plantOut: r(5, 6), harvest: r(7, 9), preSowWeeks: 3, weeksToHarvest: 12, harvestWeeks: 8,
    good: ['komkommer', 'mais'], bad: ['aardappel'] },
  { id: 'cosmos', name: 'Cosmea', emoji: '🌸', color: '#e57fb0', family: 'bloem', spacing: 40, rowSpacing: 40,
    sowIndoors: r(3, 4), sowOutdoors: [5], plantOut: r(5, 6), harvest: r(7, 10), preSowWeeks: 6, weeksToHarvest: 8, harvestWeeks: 14,
    good: ['tomaat', 'stamboon'], bad: [] },
  { id: 'zinnia', name: 'Zinnia', emoji: '💮', color: '#ef6c3a', family: 'bloem', spacing: 25, rowSpacing: 30,
    sowIndoors: [4], sowOutdoors: r(5, 6), plantOut: r(5, 6), harvest: r(7, 10), preSowWeeks: 4, weeksToHarvest: 9, harvestWeeks: 12,
    good: ['tomaat'], bad: [] },
  { id: 'afrikaantje', name: 'Afrikaantje', emoji: '🌼', color: '#f39c12', family: 'bloem', spacing: 25, rowSpacing: 25,
    sowIndoors: r(3, 4), sowOutdoors: [5], plantOut: r(5, 6), harvest: r(6, 10), preSowWeeks: 6, weeksToHarvest: 6, harvestWeeks: 16,
    good: ['tomaat', 'aardappel', 'sluitkool', 'boerenkool', 'wortel'], bad: [] },
  { id: 'oost-indische-kers', name: 'Oost-Indische kers', emoji: '🏵️', color: '#e8590c', family: 'bloem', spacing: 30, rowSpacing: 40,
    sowIndoors: [4], sowOutdoors: r(5, 6), plantOut: r(5, 6), harvest: r(6, 10), preSowWeeks: 4, weeksToHarvest: 8, harvestWeeks: 16,
    good: ['komkommer', 'courgette', 'pompoen', 'sluitkool', 'broccoli', 'tomaat'], bad: [] },
  { id: 'lathyrus', name: 'Lathyrus (siererwt)', emoji: '🪻', color: '#9c6ade', family: 'bloem', spacing: 15, rowSpacing: 40,
    sowIndoors: r(2, 3), sowOutdoors: r(3, 4), plantOut: r(4, 5), harvest: r(6, 8), preSowWeeks: 6, weeksToHarvest: 10, harvestWeeks: 8,
    good: ['erwt', 'stokboon'], bad: ALLIUMS },
  { id: 'gladiool', name: 'Gladiool', emoji: '🌷', color: '#d6336c', family: 'bloem', spacing: 15, rowSpacing: 30,
    sowIndoors: [], sowOutdoors: r(4, 5), plantOut: [], harvest: r(7, 9), preSowWeeks: 0, weeksToHarvest: 12, harvestWeeks: 6,
    good: [], bad: [] },
]

const CLAY_TIPS: Record<string, string> = {
  wortel: 'wortels worden snel kort of vertakt. Kies korte rassen (Parijse markt, Chantenay) of teel op een verhoogd bed met lossere grond.',
  pastinaak: 'wortels vertakken in zware grond. Maak de grond diep los of teel op een verhoogd bed.',
  knoflook: 'teentjes rotten snel in natte winterklei. Poot op een ruggetje, of wacht tot februari/maart.',
  dahlia: 'knollen rotten in natte klei. Rooi ze in oktober/november na de eerste nachtvorst.',
  gladiool: 'knollen rotten in natte klei. Rooi ze in oktober en bewaar ze droog en vorstvrij.',
}
for (const crop of CROPS) crop.clayTip = CLAY_TIPS[crop.id]

export const CROP_BY_ID: Record<string, Crop> = Object.fromEntries(CROPS.map((c) => [c.id, c]))

/** Default number of weeks a crop occupies its spot in the bed. */
export function cropDuration(crop: Crop): number {
  return crop.weeksToHarvest + crop.harvestWeeks
}
