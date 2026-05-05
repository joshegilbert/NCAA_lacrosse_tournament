<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { api } from '../services/api'
import BracketMatchupCard from '../components/BracketMatchupCard.vue'
import {
  buildPickMap,
  buildMatchupsById,
  ROUND_TABS,
  pickProgressCount,
} from '../utils/bracketDisplay'

const route = useRoute()
const leagueId = route.params.id

const matchups = ref([])
const locked = ref(false)
const pickMap = ref({})
const bracketDisplayName = ref('')
const saving = ref(false)
const saveError = ref('')
const tab = ref('opening')

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

const progress = computed(() => pickProgressCount(matchups.value, pickMap.value))

function selectWinner(m, team) {
  if (locked.value || !team?._id) return
  const tid = team._id.toString()
  pickMap.value = { ...pickMap.value, [m._id.toString()]: tid }
}

async function load() {
  const [mRes, eRes] = await Promise.all([
    api(`/bracket/league/${leagueId}/matchups`),
    api(`/bracket/league/${leagueId}/my-entry`),
  ])
  matchups.value = mRes.matchups || []
  locked.value = eRes.locked
  const picks = eRes.entry?.picks || []
  pickMap.value = buildPickMap(picks)
  bracketDisplayName.value = eRes.entry?.bracketDisplayName || ''
}

onMounted(async () => {
  await load()
  const first = roundsDesktop.value[0]
  if (first) tab.value = first.key
})

async function save() {
  saveError.value = ''
  saving.value = true
  try {
    const picks = Object.entries(pickMap.value).map(([matchupId, selectedWinnerId]) => ({
      matchupId,
      selectedWinnerId,
    }))
    const data = await api(`/bracket/league/${leagueId}/entry`, {
      method: 'POST',
      body: JSON.stringify({
        picks,
        bracketDisplayName: bracketDisplayName.value.trim() || null,
      }),
    })
    locked.value = data.locked
    if (data.entry?.picks) pickMap.value = buildPickMap(data.entry.picks)
    if (data.entry && 'bracketDisplayName' in data.entry) {
      bracketDisplayName.value = data.entry.bracketDisplayName || ''
    }
  } catch (e) {
    saveError.value = e.message || 'Save failed'
    if (e.details) saveError.value += ` (${e.details.join(', ')})`
  } finally {
    saving.value = false
  }
}

watch(
  () => route.params.id,
  async () => {
    await load()
    const first = roundsDesktop.value[0]
    if (first) tab.value = first.key
  }
)
</script>

<template>
  <div class="min-h-screen bg-slate-50 pb-32 md:pb-24">
    <header class="border-b border-slate-200 bg-white">
      <div class="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
        <div>
          <RouterLink :to="`/leagues/${leagueId}`" class="text-sm font-medium text-slate-600 hover:text-navy-900">
            ← Back to league
          </RouterLink>
          <h1 class="mt-1 text-xl font-bold text-navy-900">{{ locked ? 'Your bracket' : 'Fill your bracket' }}</h1>
          <p class="text-sm text-slate-600">
            {{ progress.picked }} / {{ progress.total }} games picked
          </p>
          <p v-if="locked" class="text-sm text-amber-700">Bracket locked — view only.</p>
          <div v-if="!locked" class="mt-3 max-w-md">
            <label class="block text-xs font-medium text-slate-600">Bracket name in this league (optional)</label>
            <input
              v-model="bracketDisplayName"
              maxlength="40"
              type="text"
              placeholder="e.g. Coach Mike’s picks"
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-navy-900"
            />
            <p class="mt-1 text-xs text-slate-500">Shown on the leaderboard instead of your account name (max 40 characters).</p>
          </div>
          <p v-else-if="bracketDisplayName" class="mt-3 text-sm text-slate-600">
            Bracket name: <span class="font-semibold text-navy-900">{{ bracketDisplayName }}</span>
          </p>
          <RouterLink
            :to="`/leagues/${leagueId}/tournament-results`"
            class="mt-3 inline-flex text-sm font-medium text-sky-800 hover:underline"
          >
            View tournament results for this league
          </RouterLink>
        </div>
        <button
          v-if="!locked"
          type="button"
          class="hidden rounded-xl bg-navy-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 md:inline-flex"
          :disabled="saving"
          @click="save"
        >
          {{ saving ? 'Saving…' : 'Save bracket' }}
        </button>
      </div>
    </header>

    <div class="mx-auto max-w-6xl px-4 py-6">
      <p v-if="saveError" class="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
        {{ saveError }}
      </p>

      <!-- Mobile tabs -->
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

      <!-- Mobile -->
      <div class="space-y-4 md:hidden">
        <BracketMatchupCard
          v-for="m in tabMatchups"
          :key="m._id"
          mode="pick"
          :matchup="m"
          :pick-map="pickMap"
          :matchups-by-id="matchupsById"
          :locked="locked"
          @pick="selectWinner"
        />
      </div>

      <!-- Desktop -->
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
              mode="pick"
              :matchup="m"
              :pick-map="pickMap"
              :matchups-by-id="matchupsById"
              :locked="locked"
              @pick="selectWinner"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Sticky save (mobile) -->
    <div
      v-if="!locked"
      class="fixed inset-x-0 bottom-0 z-10 border-t border-slate-200 bg-white/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] pt-3 backdrop-blur md:hidden"
    >
      <div class="mx-auto flex max-w-lg items-center justify-between gap-3">
        <span class="text-sm font-medium text-slate-600">{{ progress.picked }}/{{ progress.total }} picked</span>
        <button
          type="button"
          class="min-h-[48px] rounded-xl bg-navy-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          :disabled="saving"
          @click="save"
        >
          {{ saving ? 'Saving…' : 'Save bracket' }}
        </button>
      </div>
    </div>
  </div>
</template>
