<template>
  <div>
    <router-view></router-view> <!-- This will render the current route component -->
    <fetchApi />
    <FetchData />
    <ul>
      <li v-for="todo in todos" :key="todo.id">{{ todo.name }}</li>
    </ul>
  </div>
</template>

<script>
import fetchApi from './components/FetchApi.vue'
import FetchData from './components/FetchData.vue'
import { supabase } from './config/supabase_client'

export default {
  name: 'App',
  components: {
    fetchApi,
    FetchData,
  },
}
</script>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from './config/supabase_client'

const todos = ref([])
const error = ref(null)

async function getTodos() {
  try {
    const { data, err } = await supabase.from('Team').select()
    if (err) {
      console.error('Error fetching data:', err)
      error.value = err.message
    } else {
      console.log('Fetched data:', data)
      todos.value = data
      error.value = null
    }
  } catch (e) {
    console.error('Unexpected error:', e)
    error.value = e.message
  }
}

onMounted(() => {
  getTodos()
})
</script>

<style>
/* Global styles can also go here, though Tailwind is imported via tailwind.css */
</style>
