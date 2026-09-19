import type { Classification, Post } from './types'

export const MSG_CLASSIFY_REQUEST = 'signalfeed:classify-request'
export const MSG_CLASSIFICATION_RESULT = 'signalfeed:classification-result'

export type ClassifyRequest = {
  type: typeof MSG_CLASSIFY_REQUEST
  posts: Post[]
}

export type ClassificationResult = {
  type: typeof MSG_CLASSIFICATION_RESULT
  items: Classification[]
}

export function isClassificationResult(
  value: unknown,
): value is ClassificationResult {
  if (!value || typeof value !== 'object') return false
  const result = value as Partial<ClassificationResult>
  return (
    result.type === MSG_CLASSIFICATION_RESULT && Array.isArray(result.items)
  )
}
