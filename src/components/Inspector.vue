<script setup lang="ts">
import { computed, ref } from 'vue'
import { CROPS, CROP_BY_ID, FAMILIES } from '../lib/crops'
import {
  state, currentAbs, cropOf, bedOf, plantCount, edgeDistances, adviceFor, tasksBetween, removeBed, removePlanting,
  addSuccession, goToAbs, select, overlapsYear,
} from '../lib/store'
import { weekLabel, weekToMonth } from '../lib/time'
import CropMonths from './CropMonths.vue'

const bed = computed(() =>
  state.selection?.kind === 'bed' ? state.beds.find((b) => b.id === state.selection!.id) : undefined,
)
const planting = computed(() =>
  state.selection?.kind === 'planting' ? state.plantings.find((p) => p.id === state.selection!.id) : undefined,
)

const bedPlantings = computed(() =>
  bed.value
    ? state.plantings
        .filter((p) => p.bedId === bed.value!.id && overlapsYear(p, state.year))
        .sort((a, b) => a.start - b.start)
    : [],
)
const bedHistory = computed(() => {
  if (!bed.value) return []
  const byYear = new Map<number, Set<string>>()
  for (const p of state.plantings.filter((p) => p.bedId === bed.value!.id)) {
    const y = Math.floor((p.start - 1) / 52)
    if (y >= state.year) continue
    if (!byYear.has(y)) byYear.set(y, new Set())
    byYear.get(y)!.add(FAMILIES[cropOf(p).family])
  }
  return [...byYear.entries()].sort((a, b) => b[0] - a[0]).slice(0, 3)
})

const edges = computed(() => {
  const p = planting.value
  const b = p && bedOf(p)
  if (!p || !b) return undefined
  const d = edgeDistances(p, b)
  return { left: Math.round(d.left), top: Math.round(d.top), right: Math.round(d.right), bottom: Math.round(d.bottom) }
})

const tasks = computed(() => tasksBetween(currentAbs.value, currentAbs.value + 2))

const successionCrop = ref('')
function onSuccession() {
  if (planting.value && successionCrop.value) addSuccession(planting.value, successionCrop.value)
  successionCrop.value = ''
}

function setStart(week: number) {
  const p = planting.value!
  const duration = p.end - p.start
  p.start = state.year * 52 + week
  p.end = p.start + duration
}

function setDuration(weeks: number) {
  const p = planting.value!
  p.end = p.start + Math.max(1, weeks) - 1
}

const sortedCrops =[...CROPS].sort((a, b) => a.name.localeCompare(b.name, 'nl'))
</script>

