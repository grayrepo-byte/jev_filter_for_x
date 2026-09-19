import { describe, expect, it } from 'vitest'
import { MAX_LEVEL, SCORE_LEVELS, composeScore } from './scoring'

describe('composeScore', () => {
  it('maps zero to 0 and max to 100', () => {
    expect(composeScore({ signal: 0, action: 0, original: 0 })).toBe(0)
    expect(composeScore({ signal: 4, action: 4, original: 4 })).toBe(100)
  })

  it('applies the documented weights', () => {
    expect(composeScore({ signal: 4, action: 0, original: 0 })).toBe(40)
    expect(composeScore({ signal: 0, action: 4, original: 0 })).toBe(35)
    expect(composeScore({ signal: 0, action: 0, original: 4 })).toBe(25)
  })

  it('clamps invalid input', () => {
    expect(composeScore({ signal: 9, action: 9, original: 9 })).toBe(100)
    expect(composeScore({ signal: -3, action: 0, original: 0 })).toBe(0)
    expect(composeScore({ signal: Number.NaN, action: 0, original: 0 })).toBe(0)
  })

  it('defines five ordered levels', () => {
    expect(SCORE_LEVELS).toHaveLength(MAX_LEVEL + 1)
  })
})
