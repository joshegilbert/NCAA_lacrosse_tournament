<script setup>
import { onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
onMounted(() => auth.fetchMe())
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-slate-100 to-white">
    <header class="border-b border-slate-200 bg-white/80 backdrop-blur">
      <div class="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4">
        <span class="text-lg font-bold tracking-tight text-navy-900">Lax Bracket Challenge</span>
        <div class="flex flex-wrap items-center gap-2">
          <template v-if="auth.user">
            <RouterLink
              to="/dashboard"
              class="min-h-[44px] content-center rounded-lg px-4 py-2 text-sm font-medium text-navy-900 hover:bg-slate-100"
            >
              Dashboard
            </RouterLink>
          </template>
          <template v-else>
            <RouterLink
              to="/login"
              class="rounded-lg px-4 py-2 text-sm font-medium text-navy-900 hover:bg-slate-100"
            >
              Log in
            </RouterLink>
            <RouterLink
              to="/register"
              class="rounded-lg bg-navy-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-slate-800"
            >
              Register
            </RouterLink>
          </template>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-3xl px-4 py-16 text-center">
      <p class="text-sm font-semibold uppercase tracking-wider text-slate-500">NCAA Division I · Men’s Lacrosse</p>
      <h1 class="mt-3 text-4xl font-bold tracking-tight text-navy-900 md:text-5xl">
        Private bracket pools for your crew
      </h1>
      <p class="mx-auto mt-5 max-w-xl text-lg text-slate-600">
        Create a league, invite friends with a code, fill your bracket before the lock, then track points as results come in—March Madness style, built for lacrosse.
      </p>
      <div class="mt-10 flex flex-wrap justify-center gap-4">
        <RouterLink
          v-if="!auth.user"
          to="/register"
          class="inline-flex rounded-xl bg-navy-900 px-8 py-3 text-base font-semibold text-white shadow-lg hover:bg-slate-800"
        >
          Get started
        </RouterLink>
        <RouterLink
          v-if="!auth.user"
          to="/login"
          class="inline-flex rounded-xl border border-slate-300 bg-white px-8 py-3 text-base font-semibold text-navy-900 hover:bg-slate-50"
        >
          I have an account
        </RouterLink>
        <div v-if="auth.user" class="mt-10 flex flex-wrap justify-center gap-3">
          <RouterLink
            to="/dashboard"
            class="inline-flex min-h-[44px] items-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-navy-900 shadow-sm hover:bg-slate-50"
          >
            Go to dashboard
          </RouterLink>
        </div>
      </div>
    </main>
  </div>
</template>
