<!-- PlayerStatistics.vue -->
<template>
  <div class="player-statistics">
    <!-- Summary Cards -->
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
      <div v-for="(stat, index) in summaryStats" :key="index" 
           class="bg-white rounded-lg shadow p-4 text-center">
        <h3 class="text-lg font-semibold text-gray-600">{{ stat.label }}</h3>
        <p class="text-2xl font-bold text-blue-600">{{ formatValue(stat.value) }}</p>
      </div>
    </div>

    <!-- Detailed Statistics -->
    <div class="bg-white rounded-lg shadow overflow-hidden">
      <div class="p-4 border-b">
        <h2 class="text-xl font-semibold">Detailed Statistics</h2>
      </div>
      
      <!-- Statistics Tabs -->
      <div class="border-b">
        <nav class="flex">
          <button v-for="tab in tabs" :key="tab.id"
                  @click="activeTab = tab.id"
                  :class="[
                    'px-4 py-2 text-sm font-medium',
                    activeTab === tab.id
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  ]">
            {{ tab.label }}
          </button>
        </nav>
      </div>

      <!-- Tab Content -->
      <div class="p-4">
        <!-- Attacking Stats -->
        <div v-if="activeTab === 'attacking'" class="space-y-4">
          <StatisticRow label="Hitting Percentage" 
                       :value="stats.derived.hittingPercentage"
                       :details="{
                         'Total Attacks': stats.totalAttacks,
                         'Kills': stats.kills,
                         'Errors': stats.attackErrors
                       }" />
        </div>

        <!-- Serving Stats -->
        <div v-if="activeTab === 'serving'" class="space-y-4">
          <StatisticRow label="Service Percentage"
                       :value="stats.derived.servicePercentage"
                       :details="{
                         'Total Serves': stats.totalServes,
                         'Aces': stats.serviceAces,
                         'Errors': stats.serviceErrors
                       }" />
        </div>

        <!-- Defense Stats -->
        <div v-if="activeTab === 'defense'" class="space-y-4">
          <StatisticRow label="Block Efficiency"
                       :value="stats.derived.blockEfficiency"
                       :details="{
                         'Total Blocks': stats.totalBlocks,
                         'Points': stats.blockPoints,
                         'Errors': stats.blockErrors
                       }" />
          <StatisticRow label="Dig Efficiency"
                       :value="stats.derived.digEfficiency"
                       :details="{
                         'Total Digs': stats.totalDigs,
                         'Successful': stats.digSuccess,
                         'Errors': stats.digErrors
                       }" />
        </div>

        <!-- Ball Control Stats -->
        <div v-if="activeTab === 'ballControl'" class="space-y-4">
          <StatisticRow label="Set Efficiency"
                       :value="stats.derived.setEfficiency"
                       :details="{
                         'Total Sets': stats.totalSets,
                         'Successful': stats.setSuccess,
                         'Errors': stats.setErrors
                       }" />
          <StatisticRow label="Receive Efficiency"
                       :value="stats.derived.receiveEfficiency"
                       :details="{
                         'Total Receives': stats.totalReceives,
                         'Successful': stats.receiveSuccess,
                         'Errors': stats.receiveErrors
                       }" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import StatisticRow from './StatisticRow.vue'

// Props
const props = defineProps<{
  stats: {
    // Core stats
    totalServes: number
    serviceAces: number
    serviceErrors: number
    totalAttacks: number
    kills: number
    attackErrors: number
    totalBlocks: number
    blockPoints: number
    blockErrors: number
    totalDigs: number
    digSuccess: number
    digErrors: number
    totalSets: number
    setSuccess: number
    setErrors: number
    totalReceives: number
    receiveSuccess: number
    receiveErrors: number
    
    // Derived stats
    derived: {
      hittingPercentage: number
      servicePercentage: number
      blockEfficiency: number
      digEfficiency: number
      setEfficiency: number
      receiveEfficiency: number
    }
  }
}>()

// State
const activeTab = ref('attacking')

// Tabs configuration
const tabs = [
  { id: 'attacking', label: 'Attacking' },
  { id: 'serving', label: 'Serving' },
  { id: 'defense', label: 'Defense' },
  { id: 'ballControl', label: 'Ball Control' }
]

// Computed summary statistics
const summaryStats = computed(() => [
  { label: 'Kills', value: props.stats.kills },
  { label: 'Hitting %', value: props.stats.derived.hittingPercentage },
  { label: 'Aces', value: props.stats.serviceAces },
  { label: 'Blocks', value: props.stats.blockPoints },
  { label: 'Digs', value: props.stats.digSuccess },
  { label: 'Set Success %', value: props.stats.derived.setEfficiency }
])

// Utility functions
function formatValue(value: number): string {
  if (typeof value !== 'number') return '0'
  if (Number.isInteger(value)) return value.toString()
  return value.toFixed(1) + '%'
}
</script>

<style scoped>
.player-statistics {
  @apply space-y-6;
}
</style>