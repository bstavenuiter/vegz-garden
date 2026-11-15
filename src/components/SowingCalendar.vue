<script setup lang="ts">
import { computed, ref } from 'vue'
import { CROPS, KINDS, monthsFor, type KindKey } from '../lib/crops'
import { state } from '../lib/store'
import { MONTHS, MONTHS_FULL, weekToMonth } from '../lib/time'
import CropMonths from './CropMonths.vue'

const onlyMine = ref(false)
const onlyNow = ref(false)
const month = computed(() => weekToMonth(state.week))
const wrap = (m: number) => ((m - 1 + 12) % 12) + 1
const fromMonth = ref(wrap(month.value - 1))
const toMonth = ref(wrap(month.value + 3))
const windowMonths = computed(() => {
  const length = ((toMonth.value - fromMonth.value + 12) % 12) + 1
  return Array.from({ length }, (_, i) => wrap(fromMonth.value + i))
})

const activeKinds = ref<KindKey[]>(KINDS.map((k) => k.key))
function toggleKind(key: KindKey) {
  if (!activeKinds.value.includes(key)) activeKinds.value.push(key)
  else if (activeKinds.value.length > 1) activeKinds.value = activeKinds.value.filter((k) => k !== key)
}

const print = () => window.print()

const crops = computed(() => {
  const mine = new Set(state.plantings.map((p) => p.cropId))
  return CROPS.filter((c) => !onlyMine.value || mine.has(c.id))
    .filter(
      (c) =>
        !onlyNow.value ||
        activeKinds.value.some((k) => monthsFor(c, k).some((m) => windowMonths.value.includes(m))),
    )
    .sort((a, b) => a.name.localeCompare(b.name, 'nl'))
})
</script>

<template>
  <div class="calendar">
    <div class="toolbar">
      <label><input v-model="onlyMine" type="checkbox" /> Alleen gewassen in mijn plan</label>
      <label class="window-filter">
        <input v-model="onlyNow" type="checkbox" /> Alleen gewassen met activiteit van
        <select v-model.number="fromMonth" @change="onlyNow = true">
          <option v-for="(m, i) in MONTHS_FULL" :key="m" :value="i + 1">{{ m }}</option>
        </select>
        t/m
        <select v-model.number="toMonth" @change="onlyNow = true">
          <option v-for="(m, i) in MONTHS_FULL" :key="m" :value="i + 1">{{ m }}</option>
        </select>
      </label>
      <div class="legend">
        <button
          v-for="k in KINDS"
          :key="k.key"
          :class="{ off: !activeKinds.includes(k.key) }"
          :aria-pressed="activeKinds.includes(k.key)"
          @click="toggleKind(k.key)"
        >
          <i :class="k.key" /> {{ k.label.toLowerCase() }}
        </button>
      </div>
      <button class="print-button" @click="print">PDF / printen</button>
    </div>
    <h2 class="print-title">🥕 Zaaikalender</h2>
    <p v-if="state.soil === 'klei'" class="clay-note">
      🟫 Kleigrond: zaai en plant buiten in het voorjaar liefst 1–2 weken later dan de kalender aangeeft. In de kas maakt het niet uit.
    </p>
    <div class="table">
      <div class="head-row">
        <div />
        <div class="months">
          <span
            v-for="(m, i) in MONTHS"
            :key="m"
            :class="{ now: month === i + 1, window: onlyNow && windowMonths.includes(i + 1) }"
          >{{ m }}</span>
        </div>
      </div>
      <div v-for="c in crops" :key="c.id" class="crop-row">
        <div class="name">{{ c.emoji }} {{ c.name }}</div>
        <CropMonths :crop="c" :current-month="month" :kinds="activeKinds" />
      </div>
      <p v-if="!crops.length" class="empty">Geen gewassen gevonden.</p>
    </div>
  </div>
</template>

<style scoped>
.calendar { background: var(--panel); border-radius: 12px; padding: 12px 16px; height: 100%; overflow: auto; }
.toolbar { display: flex; flex-wrap: wrap; gap: 16px; align-items: center; font-size: 13px; margin-bottom: 12px; }
.legend { display: flex; gap: 6px; margin-left: auto; }
.legend button { font-size: 12px; padding: 3px 9px; border-radius: 999px; display: flex; align-items: center; gap: 5px; }
.legend button.off { opacity: 0.45; background: transparent; }
.legend button.off i { background: var(--hover); }
.legend i { display: inline-block; width: 14px; height: 9px; border-radius: 2px; }
.sowIndoors { background: var(--c-indoor); }
.sowOutdoors { background: var(--c-sow); }
.plantOut { background: var(--c-plant); }
.kas { background: var(--c-kas); }
.harvest { background: var(--c-harvest); }
.head-row, .crop-row { display: grid; grid-template-columns: 180px 1fr; align-items: center; gap: 8px; }
.head-row { position: sticky; top: -12px; z-index: 1; background: var(--panel); padding: 6px 0 4px; }
.crop-row { padding: 5px 0; border-top: 1px solid var(--hover); }
.months { display: grid; grid-template-columns: repeat(12, 1fr); font-size: 11px; color: var(--muted); text-align: center; }
.months .now { color: var(--accent); font-weight: 700; }
.months .window { background: var(--accent-soft); border-radius: 4px; }
.window-filter { display: flex; align-items: center; gap: 6px; }
.window-filter select { width: auto; padding: 2px 6px; font-size: 13px; }
.name { font-size: 14px; }
.clay-note { margin: -4px 0 8px; font-size: 12px; color: var(--muted); }
.empty { color: var(--muted); }
.print-title { display: none; }

@media (max-width: 700px) {
  .calendar { padding: 8px 10px; border-radius: 8px; }
  .toolbar { gap: 8px; }
  .window-filter { flex-wrap: wrap; }
  .legend { margin-left: 0; flex-wrap: wrap; }
  .head-row, .crop-row { grid-template-columns: 105px 1fr; gap: 6px; }
  .head-row { top: -8px; }
  .name { font-size: 13px; }
  .months { font-size: 9px; }
}

@media print {
  .calendar { height: auto; overflow: visible; padding: 0; background: none; border-radius: 0; }
  .print-title { display: block; margin: 0 0 6px; }
  .toolbar { margin-bottom: 6px; }
  .toolbar > label, .print-button, .legend button.off { display: none; }
  .legend { margin-left: 0; }
  .legend button { border: none; background: none; padding: 0 10px 0 0; }
  .head-row { position: static; }
  .crop-row { break-inside: avoid; }
}
</style>
