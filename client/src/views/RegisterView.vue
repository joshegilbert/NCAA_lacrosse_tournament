<script setup>
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()

const name = ref('')
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function submit() {
  error.value = ''
  loading.value = true
  try {
    await auth.register(name.value, email.value, password.value)
    router.push('/dashboard')
  } catch (e) {
    error.value = e.message || 'Could not register'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-slate-50 px-4">
    <div class="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 class="text-2xl font-bold text-navy-900">Create account</h1>
      <p class="mt-1 text-sm text-slate-600">Join your league and lock picks before game day.</p>

      <form class="mt-6 space-y-4" @submit.prevent="submit">
        <div>
          <label class="block text-sm font-medium text-slate-700">Name</label>
          <input
            v-model="name"
            required
            class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-navy-900"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700">Email</label>
          <input
            v-model="email"
            type="email"
            required
            class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-navy-900"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700">Password</label>
          <input
            v-model="password"
            type="password"
            required
            minlength="8"
            class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-navy-900"
          />
        </div>
        <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
        <button
          type="submit"
          :disabled="loading"
          class="w-full rounded-lg bg-navy-900 py-2.5 font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {{ loading ? 'Please wait…' : 'Register' }}
        </button>
      </form>

      <p class="mt-6 text-center text-sm text-slate-600">
        Already have an account?
        <RouterLink to="/login" class="font-medium text-navy-900 hover:underline">Log in</RouterLink>
      </p>
    </div>
  </div>
</template>
