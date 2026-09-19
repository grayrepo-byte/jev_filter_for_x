import { describe, expect, it } from 'vitest'
import { MockClassifier, createClassifier } from './classifier'

const post = (id: string, text = 'hello world') => ({
  id,
  author: '@a',
  text,
})

describe('MockClassifier', () => {
  it('is deterministic and preserves ids', async () => {
    const classifier = new MockClassifier()
    const input = [post('1', 'same'), post('2', 'another')]
    expect(await classifier.classify(input)).toEqual(
      await classifier.classify(input),
    )
    expect((await classifier.classify(input)).map((item) => item.tweetId)).toEqual([
      '1',
      '2',
    ])
  })

  it('returns well-formed and varied results', async () => {
    const classifier = new MockClassifier()
    const results = await classifier.classify(
      Array.from({ length: 40 }, (_, index) =>
        post(String(index), `text number ${index}`),
      ),
    )
    expect(new Set(results.map((item) => item.score)).size).toBeGreaterThan(3)
    expect(results.every((item) => item.score >= 0 && item.score <= 100)).toBe(
      true,
    )
  })
})

describe('createClassifier', () => {
  it('selects mock without a key and Jev with a key', () => {
    expect(createClassifier('')).toBeInstanceOf(MockClassifier)
    expect(createClassifier('sk-x').constructor.name).toBe('JevClassifier')
  })
})
