import { describe, expect, it, vi } from 'vitest'
import { HIDDEN_ATTR, renderHidden } from './hidden'

describe('renderHidden', () => {
  it('shows the reason and restores on demand', () => {
    const restore = vi.fn()
    const hidden = renderHidden(
      { hidden: true, reason: 'Daily Life · Score 12' },
      restore,
    )
    expect(hidden.hasAttribute(HIDDEN_ATTR)).toBe(true)
    expect(hidden.textContent).toContain('Daily Life · Score 12')
    hidden.querySelector('summary')!.click()
    expect(restore).toHaveBeenCalledOnce()
  })

  it('handles a missing reason', () => {
    expect(
      renderHidden({ hidden: true, reason: null }, vi.fn()).textContent,
    ).toContain('JevFilterForX')
  })

  it('localizes the injected controls', () => {
    const hidden = renderHidden(
      { hidden: true, reason: '日常生活 · 分数 12' },
      vi.fn(),
      'zh-CN',
    )
    expect(hidden.textContent).toContain('JevFilterForX 已隐藏此帖子')
    expect(hidden.textContent).toContain('显示帖子')
  })
})
