import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fakeBrowser } from '@webext-core/fake-browser'
import { JevAuthError } from '../../core/jev'
import type { Classification, Post } from '../../core/types'
import { getCached } from '../../storage/cache'
import {
  getAuthError,
  setApiKey,
  setAuthError,
} from '../../storage/settings'
import {
  createBackgroundPipeline,
  handlePosts,
  openSettingsPage,
} from './index'

const post = (id: string, text = 'hello'): Post => ({
  id,
  author: '@a',
  text,
})
const key = (name: string) => `${name}-${Math.random()}`

beforeEach(async () => {
  fakeBrowser.reset()
  vi.unstubAllGlobals()
  await setApiKey('')
  await setAuthError(false)
})

describe('handlePosts', () => {
  it('uses the mock without a key and caches results', async () => {
    const id = key('mock')
    const output = await handlePosts([post(id)])
    expect(output[0].tweetId).toBe(id)
    expect((await getCached([id])).has(id)).toBe(true)
  })

  it('serves cache hits and classifies misses in input order', async () => {
    const first = key('first')
    const second = key('second')
    const cached = (await handlePosts([post(first)]))[0]
    const output = await handlePosts([post(first), post(second)])
    expect(output[0]).toEqual(cached)
    expect(output.map((item) => item.tweetId)).toEqual([first, second])
  })

  it('handles empty input', async () => {
    await expect(handlePosts([])).resolves.toEqual([])
  })

  it('sets and clears the invalid-key flag', async () => {
    await setApiKey('sk-bad')
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 401 }),
    )
    await expect(handlePosts([post(key('bad'))])).rejects.toBeInstanceOf(
      JevAuthError,
    )
    expect(await getAuthError()).toBe(true)

    await setApiKey('sk-good')
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ answers: {} }),
      }),
    )
    await handlePosts([post(key('good'))])
    expect(await getAuthError()).toBe(false)
  })
})

describe('extension action', () => {
  it('opens the standalone settings page', async () => {
    const open = vi.fn().mockResolvedValue(undefined)
    await openSettingsPage(open)
    expect(open).toHaveBeenCalledOnce()
  })
})

describe('background pipeline', () => {
  it('batches requests and returns classifications directly to the sender', async () => {
    const batchSizes: number[] = []
    const publish = vi.fn().mockResolvedValue(undefined)
    const pipeline = createBackgroundPipeline({
      batchSize: 5,
      flushMs: 0,
      classify: vi.fn(async (posts: Post[]) => {
        batchSizes.push(posts.length)
        return posts.map((post): Classification => ({
          tweetId: post.id,
          topics: ['AI'],
          value: 'USEFUL',
          wants: ['LEARN'],
          noiseType: null,
          score: 90,
          confidence: 1,
          classifiedAt: Date.now(),
          model: 'test',
        }))
      }),
      publish,
    })
    const posts = Array.from({ length: 7 }, (_, index) =>
      post(`pipeline-${index}`),
    )

    const result = await pipeline.requestPosts(posts)

    expect(batchSizes).toEqual([5, 2])
    expect(result.map((item) => item.tweetId)).toEqual(
      posts.map((item) => item.id),
    )
    expect(publish).toHaveBeenCalledTimes(2)
  })

  it('allows a failed request to be retried', async () => {
    const classification: Classification = {
      tweetId: 'retry',
      topics: ['AI'],
      value: 'USEFUL',
      wants: ['LEARN'],
      noiseType: null,
      score: 90,
      confidence: 1,
      classifiedAt: Date.now(),
      model: 'test',
    }
    const classify = vi
      .fn()
      .mockRejectedValueOnce(new Error('temporary'))
      .mockResolvedValueOnce([classification])
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const pipeline = createBackgroundPipeline({
      batchSize: 1,
      classify,
      publish: vi.fn().mockResolvedValue(undefined),
    })

    await expect(pipeline.requestPosts([post('retry')])).rejects.toThrow(
      'temporary',
    )
    await expect(pipeline.requestPosts([post('retry')])).resolves.toEqual([
      classification,
    ])
    expect(error).toHaveBeenCalledOnce()
  })
})
