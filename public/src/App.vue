<template>
  <div>
    <router-view></router-view> <!-- This will render the current route component -->
    <fetchApi />
  </div>
</template>

<script>
import fetchApi from './components/FetchApi.vue';

export default {
  name: 'App',
  components: {
    fetchApi,
  },
};
</script>

<style>
/* Global styles can also go here, though Tailwind is imported via tailwind.css */
</style>
