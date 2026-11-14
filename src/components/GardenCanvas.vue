<script setup lang="ts">
import { computed, ref } from 'vue'
import { fromAbs } from '../lib/time'
import {
  GARDEN, KAS_MAX, greenhouse, state, currentAbs, cropOf, isActiveAt, overlapsYear, plantCount, adviceFor,
  addPlanting, edgeDistances, select, type Bed, type Planting, type Rect,
} from '../lib/store'

const svg = ref<SVGSVGElement | null>(null)
const MARGIN = 30

type DragKind = 'move' | 'resize'
interface Drag {
  kind: DragKind
  target: Rect
  bounds: { w: number; h: number }
  grid: number
  startX: number
  startY: number
  orig: Rect
}
let drag: Drag | null = null

function toGarden(e: { clientX: number; clientY: number }) {
  const el = svg.value!
  const pt = el.createSVGPoint()
  pt.x = e.clientX
  pt.y = e.clientY
  const p = pt.matrixTransform(el.getScreenCTM()!.inverse())
  return { x: p.x, y: p.y }
}

const bedAt = (x: number, y: number): Bed | undefined =>
  [...state.beds].reverse().find((b) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h)

function startDrag(e: PointerEvent, kind: DragKind, target: Rect, bounds: { w: number; h: number }, grid: number) {
  e.stopPropagation()
  const p = toGarden(e)
  drag = { kind, target, bounds, grid, startX: p.x, startY: p.y, orig: { ...target } }
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', endDrag, { once: true })
}

function onMove(e: PointerEvent) {
  if (!drag) return
  const p = toGarden(e)
  const snap = (v: number) => Math.round(v / drag!.grid) * drag!.grid
  const dx = p.x - drag.startX
  const dy = p.y - drag.startY
  const { target: t, orig: o, bounds } = drag
  if (drag.kind === 'move') {
    t.x = Math.min(Math.max(0, snap(o.x + dx)), bounds.w - t.w)
    t.y = Math.min(Math.max(0, snap(o.y + dy)), bounds.h - t.h)
  } else {
    t.w = Math.min(Math.max(drag.grid * 2, snap(o.w + dx)), bounds.w - t.x)
    t.h = Math.min(Math.max(drag.grid * 2, snap(o.h + dy)), bounds.h - t.y)
  }
}

function endDrag() {
  drag = null
  window.removeEventListener('pointermove', onMove)
}

function onBedDown(e: PointerEvent, bed: Bed) {
  if (state.armedCropId) {
    const p = toGarden(e)
    addPlanting(state.armedCropId, bed, p.x, p.y)
    e.stopPropagation()
    return
  }
  select({ kind: 'bed', id: bed.id })
  if (bed.greenhouse) e.stopPropagation()
  else startDrag(e, 'move', bed, GARDEN_BOUNDS, 10)
}

const resizeBounds = (bed: Bed) =>
  bed.greenhouse ? { w: bed.x + KAS_MAX.w, h: KAS_MAX.h } : GARDEN_BOUNDS

function onPlantingDown(e: PointerEvent, p: Planting, bed: Bed) {
  if (state.armedCropId) return onBedDown(e, bed)
  select({ kind: 'planting', id: p.id })
  startDrag(e, 'move', p, bed, 5)
}

function onDrop(e: DragEvent) {
  const cropId = e.dataTransfer?.getData('text/crop')
  if (!cropId) return
  const p = toGarden(e)
  const bed = bedAt(p.x, p.y)
  if (bed) addPlanting(cropId, bed, p.x, p.y)
}

const GARDEN_BOUNDS = { w: GARDEN.width, h: GARDEN.height }

const plantingsByBed = computed(() => {
  const map = new Map<string, { active: Planting[]; ghosts: Planting[] }>()
  for (const bed of state.beds) map.set(bed.id, { active: [], ghosts: [] })
  for (const p of state.plantings) {
    const entry = map.get(p.bedId)
    if (!entry) continue
    if (isActiveAt(p, currentAbs.value)) entry.active.push(p)
    else if (state.showWholeYear && overlapsYear(p, state.year)) entry.ghosts.push(p)
  }
  return map
})

