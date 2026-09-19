import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS } from '../storage/settings'
import { decideVisibility } from './policy'
import type { Classification, Settings } from './types'

const base: Classification = {
  tweetId: '1',
  topics: ['AI'],
  value: 'USEFUL',
  wants: ['LEARN'],
  noiseType: null,
  score: 80,
  confidence: 0.9,
  classifiedAt: 0,
  model: 'test',
}
const settings = (patch: Partial<Settings> = {}): Settings => ({
  ...DEFAULT_SETTINGS,
  ...patch,
})

describe('decideVisibility', () => {
  it('shows everything when disabled', () => {
    expect(
      decideVisibility(
        { ...base, value: 'NOISE', score: 2 },
        settings({ enabled: false }),
      ),
    ).toEqual({ hidden: false, reason: null })
  })

  it('hides noise or a low score when noise filtering is enabled', () => {
    expect(
      decideVisibility(
        { ...base, value: 'NOISE', score: 90 },
        settings(),
      ).hidden,
    ).toBe(true)
    expect(
      decideVisibility(
        { ...base, value: 'NEUTRAL', score: 12 },
        settings(),
      ).hidden,
    ).toBe(true)
  })

  it('does not hide a low score when noise filtering is off', () => {
    expect(
      decideVisibility(
        { ...base, value: 'NEUTRAL', score: 12 },
        settings({ hideNoise: false, hiddenNoiseTypes: [] }),
      ).hidden,
    ).toBe(false)
  })

  it('hides muted noise types and labels the reason', () => {
    expect(
      decideVisibility(
        { ...base, noiseType: 'RANT', score: 95 },
        settings({ hiddenNoiseTypes: ['RANT'] }),
      ).reason,
    ).toBe('Rant · Score 95')
  })

  it('enforces the focus threshold', () => {
    expect(
      decideVisibility(
        { ...base, score: 40 },
        settings({ focusMode: true, focusScore: 70 }),
      ).reason,
    ).toBe('Focus Mode · Score 40')
    expect(
      decideVisibility(
        { ...base, score: 88 },
        settings({ focusMode: true, focusScore: 70 }),
      ).hidden,
    ).toBe(false)
  })

  it('labels category and plain low-score collapses', () => {
    expect(
      decideVisibility(
        { ...base, value: 'NOISE', noiseType: 'DAILY', score: 8 },
        settings(),
      ).reason,
    ).toBe('Daily Life · Score 8')
    expect(
      decideVisibility(
        { ...base, value: 'NEUTRAL', score: 8 },
        settings(),
      ).reason,
    ).toBe('Low-value content · Score 8')
  })

  it('localizes visibility reasons', () => {
    expect(
      decideVisibility(
        { ...base, value: 'NOISE', noiseType: 'DAILY', score: 8 },
        settings({ locale: 'zh-CN' }),
      ).reason,
    ).toBe('日常生活 · 分数 8')
  })
})
