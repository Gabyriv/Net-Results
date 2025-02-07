// src/utils/calculateStats.js
export function calculateAverage(points) {
    if (!points.length) return 0
    return points.reduce((a, b) => a + b, 0) / points.length
  }
  