<template>
  <aside class="inspector">
    <!-- Bed -->
    <template v-if="bed">
      <h2>{{ bed.greenhouse ? 'Kas' : 'Bed' }}</h2>
      <p v-if="bed.greenhouse" class="muted small">
        Onverwarmde kas, buiten de tuin. Gewassen mogen hier ± een maand eerder de grond in en oogsten 4 weken langer door.
      </p>
      <label>Naam <input v-model="bed.name" /></label>
      <div v-if="!bed.greenhouse" class="row">
        <label>X (cm) <input v-model.number="bed.x" type="number" step="10" /></label>
        <label>Y (cm) <input v-model.number="bed.y" type="number" step="10" /></label>
      </div>
      <div class="row">
        <label>Breedte <input v-model.number="bed.w" type="number" step="10" /></label>
        <label>Lengte <input v-model.number="bed.h" type="number" step="10" /></label>
      </div>
      <p class="muted">{{ ((bed.w * bed.h) / 10000).toFixed(2) }} m²</p>

      <h3>Teelten in {{ state.year }}</h3>
      <p v-if="!bedPlantings.length" class="muted">Nog niets gepland.</p>
      <ul class="list">
        <li v-for="p in bedPlantings" :key="p.id" @click="select({ kind: 'planting', id: p.id }); goToAbs(p.start)">
          {{ cropOf(p).emoji }} {{ cropOf(p).name }}
          <span class="muted">{{ weekLabel(p.start, state.year) }} → {{ weekLabel(p.end, state.year) }}</span>
        </li>
      </ul>

      <h3>Vorige jaren</h3>
      <p v-if="!bedHistory.length" class="muted">Geen geschiedenis.</p>
      <p v-for="[year, fams] in bedHistory" :key="year" class="small"><strong>{{ year }}:</strong> {{ [...fams].join(', ') }}</p>

      <button v-if="!bed.greenhouse" class="danger" @click="removeBed(bed.id)">Bed verwijderen</button>
    </template>

    <!-- Planting -->
    <template v-else-if="planting">
      <h2>{{ cropOf(planting).emoji }} {{ cropOf(planting).name }}</h2>
      <p class="muted small">{{ FAMILIES[cropOf(planting).family] }} · plantafstand {{ cropOf(planting).spacing }} × {{ cropOf(planting).rowSpacing }} cm</p>

      <div class="row">
        <label>In de grond (week)
          <input :value="planting.start - state.year * 52" type="number" @change="setStart(+($event.target as HTMLInputElement).value)" />
          <small>{{ weekLabel(planting.start, state.year) }}</small>
        </label>
        <label>Duur (weken)
          <input :value="planting.end - planting.start + 1" type="number" min="1" @change="setDuration(+($event.target as HTMLInputElement).value)" />
          <small>vrij na {{ weekLabel(planting.end, state.year) }}</small>
        </label>
      </div>
      <div class="row">
        <label>Breedte <input v-model.number="planting.w" type="number" step="5" min="5" /></label>
        <label>Lengte <input v-model.number="planting.h" type="number" step="5" min="5" /></label>
      </div>
      <p class="count">± {{ plantCount(planting) }} planten</p>

      <h3>Afstand tot de rand van het bed</h3>
      <div class="row">
        <label>Vlak van links (cm) <input v-model.number="planting.x" type="number" step="5" min="0" /></label>
        <label>Vlak van boven (cm) <input v-model.number="planting.y" type="number" step="5" min="0" /></label>
      </div>
      <p v-if="edges" class="small">
        Eerste plant op <strong>{{ edges.left }} cm</strong> van links en <strong>{{ edges.top }} cm</strong> van boven.<br />
        Buitenste planten: {{ edges.right }} cm van rechts, {{ edges.bottom }} cm van onder.
      </p>

      <ul class="advice">
        <li v-for="a in adviceFor(planting)" :key="a.text" :class="a.level">{{ { warn: '⚠️', good: '💚', tip: '💡' }[a.level] }} {{ a.text }}</li>
      </ul>

      <h3>Kalender</h3>
      <CropMonths :crop="cropOf(planting)" :current-month="weekToMonth(state.week)" show-labels />

      <h3>Buren</h3>
      <p class="small"><strong>Goed:</strong> {{ cropOf(planting).good.map((id) => CROP_BY_ID[id]?.name ?? id).join(', ') || '—' }}</p>
      <p class="small"><strong>Slecht:</strong> {{ cropOf(planting).bad.map((id) => CROP_BY_ID[id]?.name ?? id).join(', ') || '—' }}</p>

      <h3>Nateelt plannen</h3>
      <div class="row">
        <select v-model="successionCrop">
          <option value="" disabled>Kies gewas…</option>
          <option v-for="c in sortedCrops" :key="c.id" :value="c.id">{{ c.emoji }} {{ c.name }}</option>
        </select>
        <button :disabled="!successionCrop" @click="onSuccession">Toevoegen</button>
      </div>

      <button class="danger" @click="removePlanting(planting.id)">Teelt verwijderen</button>
    </template>

    <!-- Nothing selected -->
    <template v-else>
      <h2>Te doen</h2>
      <p class="muted small">Komende 3 weken vanaf week {{ state.week }}</p>
      <p v-if="!tasks.length" class="muted">Niets gepland. Sleep gewassen in je bedden om te beginnen.</p>
      <ul class="list">
        <li v-for="t in tasks" :key="t.label + t.abs" @click="select({ kind: 'planting', id: t.planting.id })">
          <span class="muted">{{ weekLabel(t.abs, state.year) }}</span><br />{{ t.label }}
        </li>
      </ul>
      <h3>Zo werkt het</h3>
      <ul class="help small">
        <li>Sleep bedden om ze te verplaatsen, versleep het hoekje om de maat te wijzigen.</li>
        <li>Met de weekschuif zie je wat er op elk moment in de tuin staat.</li>
        <li>Plan een nateelt op dezelfde plek, zo blijft je tuin het hele jaar vol.</li>
        <li>⚠️ waarschuwt voor slechte buren, overlap en vruchtwisseling.</li>
      </ul>
    </template>
  </aside>
</template>

<style scoped>
.inspector { overflow-y: auto; display: flex; flex-direction: column; gap: 6px; }
h2 { margin: 0; }
h3 { margin: 12px 0 2px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.04em; color: var(--muted); }
label { display: flex; flex-direction: column; gap: 2px; font-size: 12px; color: var(--muted); }
.row > * { flex: 1; }
label small { font-size: 11px; }
.row { display: flex; gap: 8px; }
.muted { color: var(--muted); }
.small { font-size: 12px; margin: 0; }
.count { font-weight: 600; margin: 0; }
.list { list-style: none; padding: 0; margin: 0; }
.list li { padding: 6px 8px; border-radius: 8px; cursor: pointer; font-size: 13px; }
.list li:hover { background: var(--hover); }
.list li .muted { font-size: 11px; }
.advice { list-style: none; padding: 0; margin: 4px 0; font-size: 12px; display: flex; flex-direction: column; gap: 4px; }
.advice li { padding: 6px 8px; border-radius: 8px; }
.advice .warn { background: var(--warn-soft); }
.advice .good { background: var(--good-soft); }
.advice .tip { background: var(--hover); }
.help { padding-left: 18px; color: var(--muted); }
.danger { margin-top: 16px; }
</style>
