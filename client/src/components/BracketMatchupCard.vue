<script setup>
import { computed } from 'vue'
import TeamPickCard from './TeamPickCard.vue'
import {
  resolveCompetitor,
  advancesToLabel,
  dependsOnHint,
  formatScheduledAt,
  buildEliminatedTeamIds,
} from '../utils/bracketDisplay'
import { resolveOfficialSide, teamIdStr } from '../utils/officialBracket'

const props = defineProps({
  mode: { type: String, default: 'pick' },
  matchup: { type: Object, required: true },
  pickMap: { type: Object, default: () => ({}) },
  matchupsById: { type: Object, required: true },
  locked: { type: Boolean, default: false },
  /** When true (pick mode), show emerald ring on actual winner and red/dashed on wrong or eliminated picks */
  showPickResults: { type: Boolean, default: true },
})

const emit = defineEmits(['pick'])

const left = computed(() => {
  if (props.mode === 'official') return resolveOfficialSide(props.matchup, 1, props.matchupsById)
  return resolveCompetitor(props.matchup, 1, props.pickMap, props.matchupsById)
})

const right = computed(() => {
  if (props.mode === 'official') return resolveOfficialSide(props.matchup, 2, props.matchupsById)
  return resolveCompetitor(props.matchup, 2, props.pickMap, props.matchupsById)
})

const advances = computed(() => advancesToLabel(props.matchup))
const depends = computed(() =>
  props.mode === 'pick' ? dependsOnHint(props.matchup, props.pickMap, props.matchupsById) : null
)
const schedule = computed(() => formatScheduledAt(props.matchup.scheduledAt))

const actualId = computed(() => teamIdStr(props.matchup.actualWinner))

const mid = computed(() => props.matchup._id.toString())
const userPick = computed(() => props.pickMap[mid.value])

const eliminatedIds = computed(() => buildEliminatedTeamIds(props.matchupsById))

function officialHighlight(team) {
  if (!team || !actualId.value) return ''
  if (teamIdStr(team) === actualId.value) return 'won'
  return 'dim'
}

function pickSideHighlight(team) {
  if (!props.showPickResults || props.mode !== 'pick') return ''
  const tid = teamIdStr(team)
  if (!tid) return ''
  const aw = actualId.value
  const up = userPick.value
  if (aw && tid === aw) return 'won'
  if (aw && up === tid && tid !== aw) return 'lost'
  if (!aw && up === tid && eliminatedIds.value.has(tid)) return 'eliminated'
  return ''
}

function select(team) {
  emit('pick', props.matchup, team)
}
</script>

<template>
  <div
    class="relative rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:border-slate-200"
  >
    <div class="border-b border-slate-100 pb-3">
      <div class="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p class="text-xs font-bold uppercase tracking-wide text-slate-500">{{ matchup.displayRound }}</p>
          <p class="text-sm font-semibold text-navy-900">{{ matchup.key }}</p>
        </div>
        <p v-if="schedule" class="text-xs text-slate-500">{{ schedule }}</p>
      </div>
      <p v-if="advances" class="mt-2 text-xs text-sky-800">
        <span class="font-medium">Advances to:</span>
        {{ advances }}
      </p>
      <p v-if="depends" class="mt-1 text-xs text-amber-800">{{ depends }}</p>
    </div>

    <!-- Pick mode -->
    <div v-if="mode === 'pick'" class="mt-4">
      <div class="mb-2 flex items-center justify-center gap-2">
        <div class="h-px flex-1 bg-slate-200" />
        <span class="text-xs font-bold uppercase tracking-widest text-slate-400">vs</span>
        <div class="h-px flex-1 bg-slate-200" />
      </div>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <TeamPickCard
          :team="left"
          :selected="userPick === (left?._id ? left._id.toString() : '')"
          :disabled="locked || !left?._id"
          :highlight="pickSideHighlight(left)"
          @click="select(left)"
        />
        <TeamPickCard
          :team="right"
          :selected="userPick === (right?._id ? right._id.toString() : '')"
          :disabled="locked || !right?._id"
          :highlight="pickSideHighlight(right)"
          @click="select(right)"
        />
      </div>
    </div>

    <!-- Official mode -->
    <div v-else class="mt-4">
      <div class="mb-2 flex items-center justify-center gap-2">
        <div class="h-px flex-1 bg-slate-200" />
        <span class="text-xs font-bold uppercase tracking-widest text-slate-400">vs</span>
        <div class="h-px flex-1 bg-slate-200" />
      </div>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <TeamPickCard
          :team="left"
          :label="left?.name ? '' : 'TBD'"
          :selected="false"
          :disabled="true"
          :compact="true"
          :highlight="officialHighlight(left)"
        />
        <TeamPickCard
          :team="right"
          :label="right?.name ? '' : 'TBD'"
          :selected="false"
          :disabled="true"
          :compact="true"
          :highlight="officialHighlight(right)"
        />
      </div>
      <p v-if="matchup.actualWinner?.name" class="mt-3 text-center text-sm font-semibold text-emerald-800">
        Winner: {{ matchup.actualWinner.name }}
      </p>
      <p v-else class="mt-3 text-center text-sm text-slate-500">Result not entered yet</p>
    </div>
  </div>
</template>
