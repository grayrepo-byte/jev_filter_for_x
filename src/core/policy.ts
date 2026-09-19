import { t, tagLabel } from '../i18n'
import type { Classification, Settings } from './types'

export type HideDecision = {
  hidden: boolean
  reason: string | null
}

const VISIBLE: HideDecision = { hidden: false, reason: null }

export function decideVisibility(
  classification: Classification,
  settings: Settings,
): HideDecision {
  if (!settings.enabled) return VISIBLE

  if (settings.focusMode && classification.score < settings.focusScore) {
    return {
      hidden: true,
      reason: `${t('focusMode', settings.locale)} · ${t('score', settings.locale)} ${classification.score}`,
    }
  }

  if (
    classification.noiseType &&
    settings.hiddenNoiseTypes.includes(classification.noiseType)
  ) {
    return {
      hidden: true,
      reason: `${tagLabel(classification.noiseType, settings.locale)} · ${t('score', settings.locale)} ${classification.score}`,
    }
  }

  if (
    settings.hideNoise &&
    (classification.value === 'NOISE' ||
      classification.score < settings.minimumScore)
  ) {
    return {
      hidden: true,
      reason: classification.noiseType
        ? `${tagLabel(classification.noiseType, settings.locale)} · ${t('score', settings.locale)} ${classification.score}`
        : `${t('lowValue', settings.locale)} · ${t('score', settings.locale)} ${classification.score}`,
    }
  }

  return VISIBLE
}
