<template>
  <div class="flex h-screen bg-gray-100">
    <!-- Sidebar -->
    <div class="w-64 bg-blue-800 text-white p-4">
      <div class="text-2xl font-bold mb-6">Dashboard</div>
      <ul>
        <li class="mb-4">
          <router-link to="/home" class="text-white hover:text-blue-400">Home</router-link>
        </li>
        <li class="mb-4">
          <router-link to="/players" class="text-white hover:text-blue-400">Players</router-link>
        </li>
        <li class="mb-4">
          <router-link to="/matches" class="text-white hover:text-blue-400">Matches</router-link>
        </li>
        <li class="mb-4">
          <router-link to="/statistics" class="text-white hover:text-blue-400">Statistics</router-link>
        </li>
      </ul>
    </div>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col">
      <!-- Top Header -->
      <div class="bg-white shadow-md p-4 flex items-center justify-between">
        <div class="text-2xl font-semibold">Dashboard</div>
        <div>
          <button class="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">Logout</button>
        </div>
      </div>

      <!-- Content Section -->
      <div class="flex-1 p-6 overflow-auto">
        <slot></slot> <!-- Content goes here -->
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DashboardLayout',
};
</script>

<style scoped>
/* Add any specific custom styles for your layout */
</style>
