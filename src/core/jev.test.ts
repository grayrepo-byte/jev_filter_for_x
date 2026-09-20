import { describe, expect, it, vi } from 'vitest'
import { TOPICS, WANTS, type Post } from './types'
import {
  JevAuthError,
  JevClassifier,
  JevRequestError,
  buildQuestions,
  mapAnswers,
} from './jev'

const posts: Post[] = [
  { id: '111', author: '@john', text: 'first' },
  { id: '222', author: '@mike', text: 'second' },
]

describe('buildQuestions', () => {
  it('builds 19 indexed questions per post', () => {
    const questions = buildQuestions(posts)
    expect(Object.keys(questions)).toHaveLength(38)
    expect(
      Object.keys(questions).filter((id) => id.startsWith('p1_')),
    ).toHaveLength(19)
    expect(questions.p1_value.instructions).toContain('`posts[1].text`')
  })

  it('covers every primitive and tag', () => {
    const questions = buildQuestions(posts)
    expect(questions.p0_value.type).toBe('choice')
    expect(questions.p0_signal.type).toBe('score')
    expect(questions.p0_signal.criteria).toHaveLength(5)
    expect(questions.p0_noise.instructions).toContain('low-value')
    for (const topic of TOPICS) {
      expect(questions[`p0_topic_${topic}`].type).toBe('noul')
    }
    for (const want of WANTS) {
      expect(questions[`p0_want_${want}`].type).toBe('noul')
    }
  })
})

describe('mapAnswers', () => {
  const answers = {
    p0_value: { choice: 'USEFUL', confidence: 0.91 },
    p0_signal: { score: 4 },
    p0_action: { score: 4 },
    p0_original: { score: 4 },
    p0_topic_AI: { noul: 0.93 },
    p0_topic_STARTUP: { noul: 0.7 },
    p0_topic_CRYPTO: { noul: 0.1 },
    p0_want_MAKE_MONEY: { noul: 0.8 },
    p0_noise: { choice: 'NONE' },
  }

  it('maps valid answers', () => {
    const [classification] = mapAnswers([posts[0]], answers)
    expect(classification).toMatchObject({
      tweetId: '111',
      value: 'USEFUL',
      score: 100,
      confidence: 0.91,
      topics: ['AI', 'STARTUP'],
      wants: ['MAKE_MONEY'],
      noiseType: null,
    })
  })

  it('keeps a real noise type and defaults missing answers', () => {
    expect(
      mapAnswers([posts[0]], {
        ...answers,
        p0_noise: { choice: 'RANT' },
      })[0].noiseType,
    ).toBe('RANT')
    expect(mapAnswers([posts[0]], {})[0]).toMatchObject({
      value: 'NEUTRAL',
      score: 0,
      topics: [],
      noiseType: null,
    })
  })
})

function response(status: number, body: unknown = {}): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response
}

describe('JevClassifier', () => {
  it('binds the native fetch function to the worker global', async () => {
    const originalFetch = globalThis.fetch
    let receiver: unknown
    globalThis.fetch = function (this: unknown) {
      receiver = this
      return Promise.resolve(response(200, { answers: {} }))
    } as typeof fetch

    try {
      await new JevClassifier('sk-x').classify([posts[0]])
      expect(receiver).toBe(globalThis)
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  it('sends the model, state, questions, and bearer token', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      response(200, { answers: { p0_value: { choice: 'USEFUL' } } }),
    )
    await new JevClassifier('sk-x', { fetchImpl }).classify([posts[0]])
    const [url, init] = fetchImpl.mock.calls[0]
    expect(url).toBe('https://api.typesafe.ai/v1/systemone')
    expect(init.headers.Authorization).toBe('Bearer sk-x')
    const body = JSON.parse(init.body)
    expect(body.model).toBe('jev-latest')
    expect(body.state).toEqual({ posts: [posts[0]] })
    expect(Object.keys(body.questions)).toHaveLength(19)
    expect(body.state).not.toHaveProperty('settings')
  })

  it('posts to a configured endpoint instead of the default', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(response(200, { answers: {} }))
    await new JevClassifier('sk-x', {
      fetchImpl,
      endpoint: 'https://jev.example.com/custom/systemone',
    }).classify([posts[0]])
    expect(fetchImpl.mock.calls[0][0]).toBe(
      'https://jev.example.com/custom/systemone',
    )
  })

  it('retries 429/529 with exponential backoff', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(response(529))
      .mockResolvedValueOnce(response(429))
      .mockResolvedValueOnce(response(200, { answers: {} }))
    const sleep = vi.fn().mockResolvedValue(undefined)
    await new JevClassifier('sk-x', { fetchImpl, sleep }).classify([posts[0]])
    expect(sleep.mock.calls.map((call) => call[0])).toEqual([500, 1000])
  })

  it('rejects invalid requests without retrying', async () => {
    for (const status of [401, 422]) {
      const fetchImpl = vi.fn().mockResolvedValue(response(status))
      await expect(
        new JevClassifier('sk-x', { fetchImpl }).classify([posts[0]]),
      ).rejects.toBeInstanceOf(JevAuthError)
      expect(fetchImpl).toHaveBeenCalledOnce()
    }
  })

  it('gives up after its retry budget and maps network failures', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(response(429))
    await expect(
      new JevClassifier('sk-x', {
        fetchImpl,
        sleep: vi.fn().mockResolvedValue(undefined),
      }).classify([posts[0]]),
    ).rejects.toBeInstanceOf(JevRequestError)
    expect(fetchImpl).toHaveBeenCalledTimes(3)

    await expect(
      new JevClassifier('sk-x', {
        fetchImpl: vi.fn().mockRejectedValue(new Error('offline')),
      }).classify([posts[0]]),
    ).rejects.toMatchObject({
      name: 'JevRequestError',
      status: 0,
      detail: 'Error: offline',
    })
  })

  it('aborts a request that exceeds the timeout', async () => {
    const fetchImpl = vi.fn((_: unknown, init?: RequestInit) =>
      new Promise<Response>((_, reject) => {
        init?.signal?.addEventListener('abort', () =>
          reject(new DOMException('Timed out', 'AbortError')),
        )
      }),
    ) as unknown as typeof fetch

    await expect(
      new JevClassifier('sk-x', { fetchImpl, timeoutMs: 5 }).classify([
        posts[0],
      ]),
    ).rejects.toBeInstanceOf(JevRequestError)
  })

  it('does not fetch an empty batch', async () => {
    const fetchImpl = vi.fn()
    await expect(
      new JevClassifier('sk-x', { fetchImpl }).classify([]),
    ).resolves.toEqual([])
    expect(fetchImpl).not.toHaveBeenCalled()
  })
})
