import { describe, expect, it } from 'vitest'
import {
  SUPPORTED_LOCALES,
  resolveLocale,
  t,
  tagLabel,
} from './index'

describe('i18n', () => {
  it('ships the five supported country locales', () => {
    expect(SUPPORTED_LOCALES).toEqual([
      'en-US',
      'zh-CN',
      'ja-JP',
      'es-ES',
      'de-DE',
    ])
  })

  it('matches exact and language-only browser locales with English fallback', () => {
    expect(resolveLocale('auto', 'zh-CN')).toBe('zh-CN')
    expect(resolveLocale('auto', 'ja')).toBe('ja-JP')
    expect(resolveLocale('auto', 'fr-FR')).toBe('en-US')
    expect(resolveLocale('de-DE', 'zh-CN')).toBe('de-DE')
  })

  it('translates messages, parameters, and classification tags', () => {
    expect(t('settings', 'zh-CN')).toBe('设置')
    expect(t('hideCategory', 'de-DE', { category: 'Alltag' })).toBe(
      'Alltag ausblenden',
    )
    expect(tagLabel('PROGRAMMING', 'ja-JP')).toBe('プログラミング')
    expect(tagLabel('UNKNOWN_TAG', 'es-ES')).toBe('Unknown tag')
  })
})
