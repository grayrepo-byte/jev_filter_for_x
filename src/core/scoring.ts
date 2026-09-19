import type { Scores } from './types'

export const SCORE_WEIGHTS = {
  signal: 0.4,
  action: 0.35,
  original: 0.25,
} as const

export const MAX_LEVEL = 4

export const SCORE_LEVELS = [
  'Nothing of substance: pure filler, pleasantries, or reaction only.',
  'Mostly filler with a small factual crumb.',
  'Solid but unremarkable: the point is real yet widely known.',
  'Notably worthwhile: specific, non-obvious, and concrete.',
  'Exceptional: hard-won specificity that changes what the reader can do.',
] as const

function clampLevel(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.min(MAX_LEVEL, Math.max(0, value))
}

export function composeScore(scores: Scores): number {
  const weighted =
    clampLevel(scores.signal) * SCORE_WEIGHTS.signal +
    clampLevel(scores.action) * SCORE_WEIGHTS.action +
    clampLevel(scores.original) * SCORE_WEIGHTS.original
  return Math.round((weighted / MAX_LEVEL) * 100)
}
