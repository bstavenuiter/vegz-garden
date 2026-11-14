<script setup lang="ts">
import { MONTHS } from '../lib/time'

import { computed } from 'vue'
import { KINDS, monthsFor, type Crop, type KindKey } from '../lib/crops'

const props = defineProps<{ crop: Crop; currentMonth?: number; showLabels?: boolean; kinds?: KindKey[] }>()

const visibleKinds = computed(() => KINDS.filter((k) => !props.kinds || props.kinds.includes(k.key)))
</script>

<template>
  <div class="months-grid" :class="{ labeled: showLabels }">
    <div class="cell head" v-if="showLabels" />
    <template v-if="showLabels">
      <div v-for="(m, i) in MONTHS" :key="m" class="cell head" :class="{ now: currentMonth === i + 1 }">{{ m[0] }}</div>
    </template>
    <template v-for="k in visibleKinds" :key="k.key">
      <div v-if="showLabels" class="cell label">{{ k.label }}</div>
      <div
        v-for="(m, i) in MONTHS"
        :key="m"
        class="cell"
        :class="[{ now: currentMonth === i + 1 }, monthsFor(crop, k.key).includes(i + 1) ? k.key : '']"
        :title="`${k.label}: ${m}`"
      />
    </template>
  </div>
</template>

<style scoped>
.months-grid {
  display: grid;
  grid-template-columns: v-bind("showLabels ? 'auto repeat(12, 1fr)' : 'repeat(12, 1fr)'");
  gap: v-bind("showLabels ? '2px' : '1px 2px'");
  font-size: 10px;
}
.cell { height: v-bind("showLabels ? '9px' : '6px'"); background: var(--hover); border-radius: 2px; }
.cell.head { height: auto; background: none; text-align: center; color: var(--muted); }
.cell.label { height: auto; background: none; padding-right: 6px; white-space: nowrap; color: var(--muted); }
.labeled .cell.now:not(.head):not(.label) { box-shadow: 0 0 0 1px var(--accent); }
.cell.head.now { color: var(--accent); font-weight: 700; }
.sowIndoors { background: var(--c-indoor); }
.sowOutdoors { background: var(--c-sow); }
.plantOut { background: var(--c-plant); }
.kas { background: var(--c-kas); }
.harvest { background: var(--c-harvest); }
</style>
