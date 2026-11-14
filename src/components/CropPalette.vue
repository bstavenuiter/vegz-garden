<script setup lang="ts">
import { computed, ref } from 'vue'
import { CROPS } from '../lib/crops'
import { state } from '../lib/store'

const query = ref('')
const filtered = computed(() =>
  CROPS.filter((c) => c.name.toLowerCase().includes(query.value.toLowerCase())).sort((a, b) => a.name.localeCompare(b.name, 'nl')),
)

function onDragStart(e: DragEvent, id: string) {
  e.dataTransfer?.setData('text/crop', id)
}

function toggleArm(id: string) {
  state.armedCropId = state.armedCropId === id ? null : id
}
</script>

<template>
  <aside class="palette">
    <h2>Gewassen</h2>
    <p class="hint">Sleep een gewas naar een bed, of klik het aan en klik daarna in een bed.</p>
    <input v-model="query" type="search" placeholder="Zoek gewas…" class="search" />
    <ul>
      <li
        v-for="c in filtered"
        :key="c.id"
        draggable="true"
        :class="{ armed: state.armedCropId === c.id }"
        :title="`${c.spacing} × ${c.rowSpacing} cm`"
        @dragstart="onDragStart($event, c.id)"
        @click="toggleArm(c.id)"
      >
        <span class="swatch" :style="{ background: c.color }">{{ c.emoji }}</span>
        <span class="name">{{ c.name }}</span>
        <span class="spacing">{{ c.spacing }}×{{ c.rowSpacing }}</span>
      </li>
    </ul>
  </aside>
</template>

<style scoped>
.palette { display: flex; flex-direction: column; min-height: 0; }
h2 { margin: 0 0 4px; }
.hint { margin: 0 0 8px; font-size: 12px; color: var(--muted); }
.search { margin-bottom: 8px; }
ul { list-style: none; margin: 0; padding: 0; overflow-y: auto; flex: 1; }
li {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 6px;
  border-radius: 8px;
  cursor: grab;
  font-size: 14px;
}
li:hover { background: var(--hover); }
li.armed { background: var(--accent-soft); outline: 2px solid var(--accent); }
.swatch {
  width: 26px; height: 26px; border-radius: 50%;
  display: grid; place-items: center; font-size: 15px; flex-shrink: 0;
}
.name { flex: 1; }
.spacing { font-size: 11px; color: var(--muted); font-variant-numeric: tabular-nums; }
</style>
