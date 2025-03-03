<template>
  <div>
    <Navbar />
    <main>
      <slot></slot>
    </main>
  </div>
</template>

<script>
import Navbar from '../components/Navbar.vue'

export default {
  name: 'DefaultLayout',
  components: {
    Navbar,
  },
}
</script>

<style scoped>
/* Add any specific custom styles for your layout */
</style>
