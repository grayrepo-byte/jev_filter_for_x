import { describe, expect, it } from 'vitest'
import { CACHE_TTL_MS, getCached, pruneExpired, putCached } from './cache'
import type { Classification } from '../core/types'

const item = (tweetId: string, classifiedAt = Date.now()): Classification => ({
  tweetId,
  topics: ['AI'],
  value: 'USEFUL',
  wants: ['LEARN'],
  noiseType: null,
  score: 90,
  confidence: 0.9,
  classifiedAt,
  model: 'test',
})

describe('classification cache', () => {
  it('stores requested keys and overwrites entries', async () => {
    const key = `store-${Math.random()}`
    await putCached([item(key)])
    await putCached([{ ...item(key), score: 10 }])
    expect((await getCached([key, 'missing'])).get(key)?.score).toBe(10)
  })

  it('ignores and prunes expired entries', async () => {
    const key = `old-${Math.random()}`
    await putCached([item(key, Date.now() - CACHE_TTL_MS - 1)])
    expect((await getCached([key])).size).toBe(0)
    expect(await pruneExpired()).toBeGreaterThanOrEqual(1)
  })

  it('handles empty inputs', async () => {
    await expect(putCached([])).resolves.toBeUndefined()
    expect((await getCached([])).size).toBe(0)
  })
})