/** Measurement lines from the bed edges to the outermost plants of a planting. */
function dimensions(p: Planting, bed: Bed) {
  const d = edgeDistances(p, bed)
  const lastX = bed.w - d.right
  const lastY = bed.h - d.bottom
  return [
    { x1: 0, y1: d.top, x2: d.left, y2: d.top, cm: d.left },
    { x1: lastX, y1: d.top, x2: bed.w, y2: d.top, cm: d.right },
    { x1: d.left, y1: 0, x2: d.left, y2: d.top, cm: d.top },
    { x1: d.left, y1: lastY, x2: d.left, y2: bed.h, cm: d.bottom },
  ].filter((l) => l.cm > 0)
}

const hasWarning = (p: Planting) => adviceFor(p).some((a) => a.level === 'warn')
const isSelected = (kind: 'bed' | 'planting', id: string) =>
  state.selection?.kind === kind && state.selection.id === id

const gridLines = computed(() => {
  const xs: number[] = []
  const ys: number[] = []
  for (let x = 0; x <= GARDEN.width; x += 10) xs.push(x)
  for (let y = 0; y <= GARDEN.height; y += 10) ys.push(y)
  return { xs, ys }
})
</script>

<template>
  <svg
    ref="svg"
    class="garden"
    :class="{ armed: state.armedCropId }"
    :viewBox="`${-MARGIN} ${-MARGIN} ${greenhouse.x + greenhouse.w + MARGIN * 2} ${GARDEN.height + MARGIN * 2}`"
    @pointerdown="select(null)"
    @dragover.prevent
    @drop.prevent="onDrop"
  >
    <defs>
      <pattern
        v-for="p in state.plantings"
        :id="`pat-${p.id}`"
        :key="p.id"
        patternUnits="userSpaceOnUse"
        :x="p.x"
        :y="p.y"
        :width="cropOf(p).spacing"
        :height="cropOf(p).rowSpacing"
      >
        <circle
          :cx="cropOf(p).spacing / 2"
          :cy="cropOf(p).rowSpacing / 2"
          :r="Math.max(1, Math.min(cropOf(p).spacing, cropOf(p).rowSpacing) * 0.35)"
          :fill="cropOf(p).color"
        />
      </pattern>
    </defs>

    <!-- grond + raster -->
    <rect :width="GARDEN.width" :height="GARDEN.height" class="soil" />
    <g class="grid">
      <line v-for="x in gridLines.xs" :key="`x${x}`" :x1="x" :x2="x" y1="0" :y2="GARDEN.height" :class="{ major: x % 50 === 0 }" />
      <line v-for="y in gridLines.ys" :key="`y${y}`" :y1="y" :y2="y" x1="0" :x2="GARDEN.width" :class="{ major: y % 50 === 0 }" />
    </g>

    <!-- linialen -->
    <g class="ruler">
      <text v-for="x in gridLines.xs.filter((v) => v % 50 === 0)" :key="`rx${x}`" :x="x" y="-10">{{ x }}</text>
      <text v-for="y in gridLines.ys.filter((v) => v % 50 === 0)" :key="`ry${y}`" x="-8" :y="y + 3" text-anchor="end">{{ y }}</text>
      <text :x="GARDEN.width" :y="GARDEN.height + 20" text-anchor="end">{{ GARDEN.width }} × {{ GARDEN.height }} cm</text>
    </g>

    <!-- bedden -->
    <g v-for="bed in state.beds" :key="bed.id" :transform="`translate(${bed.x} ${bed.y})`">
      <rect
        :width="bed.w"
        :height="bed.h"
        rx="3"
        class="bed"
        :class="{ selected: isSelected('bed', bed.id), greenhouse: bed.greenhouse }"
        @pointerdown="onBedDown($event, bed)"
      />
      <text x="4" y="-4" class="bed-label">
        {{ bed.greenhouse ? '🏡 ' : '' }}{{ bed.name }} · {{ bed.w }}×{{ bed.h }}{{ bed.greenhouse ? ' · onverwarmd' : '' }}
      </text>

      <g v-for="p in plantingsByBed.get(bed.id)?.ghosts" :key="`g${p.id}`" class="ghost">
        <rect :x="p.x" :y="p.y" :width="p.w" :height="p.h" rx="2" :fill="cropOf(p).color" />
        <text :x="p.x + 3" :y="p.y + 10">{{ cropOf(p).emoji }} {{ cropOf(p).name }}</text>
        <text :x="p.x + 3" :y="p.y + 19" class="weeks">wk {{ fromAbs(p.start).week }}–{{ fromAbs(p.end).week }}</text>
      </g>

      <g
        v-for="p in plantingsByBed.get(bed.id)?.active"
        :key="p.id"
        class="planting"
        :class="{ selected: isSelected('planting', p.id), warn: hasWarning(p) }"
        @pointerdown="onPlantingDown($event, p, bed)"
      >
        <rect :x="p.x" :y="p.y" :width="p.w" :height="p.h" rx="2" class="planting-bg" :stroke="cropOf(p).color" />
        <rect :x="p.x" :y="p.y" :width="p.w" :height="p.h" rx="2" :fill="`url(#pat-${p.id})`" class="planting-dots" />
        <text :x="p.x + 3" :y="p.y + 11" class="planting-label">
          {{ cropOf(p).emoji }} {{ cropOf(p).name }} ({{ plantCount(p) }})
        </text>
        <rect
          v-if="isSelected('planting', p.id)"
          :x="p.x + p.w - 7" :y="p.y + p.h - 7" width="9" height="9"
          class="handle"
          @pointerdown="startDrag($event, 'resize', p, bed, 5)"
        />
        <g v-if="isSelected('planting', p.id)" class="dims">
          <g v-for="(l, i) in dimensions(p, bed)" :key="i">
            <line :x1="l.x1" :y1="l.y1" :x2="l.x2" :y2="l.y2" />
            <text :x="(l.x1 + l.x2) / 2" :y="(l.y1 + l.y2) / 2 - 2">{{ Math.round(l.cm) }}</text>
          </g>
        </g>
      </g>

      <rect
        v-if="isSelected('bed', bed.id)"
        :x="bed.w - 7" :y="bed.h - 7" width="10" height="10"
        class="handle"
        @pointerdown="startDrag($event, 'resize', bed, resizeBounds(bed), 10)"
      />
    </g>
  </svg>
