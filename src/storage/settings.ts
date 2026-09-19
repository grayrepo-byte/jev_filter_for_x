import type { Settings } from '../core/types'
import { TOPICS, WANTS } from '../core/types'

export const DEFAULT_SETTINGS: Settings = {
  locale: 'auto',
  enabled: true,
  hideNoise: true,
  minimumScore: 30,
  focusMode: false,
  focusScore: 70,
  interests: [...TOPICS],
  desiredValues: [...WANTS],
  hiddenNoiseTypes: ['DAILY', 'ENTERTAINMENT', 'RANT'],
}

const SETTINGS_KEY = 'settings'
const API_KEY = 'apiKey'
const AUTH_ERROR = 'authError'
let saveChain: Promise<void> = Promise.resolve()

export async function getSettings(): Promise<Settings> {
  const stored = await browser.storage.sync.get(SETTINGS_KEY)
  return { ...DEFAULT_SETTINGS, ...(stored[SETTINGS_KEY] ?? {}) }
}

export function saveSettings(patch: Partial<Settings>): Promise<void> {
  const operation = saveChain.then(async () => {
    const current = await getSettings()
    await browser.storage.sync.set({
      [SETTINGS_KEY]: { ...current, ...patch },
    })
  })
  saveChain = operation.catch(() => undefined)
  return operation
}

export async function getApiKey(): Promise<string> {
  const stored = await browser.storage.local.get(API_KEY)
  return (stored[API_KEY] as string | undefined) ?? ''
}

export async function setApiKey(key: string): Promise<void> {
  await browser.storage.local.set({ [API_KEY]: key })
}

export async function setAuthError(flag: boolean): Promise<void> {
  await browser.storage.local.set({ [AUTH_ERROR]: flag })
}

export async function getAuthError(): Promise<boolean> {
  const stored = await browser.storage.local.get(AUTH_ERROR)
  return stored[AUTH_ERROR] === true
}

export function onSettingsChanged(cb: (settings: Settings) => void): () => void {
  const listener = (
    changes: Record<string, chrome.storage.StorageChange>,
    area: string,
  ) => {
    if (area !== 'sync' || !changes[SETTINGS_KEY]) return
    cb({ ...DEFAULT_SETTINGS, ...(changes[SETTINGS_KEY].newValue ?? {}) })
  }
  browser.storage.onChanged.addListener(listener)
  return () => browser.storage.onChanged.removeListener(listener)
}
