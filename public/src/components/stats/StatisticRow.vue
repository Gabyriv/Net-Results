<!-- StatisticRow.vue -->
<template>
  <div class="statistic-row">
    <div class="flex items-center justify-between mb-2">
      <h4 class="text-sm font-medium text-gray-600">{{ label }}</h4>
      <span class="text-lg font-semibold text-blue-600">{{ formatValue(value) }}</span>
    </div>
    
    <!-- Progress Bar -->
    <div class="relative h-2 bg-gray-200 rounded-full overflow-hidden">
      <div class="absolute top-0 left-0 h-full bg-blue-500 rounded-full transition-all duration-300"
           :style="{ width: `${Math.min(value, 100)}%` }">
      </div>
    </div>
    
    <!-- Detailed Stats -->
    <div class="mt-2 grid grid-cols-3 gap-4 text-sm">
      <div v-for="(value, label) in details" :key="label" class="text-center">
        <div class="font-semibold text-gray-900">{{ value }}</div>
        <div class="text-gray-500 text-xs">{{ formatLabel(label) }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Props
const props = defineProps<{
  label: string
  value: number
  details: Record<string, number>
}>()

// Utility functions
function formatValue(value: number): string {
  if (typeof value !== 'number') return '0'
  if (Number.isInteger(value)) return value.toString()
  return value.toFixed(1) + '%'
}

function formatLabel(label: string): string {
  return label.replace(/([A-Z])/g, ' $1').trim()
}
</script>

<style scoped>
.statistic-row {
  @apply bg-gray-50 rounded-lg p-4;
}
</style>