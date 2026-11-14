<script setup lang="ts">
import { computed } from 'vue'
import { state, cropOf, overlapsYear, select, goToAbs, todayAbs, type Planting } from '../lib/store'
import { MONTHS, weekLabel, absWeek } from '../lib/time'

const emit = defineEmits<{ open: [] }>()

const yearStart = computed(() => absWeek(state.year, 1))
const pct = (abs: number) => `${(Math.min(Math.max(abs - yearStart.value, 0), 52) / 52) * 100}%`
const span = (from: number, to: number) => ({ left: pct(from), width: `calc(${pct(to + 1)} - ${pct(from)})` })

const rows = computed(() =>
  state.beds.map((bed) => ({
    bed,
    plantings: state.plantings
      .filter((p) => p.bedId === bed.id && overlapsYear(p, state.year))
      .sort((a, b) => a.start - b.start),
  })),
)

function segments(p: Planting) {
  const c = cropOf(p)
  const harvestFrom = Math.min(p.start + c.weeksToHarvest, p.end)
  return {
    preSow: c.preSowWeeks ? span(p.start - c.preSowWeeks, p.start - 1) : null,
    grow: span(p.start, harvestFrom - 1),
    harvest: span(harvestFrom, p.end),
  }
}

function open(p: Planting) {
  select({ kind: 'planting', id: p.id })
  goToAbs(p.start)
  emit('open')
}

const nowLeft = computed(() => pct(todayAbs))
const showNow = computed(() => todayAbs >= yearStart.value && todayAbs < yearStart.value + 52)
</script>

<template>
  <div class="timeline">
    <div class="legend">
      <span><i class="presow" /> binnen voorzaaien</span>
      <span><i class="grow" /> groeit</span>
      <span><i class="harvest" /> oogst / bloei</span>
    </div>
    <div class="grid">
      <div class="label sticky-head" />
      <div class="track months sticky-head">
        <span v-for="(m, i) in MONTHS" :key="m" :style="{ left: `${(i / 12) * 100}%` }">{{ m }}</span>
      </div>

      <template v-for="row in rows" :key="row.bed.id">
        <div class="label bed">{{ row.bed.name }}</div>
        <div class="track bed-track" />
        <template v-if="!row.plantings.length">
          <div class="label empty">nog leeg</div>
          <div class="track" />
        </template>
        <template v-for="p in row.plantings" :key="p.id">
          <div class="label crop" @click="open(p)">{{ cropOf(p).emoji }} {{ cropOf(p).name }}</div>
          <div class="track" @click="open(p)" :title="`${weekLabel(p.start)} → ${weekLabel(p.end)}`">
            <div v-if="segments(p).preSow" class="bar presow" :style="[segments(p).preSow!, { borderColor: cropOf(p).color }]" />
            <div class="bar grow" :style="[segments(p).grow, { background: cropOf(p).color }]" />
            <div class="bar harvest" :style="[segments(p).harvest, { background: cropOf(p).color }]" />
          </div>
        </template>
      </template>
      <div v-if="showNow" class="now" :style="{ left: `calc(160px + (100% - 160px) * ${parseFloat(nowLeft) / 100})` }" />
    </div>
  </div>
</template>

<style scoped>
.timeline { background: var(--panel); border-radius: 12px; padding: 12px 16px; overflow: auto; height: 100%; }
.legend { display: flex; gap: 16px; font-size: 12px; color: var(--muted); margin-bottom: 8px; }
.legend i { display: inline-block; width: 18px; height: 10px; border-radius: 3px; vertical-align: middle; }
.legend .presow { border: 1.5px dashed var(--muted); }
.legend .grow { background: var(--accent); opacity: 0.45; }
.legend .harvest { background: var(--accent); }
.grid { display: grid; grid-template-columns: 160px 1fr; position: relative; row-gap: 3px; }
.label { font-size: 13px; padding: 3px 8px 3px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.label.bed { font-weight: 700; padding-top: 12px; }
.label.crop { cursor: pointer; padding-left: 10px; }
.label.empty { color: var(--muted); font-style: italic; padding-left: 10px; font-size: 12px; }
.track {
  position: relative;
  min-height: 22px;
  background: repeating-linear-gradient(to right, var(--hover) 0 1px, transparent 1px calc(100% / 12));
  cursor: pointer;
}
.track.months, .track.bed-track { background: none; cursor: default; }
.label.sticky-head, .track.months.sticky-head { position: sticky; top: -12px; z-index: 2; background: var(--panel); min-height: 26px; padding-top: 6px; }
.months span { position: absolute; font-size: 11px; color: var(--muted); padding-left: 4px; }
.bar { position: absolute; top: 4px; bottom: 4px; border-radius: 4px; }
.bar.presow { border: 1.5px dashed; background: transparent; }
.bar.grow { opacity: 0.45; border-radius: 4px 0 0 4px; }
.bar.harvest { border-radius: 0 4px 4px 0; }
.now { position: absolute; top: 0; bottom: 0; width: 2px; background: var(--warn); pointer-events: none; }
</style>
