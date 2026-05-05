<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { api } from '../services/api'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()

const leagues = ref([])
const createName = ref('')
const inviteCode = ref('')
const error = ref('')
const loading = ref(true)

async function refresh() {
  loading.value = true
  try {
    const data = await api('/leagues')
    leagues.value = data.leagues || []
  } finally {
    loading.value = false
  }
}

async function createLeague() {
  error.value = ''
  try {
    const data = await api('/leagues', {
      method: 'POST',
      body: JSON.stringify({ name: createName.value }),
    })
    createName.value = ''
    router.push(`/leagues/${data.league._id}`)
  } catch (e) {
    error.value = e.message || 'Could not create league'
  }
}

async function joinLeague() {
  error.value = ''
  try {
    const data = await api('/leagues/join', {
      method: 'POST',
      body: JSON.stringify({ inviteCode: inviteCode.value }),
    })
    inviteCode.value = ''
    router.push(`/leagues/${data.league._id}`)
  } catch (e) {
    error.value = e.message || 'Could not join'
  }
}

function logout() {
  auth.logout()
  router.push('/')
}

onMounted(refresh)
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <header class="border-b border-slate-200 bg-white">
      <div class="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 class="text-xl font-bold text-navy-900">Dashboard</h1>
        <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span class="max-w-[12rem] truncate text-sm text-slate-600 sm:max-w-xs">{{ auth.user?.name }}</span>
          <button
            type="button"
            class="min-h-[44px] text-sm font-medium text-slate-600 hover:text-navy-900"
            @click="logout"
          >
            Log out
          </button>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-5xl px-4 py-8">
      <p class="text-slate-600">Your leagues and invites.</p>

      <div class="mt-8 grid gap-8 lg:grid-cols-2">
        <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 class="text-lg font-bold text-navy-900">Create a league</h2>
          <form class="mt-4 flex flex-col gap-3 sm:flex-row" @submit.prevent="createLeague">
            <input
              v-model="createName"
              required
              placeholder="League name"
              class="min-h-[44px] flex-1 rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-navy-900"
            />
            <button
              type="submit"
              class="min-h-[44px] rounded-lg bg-navy-900 px-4 py-2 font-semibold text-white hover:bg-slate-800"
            >
              Create
            </button>
          </form>
        </section>

        <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 class="text-lg font-bold text-navy-900">Join with invite code</h2>
          <form class="mt-4 flex flex-col gap-3 sm:flex-row" @submit.prevent="joinLeague">
            <input
              v-model="inviteCode"
              required
              placeholder="Invite code"
              class="min-h-[44px] flex-1 rounded-lg border border-slate-300 px-3 py-2 uppercase outline-none focus:border-navy-900"
            />
            <button
              type="submit"
              class="min-h-[44px] rounded-lg border border-slate-300 bg-white px-4 py-2 font-semibold text-navy-900 hover:bg-slate-50"
            >
              Join
            </button>
          </form>
        </section>
      </div>

      <p v-if="error" class="mt-6 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{{ error }}</p>

      <section class="mt-10">
        <h2 class="text-lg font-bold text-navy-900">Your leagues</h2>
        <p v-if="loading" class="mt-2 text-slate-600">Loading…</p>
        <ul v-else-if="leagues.length" class="mt-4 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
          <li v-for="lg in leagues" :key="lg._id">
            <RouterLink
              :to="`/leagues/${lg._id}`"
              class="flex items-center justify-between px-4 py-4 hover:bg-slate-50"
            >
              <span class="font-semibold text-navy-900">{{ lg.name }}</span>
              <span class="text-sm text-slate-500">{{ lg.members?.length }} members</span>
            </RouterLink>
          </li>
        </ul>
        <p v-else class="mt-2 text-slate-600">No leagues yet — create one or join with a code.</p>
      </section>
    </main>
  </div>
</template>
