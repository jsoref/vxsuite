import { find } from './find'
test('find', () => {
  expect(find([1, 2, 3, 4], (number: number) => number > 2, 10)).toBe(3)
  expect(find([1, 2, 3, 4], (number: number) => number > 20, 10)).toBe(10)

  expect(find(['mirrorball', 'daylight'], (s) => s === 'mirrorball')).toBe(
    'mirrorball'
  )
  expect(() => find(['mirrorball', 'daylight'], (s) => s === '')).toThrow()
})
