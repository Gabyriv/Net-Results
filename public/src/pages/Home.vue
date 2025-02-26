<template>
  <DefaultLayout>
    <div class="container mx-auto p-4">
      <div class="relative w-full h-screen banner-container overflow-hidden mb-4 shadow-lg bg-gray-800">
        <img src="/banner.jpeg" alt="Banner" class="w-full h-full object-cover" />
        <div class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div class="text-center">
            <h1 class="text-7xl font-bold text-white">Volleyball Stats App</h1>
            <p class="text-lg text-white mt-4">Track your team's performance and analyze match statistics.</p>
          </div>
        </div>
      </div>
      <div class="flex justify-between">
        <!-- Additional content can go here -->
      </div>
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

<style scoped>
/* You can add custom styles if needed here */
.banner-container {
  width: 100%;
  height: 100vh; /* Full height of the viewport */
}
</style>