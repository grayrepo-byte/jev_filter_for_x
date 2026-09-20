import { useEffect, useState } from 'react'
import {
  NOISE_TYPES,
  TOPICS,
  WANTS,
  type Settings,
} from '../../core/types'
import { MAX_LEVEL, SCORE_WEIGHTS } from '../../core/scoring'
import {
  DEFAULT_ENDPOINT,
  normalizeEndpoint,
  originPattern,
} from '../../core/endpoint'
import {
  LOCALE_NAMES,
  SUPPORTED_LOCALES,
  resolveLocale,
  t,
  type MessageKey,
} from '../../i18n'
import {
  getApiKey,
  getJevEndpoint,
  getSettings,
  saveSettings,
  setApiKey,
  setJevEndpoint,
} from '../../storage/settings'
import { label } from '../styles'

function toggleIn<T>(list: T[], value: T): T[] {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value]
}

export default function SignalFeedOptions() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [apiKey, setApiKeyInput] = useState('')
  const [endpoint, setEndpointInput] = useState(DEFAULT_ENDPOINT)
  const [endpointError, setEndpointError] = useState<MessageKey | null>(null)
  const [saved, setSaved] = useState(false)
  const [endpointSaved, setEndpointSaved] = useState(false)

  useEffect(() => {
    void getSettings().then(setSettings)
    void getApiKey().then(setApiKeyInput)
    void getJevEndpoint().then(setEndpointInput)
  }, [])

  const locale = settings?.locale ?? 'auto'
  const translate = (key: MessageKey) => t(key, locale)

  useEffect(() => {
    document.documentElement.lang = resolveLocale(locale)
    document.title = `JevFilterForX · ${translate('settings')}`
  }, [locale])

  if (!settings) {
    return <div className="p-8 text-slate-500">{translate('loading')}</div>
  }

  const update = (patch: Partial<Settings>) => {
    setSettings((current) => (current ? { ...current, ...patch } : current))
    void saveSettings(patch)
  }

  const saveEndpoint = async () => {
    const normalized = normalizeEndpoint(endpoint)
    if (!normalized) {
      setEndpointError('endpointInvalid')
      setEndpointSaved(false)
      return
    }

    if (normalized !== DEFAULT_ENDPOINT) {
      // Only the default host is granted in the manifest, so the background
      // worker cannot reach any other address until the user allows it.
      const granted = await browser.permissions.request({
        origins: [originPattern(normalized)],
      })
      if (!granted) {
        setEndpointError('endpointPermissionDenied')
        setEndpointSaved(false)
        return
      }
    }

    await setJevEndpoint(normalized)
    setEndpointInput(normalized)
    setEndpointError(null)
    setEndpointSaved(true)
  }

  return (
    <main className="mx-auto max-w-2xl space-y-8 p-8 text-sm text-slate-800">
      <header className="flex items-center gap-4">
        <img
          src="/icons/icon-48.png"
          alt=""
          width={48}
          height={48}
          className="h-12 w-12 rounded-xl"
        />
        <div>
          <h1 className="text-2xl font-semibold">JevFilterForX</h1>
          <p className="mt-1 text-slate-500">{translate('tagline')}</p>
        </div>
      </header>

      <section className="space-y-3 rounded-xl border border-slate-200 p-5">
        <h2 className="font-semibold">{translate('language')}</h2>
        <p className="text-slate-500">{translate('languageDescription')}</p>
        <select
          aria-label={translate('language')}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
          value={settings.locale}
          onChange={(event) =>
            update({ locale: event.target.value as Settings['locale'] })
          }
        >
          <option value="auto">{translate('browserLanguage')}</option>
          {SUPPORTED_LOCALES.map((supportedLocale) => (
            <option key={supportedLocale} value={supportedLocale}>
              {LOCALE_NAMES[supportedLocale]}
            </option>
          ))}
        </select>
      </section>

      <section className="space-y-4 rounded-xl border border-slate-200 p-5">
        <h2 className="font-semibold">{translate('apiSectionTitle')}</h2>
        {!apiKey && (
          <p className="rounded-lg bg-amber-50 p-3 text-amber-800">
            {translate('mockModeOptions')}
          </p>
        )}
        <label className="block space-y-1.5">
          <span>{translate('apiKeyLabel')}</span>
          <input
            aria-label={translate('apiKeyLabel')}
            type="password"
            value={apiKey}
            onChange={(event) => {
              setApiKeyInput(event.target.value)
              setSaved(false)
            }}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="rounded-lg bg-slate-900 px-4 py-2 font-medium text-white"
            onClick={async () => {
              await setApiKey(apiKey.trim())
              setApiKeyInput(apiKey.trim())
              setSaved(true)
            }}
          >
            {translate('saveKey')}
          </button>
          {saved && (
            <span className="text-emerald-700">{translate('saved')}</span>
          )}
        </div>
        <p className="text-slate-500">{translate('apiKeyStorage')}</p>

        <label className="block space-y-1.5">
          <span>{translate('endpointLabel')}</span>
          <input
            aria-label={translate('endpointLabel')}
            type="text"
            value={endpoint}
            onChange={(event) => {
              setEndpointInput(event.target.value)
              setEndpointError(null)
              setEndpointSaved(false)
            }}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="rounded-lg border border-slate-300 px-4 py-2 font-medium"
            onClick={saveEndpoint}
          >
            {translate('saveEndpoint')}
          </button>
          {endpointSaved && (
            <span className="text-emerald-700">{translate('saved')}</span>
          )}
        </div>
        {endpointError && (
          <p role="alert" className="rounded-lg bg-amber-50 p-3 text-amber-800">
            {translate(endpointError)}
          </p>
        )}
        <p className="text-slate-500">{translate('endpointHelp')}</p>
      </section>

      <section className="space-y-3 rounded-xl border border-slate-200 p-5">
        <h2 className="font-semibold">{translate('wantsHeading')}</h2>
        {WANTS.map((want) => (
          <label key={want} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.desiredValues.includes(want)}
              onChange={() =>
                update({
                  desiredValues: toggleIn(settings.desiredValues, want),
                })
              }
            />
            <span>{label(want, locale)}</span>
          </label>
        ))}
      </section>

      <section className="space-y-3 rounded-xl border border-slate-200 p-5">
        <h2 className="font-semibold">{translate('interests')}</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {TOPICS.map((topic) => (
            <label key={topic} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.interests.includes(topic)}
                onChange={() =>
                  update({ interests: toggleIn(settings.interests, topic) })
                }
              />
              <span>{label(topic, locale)}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-slate-200 p-5">
        <div>
          <h2 className="font-semibold">{translate('scoringTitle')}</h2>
          <p className="mt-1 text-slate-500">{translate('scoringIntro')}</p>
        </div>

        {([
          [
            translate('signalDimension'),
            SCORE_WEIGHTS.signal,
            translate('signalDimensionHelp'),
          ],
          [
            translate('actionDimension'),
            SCORE_WEIGHTS.action,
            translate('actionDimensionHelp'),
          ],
          [
            translate('originalDimension'),
            SCORE_WEIGHTS.original,
            translate('originalDimensionHelp'),
          ],
        ] as const).map(([name, weight, description]) => (
          <div key={name} className="flex gap-4 rounded-lg bg-slate-50 p-3">
            <strong className="w-16 shrink-0 text-right text-slate-900">
              {Math.round(weight * 100)}%
            </strong>
            <div>
              <div className="font-medium">{name}</div>
              <p className="mt-0.5 text-xs leading-5 text-slate-500">
                {description}
              </p>
            </div>
          </div>
        ))}

        <p className="rounded-lg border border-slate-200 p-3 text-xs leading-5 text-slate-600">
          {t('scoringFormula', locale, {
            signal: Math.round(SCORE_WEIGHTS.signal * 100),
            action: Math.round(SCORE_WEIGHTS.action * 100),
            original: Math.round(SCORE_WEIGHTS.original * 100),
            max: MAX_LEVEL,
          })}
        </p>
        <p className="font-medium text-slate-700">{translate('scoreBands')}</p>
        <p className="text-xs leading-5 text-slate-500">
          {translate('scoringNote')}
        </p>
      </section>

      <section className="space-y-4 rounded-xl border border-slate-200 p-5">
        <h2 className="font-semibold">{translate('filtering')}</h2>
        <label className="flex items-center justify-between">
          <span>{translate('hideNoise')}</span>
          <input
            type="checkbox"
            checked={settings.hideNoise}
            onChange={(event) => update({ hideNoise: event.target.checked })}
          />
        </label>
        <label className="flex items-center justify-between">
          <span>{translate('focusMode')}</span>
          <input
            type="checkbox"
            checked={settings.focusMode}
            onChange={(event) => update({ focusMode: event.target.checked })}
          />
        </label>
        <p className="rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-500">
          {t('focusModeHelp', locale, { score: settings.focusScore })}
        </p>

        {([
          [translate('minimumScore'), 'minimumScore'],
          [translate('focusThreshold'), 'focusScore'],
        ] as const).map(([name, key]) => (
          <label key={key} className="block space-y-1.5">
            <span className="flex justify-between">
              {name} <strong>{settings[key]}</strong>
            </span>
            <input
              aria-label={name}
              className="w-full accent-blue-600"
              type="range"
              min={0}
              max={100}
              value={settings[key]}
              onChange={(event) =>
                update({ [key]: Number(event.target.value) })
              }
            />
          </label>
        ))}

        <div className="space-y-2 border-t border-slate-100 pt-4">
          {NOISE_TYPES.map((noise) => (
            <label key={noise} className="flex items-center justify-between">
              <span>
                {t('hideCategory', locale, { category: label(noise, locale) })}
              </span>
              <input
                aria-label={t('hideCategory', locale, {
                  category: label(noise, locale),
                })}
                type="checkbox"
                checked={settings.hiddenNoiseTypes.includes(noise)}
                onChange={() =>
                  update({
                    hiddenNoiseTypes: toggleIn(
                      settings.hiddenNoiseTypes,
                      noise,
                    ),
                  })
                }
              />
            </label>
          ))}
        </div>
      </section>
    </main>
  )
}
