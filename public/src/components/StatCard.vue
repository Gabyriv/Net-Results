<template>
  <div class="bg-white p-4 rounded shadow-md">
    <h2 class="text-xl font-bold">{{ title }}</h2>
    <p class="text-2xl">{{ value }}</p>
  </div>
</template>

<script>
export default {
  name: 'StatCard',
  props: {
    title: {
      type: String,
      required: true,
    },
    value: {
      type: Number,
      required: true,
    },
  },
}
</script>

<style scoped>
/* Add any specific custom styles for your component */
</style>
