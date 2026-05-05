<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { api } from '../services/api'
import { useAuthStore } from '../stores/auth'
import { actualTeamsPlaying } from '../utils/adminBracketDisplay'
import TeamPickCard from '../components/TeamPickCard.vue'

const route = useRoute()
const auth = useAuthStore()
const leagueId = route.params.id

const league = ref(null)
const matchups = ref([])
const message = ref('')
const error = ref('')
const locking = ref(false)

const byId = computed(() => {
  const m = {}
  for (const x of matchups.value) m[x._id.toString()] = x
  return m
})

const sorted = computed(() =>
  [...matchups.value].sort(
    (a, b) => a.roundOrder - b.roundOrder || a.position - b.position
  )
)

async function load() {
  error.value = ''
  try {
    const [lg, mRes] = await Promise.all([
      api(`/leagues/${leagueId}`),
      api(`/bracket/league/${leagueId}/matchups`),
    ])
    league.value = lg.league
    matchups.value = mRes.matchups || []
    const adminId = lg.league.creator?._id || lg.league.creator
    if (adminId?.toString() !== auth.user?.id?.toString()) {
      error.value = 'Admin only'
    }
  } catch (e) {
    error.value = e.message || 'Load failed'
  }
}

function teamKey(t) {
  return (t._id || t).toString()
}

function isMarkedWinner(m, t) {
  const aw = m.actualWinner?._id || m.actualWinner
  if (!aw || !t) return false
  return aw.toString() === teamKey(t)
}

async function setWinner(matchupId, teamId) {
  if (!teamId) return
  message.value = ''
  error.value = ''
  try {
    const data = await api(`/admin/matchups/${matchupId}/winner`, {
      method: 'PATCH',
      body: JSON.stringify({ leagueId, teamId }),
    })
    matchups.value = data.matchups || []
    message.value = 'Saved'
    setTimeout(() => {
      message.value = ''
    }, 2000)
  } catch (e) {
    error.value = e.message || 'Could not save'
  }
}

async function toggleLock() {
  locking.value = true
  error.value = ''
  try {
    await api(`/leagues/${leagueId}/lock`, {
      method: 'PATCH',
      body: JSON.stringify({ isLocked: !league.value.isLocked }),
    })
    const lg = await api(`/leagues/${leagueId}`)
    league.value = lg.league
  } catch (e) {
    error.value = e.message || 'Lock failed'
  } finally {
    locking.value = false
  }
}

function sides(m) {
  return actualTeamsPlaying(m, byId.value)
}

onMounted(async () => {
  await auth.fetchMe()
  await load()
})
</script>

<template>
  <div class="min-h-screen bg-slate-50 pb-16">
    <header class="border-b border-slate-200 bg-white">
      <div class="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4">
        <RouterLink :to="`/leagues/${leagueId}`" class="text-sm font-medium text-slate-600 hover:text-navy-900">
          ← League
        </RouterLink>
        <button
          type="button"
          class="min-h-[44px] rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
          :disabled="locking || !league || error === 'Admin only'"
          @click="toggleLock"
        >
          {{ league?.isLocked ? 'Unlock league' : 'Lock league now' }}
        </button>
      </div>
      <div class="mx-auto max-w-5xl px-4 pb-4">
        <h1 class="text-2xl font-bold text-navy-900">Admin · Results</h1>
        <p class="text-sm text-slate-600">Tap the winning team for each game (set earlier rounds first).</p>
      </div>
    </header>

    <main class="mx-auto max-w-5xl px-4 py-6">
      <p v-if="error === 'Admin only'" class="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
        Only the league creator can manage results.
      </p>
      <p v-else-if="error" class="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{{ error }}</p>
      <p v-if="message" class="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
        {{ message }}
      </p>

      <div v-if="league && error !== 'Admin only'" class="space-y-6">
        <div
          v-for="m in sorted"
          :key="m._id"
          class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div class="mb-4 border-b border-slate-100 pb-3">
            <p class="text-xs font-bold uppercase text-slate-500">{{ m.displayRound }}</p>
            <p class="font-semibold text-navy-900">{{ m.key }}</p>
          </div>

          <div v-if="sides(m).length >= 2" class="space-y-3">
            <div class="mb-2 flex items-center justify-center gap-2">
              <div class="h-px flex-1 bg-slate-200" />
              <span class="text-xs font-bold uppercase tracking-widest text-slate-400">Who won?</span>
              <div class="h-px flex-1 bg-slate-200" />
            </div>
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <TeamPickCard
                v-for="t in sides(m)"
                :key="teamKey(t)"
                :team="t"
                compact
                :selected="isMarkedWinner(m, t)"
                :disabled="false"
                @click="setWinner(m._id, teamKey(t))"
              />
            </div>
          </div>
          <p v-else class="text-sm text-amber-800">
            Set winners for the previous round first so both teams are known for this game.
          </p>
        </div>
      </div>
    </main>
  </div>
</template>