</template>

<style scoped>
.garden {
  width: 100%;
  height: 100%;
  user-select: none;
  touch-action: none;
}
.garden.armed .bed,
.garden.armed .planting { cursor: copy; }
.soil { fill: var(--soil); }
.grid line { stroke: var(--grid); stroke-width: 0.3; }
.grid line.major { stroke: var(--grid-major); stroke-width: 0.6; }
.ruler text { font-size: 9px; fill: var(--muted); text-anchor: middle; }
.bed {
  fill: var(--bed);
  stroke: var(--bed-edge);
  stroke-width: 2;
  cursor: move;
}
.bed.greenhouse {
  fill: var(--kas);
  stroke: var(--kas-edge);
  stroke-dasharray: 6 3;
  cursor: default;
}
.bed.selected { stroke: var(--accent); stroke-width: 3; }
.bed-label { font-size: 9px; fill: var(--ink); font-weight: 600; pointer-events: none; }
.planting { cursor: move; }
.planting-bg { fill: rgb(255 255 255 / 0.55); stroke-width: 1.5; }
.planting-dots { pointer-events: none; }
.planting.warn .planting-bg { stroke: var(--warn) !important; stroke-dasharray: 4 2; stroke-width: 2; }
.planting.selected .planting-bg { stroke: var(--accent) !important; stroke-width: 3; stroke-dasharray: none; }
.planting-label {
  font-size: 8px;
  font-weight: 600;
  fill: var(--ink);
  pointer-events: none;
  paint-order: stroke;
  stroke: rgb(255 255 255 / 0.85);
  stroke-width: 2.5px;
}
.ghost { pointer-events: none; }
.ghost rect { fill-opacity: 0.25; stroke: rgb(255 255 255 / 0.85); stroke-width: 1.5; stroke-dasharray: 4 3; }
.ghost text {
  font-size: 7px;
  font-weight: 600;
  fill: white;
  paint-order: stroke;
  stroke: rgb(60 40 20 / 0.6);
  stroke-width: 2px;
}
.ghost text.weeks { font-size: 6px; font-weight: 400; }
.dims { pointer-events: none; }
.dims line { stroke: var(--accent); stroke-width: 0.8; stroke-dasharray: 2 1.5; }
.dims text {
  font-size: 7px;
  font-weight: 600;
  text-anchor: middle;
  fill: var(--accent);
  paint-order: stroke;
  stroke: rgb(255 255 255 / 0.9);
  stroke-width: 2px;
}
.handle { fill: var(--accent); stroke: white; stroke-width: 1; cursor: nwse-resize; }
</style>
