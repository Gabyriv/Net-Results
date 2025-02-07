
<template>
  <DefaultLayout>
    <div class="container mx-auto p-4">
      <h1 class="text-3xl font-bold mb-4">Welcome to the Volleyball Stats App</h1>
      <p class="text-lg">Track your team's performance and analyze match statistics.</p>
      <nav class="bg-gray-800 p-4">
    <div class="container mx-auto flex justify-between">
      <router-link to="/" class="text-white">Home</router-link>
      <router-link to="/login" class="text-white">Login</router-link>
    </div>
  </nav>
    </div>
  </DefaultLayout>
</template>

<script>
import DefaultLayout from "../layouts/DefaultLayout.vue";

export default {
  name: "Home",
  components: {
    DefaultLayout,
  },
};
</script>
