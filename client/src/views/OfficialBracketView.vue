<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { api } from '../services/api'
import BracketMatchupCard from '../components/BracketMatchupCard.vue'
import { buildMatchupsById, ROUND_TABS } from '../utils/bracketDisplay'

const route = useRoute()
const leagueId = computed(() => route.params.id)

const matchups = ref([])
const tab = ref('opening')
const loadError = ref('')

const matchupsById = computed(() => buildMatchupsById(matchups.value))

const roundsDesktop = computed(() => {
  const order = ['opening', 'first_round', 'quarterfinal', 'semifinal', 'championship']
  const grouped = {}
  for (const x of matchups.value) {
    if (!grouped[x.roundKey]) grouped[x.roundKey] = []
    grouped[x.roundKey].push(x)
  }
  return order
    .map((k) => ({
      key: k,
      label: ROUND_TABS.find((t) => t.key === k)?.label || k,
      matchups: (grouped[k] || []).sort((a, b) => a.position - b.position),
    }))
    .filter((r) => r.matchups.length > 0)
})

const tabMatchups = computed(() => {
  const list = matchups.value.filter((m) => m.roundKey === tab.value)
  return list.sort((a, b) => a.position - b.position)
})

async function load() {
  loadError.value = ''
  try {
    const id = leagueId.value
    if (!id) {
      loadError.value = 'Missing league'
      return
    }
    const mRes = await api(`/bracket/league/${id}/matchups`)
    matchups.value = mRes.matchups || []
  } catch (e) {
    loadError.value = e.message || 'Could not load bracket'
    matchups.value = []
  }
}

onMounted(async () => {
  await load()
  const first = roundsDesktop.value[0]
  if (first) tab.value = first.key
})

watch(leagueId, async () => {
  await load()
  const first = roundsDesktop.value[0]
  if (first) tab.value = first.key
})
</script>

<template>
  <div class="min-h-screen bg-slate-50 pb-12">
    <header class="border-b border-slate-200 bg-white">
      <div class="mx-auto max-w-6xl px-4 py-4">
        <RouterLink
          :to="`/leagues/${leagueId}`"
          class="inline-flex min-h-[44px] items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-navy-900 shadow-sm hover:bg-slate-50"
        >
          ← League
        </RouterLink>
        <h1 class="mt-3 text-2xl font-bold text-navy-900">Tournament results</h1>
        <p class="mt-1 text-sm text-slate-600">
          NCAA Division I men’s lacrosse — winners for this league only. Pool picks stay on your bracket pages.
        </p>
        <p v-if="loadError" class="mt-2 text-sm text-red-700">{{ loadError }}</p>
      </div>
    </header>

    <div class="mx-auto max-w-6xl px-4 py-6">
      <div class="mb-4 flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] md:hidden">
        <button
          v-for="r in roundsDesktop"
          :key="r.key"
          type="button"
          class="min-h-[44px] shrink-0 rounded-full border px-4 py-2 text-sm font-medium"
          :class="tab === r.key ? 'border-navy-900 bg-navy-900 text-white' : 'border-slate-200 bg-white'"
          @click="tab = r.key"
        >
          {{ r.label }}
        </button>
      </div>

      <div class="space-y-4 md:hidden">
        <BracketMatchupCard
          v-for="m in tabMatchups"
          :key="m._id"
          mode="official"
          :matchup="m"
          :pick-map="{}"
          :matchups-by-id="matchupsById"
        />
      </div>

      <div class="hidden gap-0 md:flex md:flex-nowrap md:overflow-x-auto md:pb-4">
        <div
          v-for="col in roundsDesktop"
          :key="col.key"
          class="min-w-[280px] shrink-0 border-r border-slate-200 pr-5 last:border-r-0"
        >
          <h2 class="mb-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500">
            {{ col.label }}
          </h2>
          <div class="flex flex-col gap-8">
            <BracketMatchupCard
              v-for="m in col.matchups"
              :key="m._id"
              mode="official"
              :matchup="m"
              :pick-map="{}"
              :matchups-by-id="matchupsById"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
