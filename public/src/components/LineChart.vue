<template>
  <div>
    <canvas ref="canvas"></canvas>
  </div>
</template>

<script>
import { onMounted, ref } from 'vue'
import { Chart, registerables } from 'chart.js'
Chart.register(...registerables);

export default {
  name: 'LineChart',
  props: {
    data: Object,
  },
  setup(props) {
    const canvas = ref(null)

    onMounted(() => {
      new Chart(canvas.value, {
        type: 'line',
        data: props.data,
        options: {
          responsive: true,
          scales: {
            x: {
              display: true,
              title: {
                display: true,
                text: 'Date',
              },
            },
            y: {
              display: true,
              title: {
                display: true,
                text: 'Count',
              },
            },
          },
        },
      })
    })

    return { canvas }
  },
}
</script>

<style scoped>
/* Add any component-specific styles here */
</style>