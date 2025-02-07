
import { mount } from '@vue/test-utils'
import StatCard from '../src/components/StatCard.vue'

test('renders the correct title and value', () => {
  const wrapper = mount(StatCard, {
    props: {
      title: 'Matches',
      value: 5,
    },
  })
  expect(wrapper.text()).toContain('Matches')
  expect(wrapper.text()).toContain('5')
})
