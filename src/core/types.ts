export const TOPICS = [
  'AI',
  'PROGRAMMING',
  'STARTUP',
  'BUSINESS',
  'WEB3',
  'CRYPTO',
  'FINANCE',
  'MARKETING',
  'PRODUCT',
] as const
export type Topic = (typeof TOPICS)[number]

export const WANTS = [
  'MAKE_MONEY',
  'LEARN',
  'OPPORTUNITY',
  'INSIGHT',
  'SELF_IMPROVEMENT',
] as const
export type Want = (typeof WANTS)[number]

export const NOISE_TYPES = [
  'DAILY',
  'ENTERTAINMENT',
  'RANT',
  'MEME',
  'PROMOTION',
] as const
export type NoiseType = (typeof NOISE_TYPES)[number]

export type Value = 'USEFUL' | 'NEUTRAL' | 'NOISE'

export type Post = {
  id: string
  author: string
  text: string
}

export type Scores = {
  signal: number
  action: number
  original: number
}

export type Classification = {
  tweetId: string
  topics: Topic[]
  value: Value
  wants: Want[]
  noiseType: NoiseType | null
  score: number
  confidence: number
  classifiedAt: number
  model: string
}

export type Settings = {
  locale: LocalePreference
  enabled: boolean
  hideNoise: boolean
  minimumScore: number
  focusMode: boolean
  focusScore: number
  interests: Topic[]
  desiredValues: Want[]
  hiddenNoiseTypes: NoiseType[]
}
import type { LocalePreference } from '../i18n'
