<template>
  <DefaultLayout>
    <div class="min-h-screen flex flex-col">
      <div class="relative w-full flex-grow banner-container overflow-hidden mb-4 shadow-lg bg-gradient-to-r from-blue-500"> <!-- Added gradient background -->
        <img src="/banner.jpeg" alt="Banner" class="absolute inset-0 w-full h-full object-cover opacity-100" /> <!-- Adjusted opacity for better text visibility -->
        <div class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-10">
          <div class="text-center">
            <h1 class="text-9xl font-bold text-white drop-shadow-lg">Volleyball Stats App</h1>
            <p class="text-4xl text-white mt-7 drop-shadow-lg">Track your team's performance and analyze match statistics.</p> <!-- Increased font size -->
          </div>
        </div>
      </div>
      <div class="container mx-auto p-4 flex justify-between mt-8">
        <!-- Additional content can go here -->
        <div class="w-1/3 p-4 bg-white rounded-lg shadow-lg">
          <h2 class="text-xl font-bold mb-7">Feature 1</h2>
          <p class="text-gray-700">Description of feature 1.</p>
        </div>
        <div class="w-1/3 p-4 bg-white rounded-lg shadow-lg">
          <h2 class="text-xl font-bold mb-7">Feature 2</h2>
          <p class="text-gray-700">Description of feature 2.</p>
        </div>
        <div class="w-1/3 p-4 bg-white rounded-lg shadow-lg">
          <h2 class="text-xl font-bold mb-7">Feature 3</h2>
          <p class="text-gray-700">Description of feature 3.</p>
        </div>
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
  position: relative;
}
</style>
