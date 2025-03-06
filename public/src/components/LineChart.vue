<template>
  <div>
    <canvas ref="canvas"></canvas>
  </div>
</template>

<script>
import { onMounted, watch, ref, onBeforeUnmount } from 'vue'
import { Chart, registerables } from 'chart.js'
Chart.register(...registerables);

export default {
  name: 'LineChart',
  props: {
    chartData: {
      type: Object,
      required: true
    },
    options: {
      type: Object,
      default: () => ({})
    },
    chartType: {
      type: String,
      default: 'line'
    }
  },
  setup(props) {
    const canvas = ref(null);
    let chart = null;

    // Initialize or update the chart
    const initChart = () => {
      if (chart) {
        // Destroy existing chart before creating a new one
        chart.destroy();
      }
      
      if (canvas.value) {
        // Determine the chart type - default to line if not specified in options
        const type = props.options.type || props.chartType || 'line';
        
        chart = new Chart(canvas.value, {
          type: type, // Use the determined chart type
          data: props.chartData,
          options: {
            ...props.options,
            responsive: true,
            maintainAspectRatio: false
          }
        });
      }
    };

    onMounted(() => {
      initChart();
    });

    // Update chart when chartData or options change
    watch(() => [props.chartData, props.options, props.chartType], () => {
      initChart();
    }, { deep: true });

    // Clean up on component unmount
    onBeforeUnmount(() => {
      if (chart) {
        chart.destroy();
      }
    });

    return { canvas }
  },
}
</script>

<style scoped>
/* Add any component-specific styles here */
</style>
