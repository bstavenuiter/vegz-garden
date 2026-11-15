<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { state, addBed, exportJson, importJson, select, removePlanting, removeBed } from './lib/store'
import CropPalette from './components/CropPalette.vue'
import GardenCanvas from './components/GardenCanvas.vue'
import Inspector from './components/Inspector.vue'
import WeekSlider from './components/WeekSlider.vue'
import TimelineView from './components/TimelineView.vue'
import SowingCalendar from './components/SowingCalendar.vue'

type Tab = 'plan' | 'jaar' | 'kalender'
// The plan editor needs a big screen; on a phone open the sowing calendar.
const tab = ref<Tab>(window.matchMedia('(max-width: 700px)').matches ? 'kalender' : 'plan')
const TABS: { id: Tab; label: string }[] = [
  { id: 'plan', label: 'Tuinplan' },
  { id: 'jaar', label: 'Jaarplanning' },
  { id: 'kalender', label: 'Zaaikalender' },
]

function download() {
  const blob = new Blob([exportJson()], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `moestuin-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(a.href)
}

async function upload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  try {
    importJson(await file.text())
  } catch {
    alert('Dit bestand kon niet worden geladen.')
  }
}

function onKey(e: KeyboardEvent) {
  if ((e.target as HTMLElement).closest('input, select, textarea')) return
  if (e.key === 'Escape') {
    state.armedCropId = null
    select(null)
  }
  if ((e.key === 'Delete' || e.key === 'Backspace') && state.selection) {
    if (state.selection.kind === 'planting') removePlanting(state.selection.id)
    else if (
      !state.beds.find((b) => b.id === state.selection!.id)?.greenhouse &&
      confirm('Dit bed en alle teelten erin verwijderen?')
    )
      removeBed(state.selection.id)
  }
}
onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="app">
    <header>
      <h1>🥕 Moestuinplanner</h1>
      <nav>
        <button v-for="t in TABS" :key="t.id" :class="{ active: tab === t.id }" @click="tab = t.id">{{ t.label }}</button>
      </nav>
      <div class="year">
        <button aria-label="Vorig jaar" @click="state.year--">◀</button>
        <strong>{{ state.year }}</strong>
        <button aria-label="Volgend jaar" @click="state.year++">▶</button>
      </div>
      <label class="soil">
        Grond
        <select v-model="state.soil">
          <option value="klei">Klei</option>
          <option value="normaal">Zand / normaal</option>
        </select>
      </label>
      <div class="actions">
        <button @click="download">Exporteren</button>
        <label class="button">Importeren<input type="file" accept="application/json" hidden @change="upload" /></label>
      </div>
    </header>

    <main v-if="tab === 'plan'" class="plan">
      <CropPalette class="panel" />
      <section class="center">
        <WeekSlider />
        <div class="canvas-wrap panel">
          <GardenCanvas />
        </div>
        <div class="canvas-actions">
          <button @click="addBed">+ Bed toevoegen</button>
          <span v-if="state.armedCropId" class="armed-hint">Klik in een bed om te planten · Esc om te stoppen</span>
        </div>
      </section>
      <Inspector class="panel" />
    </main>

    <main v-else-if="tab === 'jaar'" class="full">
      <TimelineView @open="tab = 'plan'" />
    </main>

    <main v-else class="full">
      <SowingCalendar />
    </main>
  </div>
</template>

<style scoped>
.app { height: 100vh; display: flex; flex-direction: column; }
header {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 10px 20px;
  background: var(--header);
  color: white;
}
h1 { font-size: 20px; margin: 0; }
nav { display: flex; gap: 4px; }
nav button { background: transparent; color: white; border-color: transparent; }
nav button.active { background: rgb(255 255 255 / 0.18); }
.year { display: flex; align-items: center; gap: 8px; }
.year button { background: transparent; color: white; border-color: rgb(255 255 255 / 0.3); padding: 2px 8px; }
.soil { display: flex; align-items: center; gap: 6px; font-size: 14px; }
.soil select { width: auto; padding: 3px 6px; }
.actions { margin-left: auto; display: flex; gap: 8px; }
.actions button, .actions .button { background: rgb(255 255 255 / 0.12); color: white; border-color: rgb(255 255 255 / 0.25); }
main { flex: 1; min-height: 0; padding: 12px; }
.plan { display: grid; grid-template-columns: 240px 1fr 300px; gap: 12px; }
.panel { background: var(--panel); border-radius: 12px; padding: 12px; min-height: 0; }
.center { display: flex; flex-direction: column; gap: 8px; min-height: 0; min-width: 0; }
.canvas-wrap { flex: 1; min-height: 0; padding: 4px; }
.canvas-actions { display: flex; gap: 12px; align-items: center; }
.armed-hint { font-size: 13px; color: var(--accent); font-weight: 600; }
.full { display: flex; flex-direction: column; }
.full > * { flex: 1; }

@media (max-width: 700px) {
  .app { height: 100dvh; }
  header { flex-wrap: wrap; gap: 8px 12px; padding: 8px 12px; }
  h1 { font-size: 17px; }
  nav { order: 1; width: 100%; overflow-x: auto; }
  .actions { margin-left: 0; }
  main { padding: 8px; }
}

@media print {
  .app { height: auto; }
  header { display: none; }
  main { padding: 0; }
}
</style>
