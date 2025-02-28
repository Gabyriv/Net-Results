
import { calculateAverage } from '../src/utils/calculateStats'

test('calculates the average correctly', () => {
  expect(calculateAverage([10, 20, 30])).toBe(20)
  expect(calculateAverage([])).toBe(0)
})
