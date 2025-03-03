<template>
  <div class="bg-white p-6 rounded-lg shadow-lg flex items-center">
    <div class="mr-4">
      <i :class="`mdi ${icon} text-4xl text-blue-500`"></i>
    </div>
    <div>
      <h3 class="text-xl font-bold">{{ title }}</h3>
      <p class="text-2xl">{{ value }}</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'StatCard',
  props: {
    title: String,
    value: Number,
    icon: String,
  },
}
</script>

<style scoped>
/* Add any component-specific styles here */
</style>
