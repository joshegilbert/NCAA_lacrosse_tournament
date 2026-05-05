<script setup>
defineProps({
  team: { type: Object, default: null },
  label: { type: String, default: '' },
  selected: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  compact: { type: Boolean, default: false },
  /** '', 'won' (actual winner), 'lost' (picked wrong vs result), 'eliminated' (picked team already out) */
  highlight: { type: String, default: '' },
})
</script>

<template>
  <button
    type="button"
    :disabled="disabled"
    class="flex min-h-[52px] w-full items-center gap-3 rounded-lg border px-3 py-3 text-left transition"
    :class="[
      selected
        ? 'border-navy-900 bg-navy-900 text-white shadow'
        : 'border-slate-200 bg-white hover:border-slate-300',
      disabled && !highlight && 'cursor-not-allowed opacity-50',
      disabled && highlight === 'won' && 'cursor-default opacity-100',
      highlight === 'won' && 'ring-2 ring-emerald-500 ring-offset-2',
      highlight === 'lost' && 'ring-2 ring-red-500 ring-offset-2',
      highlight === 'eliminated' && 'ring-2 ring-amber-600 ring-offset-2 ring-dashed',
      highlight === 'dim' && 'opacity-70',
    ]"
  >
    <div
      class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-slate-100 text-xs font-bold text-navy-900"
    >
      <img
        v-if="team?.logoUrl"
        :src="team.logoUrl"
        :alt="team.name"
        class="h-full w-full object-contain"
        @error="($e) => ($e.target.style.display = 'none')"
      />
      <span v-else>{{ (team?.name || '?').slice(0, 2).toUpperCase() }}</span>
    </div>
    <div class="min-w-0 flex-1">
      <p class="truncate font-semibold leading-tight">
        {{ label || team?.name || (disabled ? '—' : 'Pick prior games first') }}
      </p>
      <p v-if="team?.seed != null && team.seed !== ''" class="truncate text-xs text-slate-500">#{{ team.seed }} seed</p>
      <p v-if="!compact && team?.record" class="truncate text-xs opacity-80">{{ team.record }}</p>
      <p v-if="!compact && team?.conference" class="truncate text-xs text-slate-500">{{ team.conference }}</p>
    </div>
  </button>
</template>
