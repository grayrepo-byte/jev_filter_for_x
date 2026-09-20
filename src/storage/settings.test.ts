import { describe, it, expect, beforeEach, vi } from 'vitest'
import { fakeBrowser } from '@webext-core/fake-browser'
import {
  DEFAULT_SETTINGS,
  getAuthError,
  getJevEndpoint,
  getSettings,
  onSettingsChanged,
  saveSettings,
  getApiKey,
  setAuthError,
  setApiKey,
  setJevEndpoint,
} from './settings'
import { DEFAULT_ENDPOINT } from '../core/endpoint'

beforeEach(() => {
  fakeBrowser.reset()
})

describe('settings', () => {
  it('returns defaults when nothing is stored', async () => {
    expect(await getSettings()).toEqual(DEFAULT_SETTINGS)
  })

  it('merges a partial patch over defaults', async () => {
    await saveSettings({ minimumScore: 55 })
    const s = await getSettings()
    expect(s.minimumScore).toBe(55)
    expect(s.hideNoise).toBe(DEFAULT_SETTINGS.hideNoise)
  })

  it('persists the api key in local storage, not sync', async () => {
    await setApiKey('sk-test')
    expect(await getApiKey()).toBe('sk-test')

    const local = await browser.storage.local.get('apiKey')
    expect(local.apiKey).toBe('sk-test')

    const sync = await browser.storage.sync.get('apiKey')
    expect(sync.apiKey).toBeUndefined()
  })

  it('reads api key as empty string when unset', async () => {
    expect(await getApiKey()).toBe('')
  })

  it('returns the default jev endpoint when unset', async () => {
    expect(await getJevEndpoint()).toBe(DEFAULT_ENDPOINT)
  })

  it('persists a custom jev endpoint in local storage, not sync', async () => {
    await setJevEndpoint('https://jev.example.com/v1/systemone')

    expect(await getJevEndpoint()).toBe('https://jev.example.com/v1/systemone')
    expect((await browser.storage.local.get('jevEndpoint')).jevEndpoint).toBe(
      'https://jev.example.com/v1/systemone',
    )
    expect(
      (await browser.storage.sync.get('jevEndpoint')).jevEndpoint,
    ).toBeUndefined()
  })

  it('returns the default jev endpoint when the stored value is blank', async () => {
    await setJevEndpoint('')
    expect(await getJevEndpoint()).toBe(DEFAULT_ENDPOINT)
  })

  it('keeps authentication errors in local storage', async () => {
    expect(await getAuthError()).toBe(false)

    await setAuthError(true)

    expect(await getAuthError()).toBe(true)
    expect(await browser.storage.local.get('authError')).toEqual({
      authError: true,
    })
    expect(await browser.storage.sync.get('authError')).toEqual({})
  })

  it('notifies subscribers with defaults merged into sync changes', async () => {
    const listener = vi.fn()
    const unsubscribe = onSettingsChanged(listener)

    await browser.storage.sync.set({ settings: { minimumScore: 65 } })

    expect(listener).toHaveBeenCalledOnce()
    expect(listener).toHaveBeenCalledWith({
      ...DEFAULT_SETTINGS,
      minimumScore: 65,
    })

    unsubscribe()
    await browser.storage.sync.set({ settings: { minimumScore: 80 } })
    expect(listener).toHaveBeenCalledOnce()
  })

  it('ignores local and unrelated storage changes', async () => {
    const listener = vi.fn()
    const unsubscribe = onSettingsChanged(listener)

    await browser.storage.local.set({ settings: { minimumScore: 65 } })
    await browser.storage.sync.set({ anotherSetting: true })

    expect(listener).not.toHaveBeenCalled()
    unsubscribe()
  })
})
