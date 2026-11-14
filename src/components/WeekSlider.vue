<script setup lang="ts">
import { MONTHS, monthStartWeek, MONTHS_FULL, weekToMonth } from '../lib/time'
import { state, todayAbs, goToAbs } from '../lib/store'
</script>

<template>
  <div class="week-slider">
    <div class="current">
      <strong>Week {{ state.week }}</strong>
      <span>{{ MONTHS_FULL[weekToMonth(state.week) - 1] }} {{ state.year }}</span>
      <button class="link" @click="goToAbs(todayAbs)">Vandaag</button>
      <label class="toggle">
        <input v-model="state.showWholeYear" type="checkbox" />
        Toon andere teelten van dit jaar
      </label>
    </div>
    <input v-model.number="state.week" type="range" min="1" max="52" step="1" />
    <div class="months">
      <span
        v-for="(m, i) in MONTHS"
        :key="m"
        :class="{ active: weekToMonth(state.week) === i + 1 }"
        @click="state.week = monthStartWeek(i + 1)"
      >{{ m }}</span>
    </div>
  </div>
</template>

<style scoped>
.week-slider { padding: 8px 12px 4px; background: var(--panel); border-radius: 12px; }
.current { display: flex; align-items: baseline; gap: 10px; font-size: 14px; flex-wrap: wrap; }
.toggle { margin-left: auto; font-size: 12px; color: var(--muted); display: flex; gap: 4px; align-items: center; }
input[type='range'] { width: 100%; accent-color: var(--accent); }
.months { display: grid; grid-template-columns: repeat(12, 1fr); font-size: 11px; color: var(--muted); text-align: center; }
.months span { cursor: pointer; border-radius: 4px; }
.months span:hover { background: var(--hover); }
.months span.active { color: var(--accent); font-weight: 700; }
</style>
