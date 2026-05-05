<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
    <p class="text-6xl font-black text-navy-900">404</p>
    <h1 class="mt-2 text-xl font-semibold text-slate-800">Page not found</h1>
    <RouterLink to="/" class="mt-6 text-sm font-semibold text-sky-800 hover:underline">Go home</RouterLink>
  </div>
</template>
