import { describe, expect, it, vi } from 'vitest'
import type { Classification } from '../core/types'
import { BADGE_ATTR, renderBadge } from './badge'

const classification = (
  patch: Partial<Classification> = {},
): Classification => ({
  tweetId: '1',
  topics: ['AI', 'STARTUP'],
  value: 'USEFUL',
  wants: ['MAKE_MONEY', 'OPPORTUNITY'],
  noiseType: null,
  score: 91,
  confidence: 0.9,
  classifiedAt: 0,
  model: 'test',
  ...patch,
})

describe('renderBadge', () => {
  it('renders a removable, isolated, noninteractive badge', () => {
    const badge = renderBadge(classification())
    expect(badge.hasAttribute(BADGE_ATTR)).toBe(true)
    expect(badge.style.getPropertyValue('all')).toBe('initial')
    expect(badge.querySelectorAll('button')).toHaveLength(0)
    expect(badge.textContent).toContain('91')
    expect(badge.textContent).toContain('Make Money')
  })

  it('caps tags and assigns score tiers', () => {
    const badge = renderBadge(
      classification({
        topics: ['AI', 'STARTUP', 'CRYPTO'],
        wants: ['LEARN', 'INSIGHT', 'OPPORTUNITY'],
      }),
    )
    expect(badge.querySelectorAll('[data-role="topic"]')).toHaveLength(2)
    expect(badge.querySelectorAll('[data-role="want"]')).toHaveLength(2)
    expect(badge.dataset.tier).toBe('high')
    expect(renderBadge(classification({ score: 50 })).dataset.tier).toBe('mid')
    expect(renderBadge(classification({ score: 10 })).dataset.tier).toBe('low')
  })

  it('localizes topic and value labels', () => {
    const badge = renderBadge(classification(), 'zh-CN')
    expect(badge.textContent).toContain('人工智能')
    expect(badge.textContent).toContain('赚钱')
  })

  it('offers a localized re-hide action only when requested', () => {
    const onHideAgain = vi.fn()
    const badge = renderBadge(classification(), 'zh-CN', onHideAgain)
    const action = badge.querySelector<HTMLButtonElement>('button')

    expect(action).not.toBeNull()
    expect(action).toHaveTextContent('重新隐藏')
    action!.click()
    expect(onHideAgain).toHaveBeenCalledOnce()
  })
})
