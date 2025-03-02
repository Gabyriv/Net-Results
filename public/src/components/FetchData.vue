<template>
  <div>
    <h1>Data from Supabase:</h1>
    <div v-if="error" class="error-message">
      Error: {{ error }}
    </div>
    <ul v-if="data.length > 0">
      <li v-for="item in data" :key="item.id">{{ item.name }}</li>
    </ul>
    <p v-else-if="!error">Loading data...</p>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { supabase } from '../config/supabase_client'

export default {
  name: 'FetchData',
  setup() {
    const data = ref([])
    const error = ref(null)

    const fetchData = async () => {
      const { data: items, error: fetchError } = await supabase
        .from('Team')
        .select('name')

      if (fetchError) {
        console.error('Error fetching data:', fetchError)
        error.value = fetchError.message
      } else {
        data.value = items
      }
    }

    onMounted(() => {
      fetchData()
    })

    return {
      data,
      error,
    }
  },
}
</script>

<style scoped>
.error-message {
  color: red;
  margin-top: 10px;
}
</style>