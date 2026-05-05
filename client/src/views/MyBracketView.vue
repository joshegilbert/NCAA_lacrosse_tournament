<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { api } from '../services/api'

const route = useRoute()
const leagueId = route.params.id

const locked = ref(false)
const hasEntry = ref(false)
const breakdown = ref([])

function pickLabel(b) {
  return [b.displayRound, b.key].filter(Boolean).join(' · ')
}

function matchupTeamsLine(b) {
  const a = b.team1Name
  const c = b.team2Name
  if (a && c) return `${a} vs ${c}`
  return ''
}

function statusLabel(st) {
  if (st === 'correct') return 'Correct'
  if (st === 'incorrect') return 'Wrong pick'
  if (st === 'pending') return 'Awaiting result'
  return 'No pick'
}

function statusChipClass(st) {
  if (st === 'correct') return 'bg-emerald-600 text-white'
  if (st === 'incorrect') return 'bg-red-600 text-white'
  if (st === 'pending') return 'bg-slate-500 text-white'
  return 'bg-amber-500 text-white'
}

async function load() {
  const eRes = await api(`/bracket/league/${leagueId}/my-entry`)
  locked.value = eRes.locked
  hasEntry.value = !!eRes.hasEntry
  breakdown.value = eRes.breakdown || []
}

function rowClass(st) {
  if (st === 'correct') return 'border-emerald-200 bg-emerald-50'
  if (st === 'incorrect') return 'border-red-200 bg-red-50'
  if (st === 'pending') return 'border-slate-200 bg-slate-50'
  return 'border-amber-100 bg-amber-50/50'
}

onMounted(load)
</script>

<template>
  <div class="min-h-screen bg-slate-50 pb-12">
    <header class="border-b border-slate-200 bg-white">
      <div class="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-4">
        <RouterLink :to="`/leagues/${leagueId}`" class="text-sm font-medium text-slate-600 hover:text-navy-900">
          ← League
        </RouterLink>
        <RouterLink
          :to="`/leagues/${leagueId}/bracket`"
          class="min-h-[44px] content-center text-sm font-semibold text-sky-800 hover:underline"
        >
          {{ locked ? 'View bracket' : 'Edit bracket' }}
        </RouterLink>
      </div>
      <div class="mx-auto max-w-4xl px-4 pb-4">
        <h1 class="text-2xl font-bold text-navy-900">My bracket</h1>
        <p v-if="locked" class="text-sm text-amber-800">Locked — read only.</p>
        <p v-else-if="!hasEntry" class="mt-2 text-sm text-slate-600">
          You have not saved a bracket yet.
          <RouterLink :to="`/leagues/${leagueId}/bracket`" class="font-semibold text-sky-800 hover:underline">
            Fill it out
          </RouterLink>
        </p>
      </div>
    </header>

    <div class="mx-auto max-w-4xl space-y-3 px-4 py-6">
      <div
        class="mb-4 flex flex-wrap gap-4 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600"
      >
        <span><span class="inline-block h-2 w-2 rounded-full bg-emerald-500 align-middle" /> Correct</span>
        <span><span class="inline-block h-2 w-2 rounded-full bg-red-400 align-middle" /> Wrong pick</span>
        <span><span class="inline-block h-2 w-2 rounded-full bg-slate-300 align-middle" /> Awaiting result</span>
        <span><span class="inline-block h-2 w-2 rounded-full bg-amber-300 align-middle" /> No pick</span>
      </div>
      <div
        v-for="b in breakdown"
        :key="b.matchupId"
        class="rounded-xl border p-4 text-sm shadow-sm"
        :class="rowClass(b.status)"
      >
        <div class="flex flex-wrap items-start justify-between gap-2">
          <div class="min-w-0 flex-1">
            <p class="font-semibold text-navy-900">{{ pickLabel(b) }}</p>
            <p v-if="matchupTeamsLine(b)" class="mt-1 text-xs text-slate-600">{{ matchupTeamsLine(b) }}</p>
            <p class="mt-2 text-slate-800">
              <span class="font-medium text-slate-700">You picked:</span>
              {{ b.selectedWinnerName || '—' }}
            </p>
            <p class="mt-1 text-slate-800">
              <span class="font-medium text-slate-700">Winner:</span>
              {{ b.actualWinnerName || 'Not set yet' }}
            </p>
            <p
              v-if="b.status === 'incorrect' && b.selectedWinnerName && b.actualWinnerName"
              class="mt-2 text-xs text-red-800"
            >
              Result was <span class="font-semibold">{{ b.actualWinnerName }}</span
              >; you had <span class="font-semibold">{{ b.selectedWinnerName }}</span
              >.
            </p>
          </div>
          <div class="flex shrink-0 flex-col items-end gap-2 text-right">
            <span
              class="inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide"
              :class="statusChipClass(b.status)"
            >
              {{ statusLabel(b.status) }}
            </span>
            <p class="text-xs text-slate-600">+{{ b.pointsEarned }} pts</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
