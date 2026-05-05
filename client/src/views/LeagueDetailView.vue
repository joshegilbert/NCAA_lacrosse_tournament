<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { api } from '../services/api'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const league = ref(null)
const locked = ref(false)
const leaderboard = ref([])
const error = ref('')
const copied = ref(false)

const isAdmin = computed(() => {
  if (!league.value || !auth.user) return false
  const c = league.value.creator?._id || league.value.creator
  return c?.toString() === auth.user.id?.toString()
})

function lockIso() {
  if (!league.value?.lockTime) return ''
  return new Date(league.value.lockTime).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

async function load() {
  error.value = ''
  try {
    const id = route.params.id
    const [lgData, lbData] = await Promise.all([
      api(`/leagues/${id}`),
      api(`/leagues/${id}/leaderboard`),
    ])
    league.value = lgData.league
    locked.value = lgData.locked
    leaderboard.value = lbData.leaderboard || []
  } catch (e) {
    error.value = e.message || 'Could not load league'
  }
}

async function copyCode() {
  if (!league.value?.inviteCode) return
  try {
    await navigator.clipboard.writeText(league.value.inviteCode)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch {
    copied.value = false
  }
}

onMounted(load)

async function deleteLeague() {
  if (!league.value?._id) return
  error.value = ''
  const ok = window.confirm(
    `Delete league “${league.value.name}”? This will remove all submitted brackets and results for this league. This cannot be undone.`
  )
  if (!ok) return
  try {
    await api(`/leagues/${league.value._id}`, { method: 'DELETE' })
    await router.push('/dashboard')
  } catch (e) {
    error.value = e.message || 'Could not delete league'
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <header class="border-b border-slate-200 bg-white">
      <div class="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-3">
        <RouterLink to="/dashboard" class="min-h-[44px] content-center text-sm font-medium text-slate-600 hover:text-navy-900">
          ← Dashboard
        </RouterLink>
        <RouterLink
          :to="`/leagues/${route.params.id}/tournament-results`"
          class="inline-flex min-h-[44px] items-center rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-900 shadow-sm hover:bg-sky-100"
        >
          Tournament results
        </RouterLink>
      </div>
    </header>

    <main class="mx-auto max-w-5xl px-4 py-8">
      <p v-if="error" class="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{{ error }}</p>

      <template v-if="league">
        <h1 class="text-2xl font-bold text-navy-900 sm:text-3xl">{{ league.name }}</h1>
        <div class="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-600">
          <span
            class="inline-flex items-center rounded-full px-3 py-1 font-medium"
            :class="locked ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'"
          >
            {{ locked ? 'Locked' : 'Open for picks' }}
          </span>
          <span>Picks lock: {{ lockIso() }}</span>
        </div>

        <div class="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p class="text-sm font-medium text-slate-600">Invite code</p>
          <div class="mt-2 flex flex-wrap items-center gap-2">
            <code class="rounded-lg bg-slate-100 px-3 py-2 text-base font-mono font-bold tracking-wider text-navy-900 sm:text-lg">
              {{ league.inviteCode }}
            </code>
            <button
              type="button"
              class="min-h-[44px] rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50"
              @click="copyCode"
            >
              {{ copied ? 'Copied' : 'Copy' }}
            </button>
          </div>
        </div>

        <section class="mt-8 space-y-3">
          <RouterLink
            :to="`/leagues/${league._id}/bracket`"
            class="flex min-h-[48px] w-full items-center justify-center rounded-xl bg-navy-900 px-5 py-3 text-base font-semibold text-white hover:bg-slate-800"
          >
            {{ locked ? 'View picks' : 'Edit picks' }}
          </RouterLink>
          <RouterLink
            :to="`/leagues/${league._id}/tournament-results`"
            class="inline-flex min-h-[44px] w-full items-center justify-center rounded-lg border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-900 hover:bg-sky-100 sm:justify-center"
          >
            Tournament results
          </RouterLink>
          <RouterLink
            :to="`/leagues/${league._id}/me`"
            class="flex min-h-[44px] items-center justify-center text-center text-sm font-medium text-slate-600 hover:text-navy-900 hover:underline sm:justify-start"
          >
            Scoring summary and legend
          </RouterLink>
          <RouterLink
            v-if="isAdmin"
            :to="`/leagues/${league._id}/admin`"
            class="flex min-h-[48px] w-full items-center justify-center rounded-xl border border-amber-200 bg-amber-50 px-5 py-3 text-base font-semibold text-amber-900 hover:bg-amber-100"
          >
            Admin results
          </RouterLink>
          <button
            v-if="isAdmin"
            type="button"
            class="flex min-h-[48px] w-full items-center justify-center rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-base font-semibold text-red-800 hover:bg-red-100"
            @click="deleteLeague"
          >
            Delete league
          </button>
        </section>

        <section class="mt-10">
          <h2 class="text-lg font-bold text-navy-900">Leaderboard</h2>
          <div class="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white [-webkit-overflow-scrolling:touch]">
            <table class="min-w-[640px] text-left text-sm">
              <thead class="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th class="whitespace-nowrap px-3 py-3 sm:px-4">Rank</th>
                  <th class="min-w-[8rem] px-3 py-3 sm:px-4">Name</th>
                  <th class="whitespace-nowrap px-3 py-3 sm:px-4">Points</th>
                  <th class="whitespace-nowrap px-3 py-3 sm:px-4">Correct</th>
                  <th class="whitespace-nowrap px-3 py-3 sm:px-4">Wrong</th>
                  <th class="whitespace-nowrap px-3 py-3 sm:px-4">Pending</th>
                  <th class="whitespace-nowrap px-3 py-3 sm:px-4">Unpicked</th>
                  <th class="min-w-[6rem] px-3 py-3 sm:px-4">Champion</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-for="row in leaderboard" :key="row.userId">
                  <td class="px-3 py-3 font-semibold sm:px-4">{{ row.rank }}</td>
                  <td class="max-w-[10rem] truncate px-3 py-3 sm:max-w-none sm:px-4">{{ row.name }}</td>
                  <td class="whitespace-nowrap px-3 py-3 sm:px-4">{{ row.totalPoints }}</td>
                  <td class="whitespace-nowrap px-3 py-3 text-emerald-700 sm:px-4">{{ row.correctPicks }}</td>
                  <td class="whitespace-nowrap px-3 py-3 text-red-600 sm:px-4">{{ row.incorrectPicks }}</td>
                  <td class="whitespace-nowrap px-3 py-3 text-slate-500 sm:px-4">{{ row.pendingPicks }}</td>
                  <td class="whitespace-nowrap px-3 py-3 text-slate-500 sm:px-4">{{ row.incompletePicks }}</td>
                  <td class="px-3 py-3 text-slate-700 sm:px-4">{{ row.championPick || '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="mt-10">
          <h2 class="text-lg font-bold text-navy-900">Members</h2>
          <ul class="mt-3 flex flex-wrap gap-2">
            <li
              v-for="m in league.members"
              :key="m._id || m"
              class="rounded-full bg-white px-3 py-1 text-sm font-medium text-slate-700 ring-1 ring-slate-200"
            >
              {{ m.name || m }}
            </li>
          </ul>
        </section>

        <div class="mt-10">
          <h3 class="font-semibold text-navy-900">Member brackets</h3>
          <p v-if="!locked" class="mt-2 text-sm text-slate-600">
            Hidden until the league locks so picks can’t be influenced.
          </p>
          <ul v-else class="mt-2 space-y-2">
            <li v-for="m in league.members" :key="m._id">
              <RouterLink
                :to="`/leagues/${league._id}/users/${m._id}`"
                class="inline-flex min-h-[44px] items-center text-sm font-medium text-sky-800 hover:underline"
              >
                {{ m.name }}’s bracket
              </RouterLink>
            </li>
          </ul>
        </div>
      </template>
    </main>
  </div>
</template>
