import { describe, expect, it } from 'vitest'
import {
  NOT_A_TWEET,
  TWEET_WITH_ID,
  TWEET_WITHOUT_ID,
} from '../test/fixtures/tweet'
import { extractPost, postKey } from './extractor'

function mount(html: string): Element {
  const host = document.createElement('div')
  host.innerHTML = html
  return host.firstElementChild!
}

describe('extractPost', () => {
  it('extracts a tweet', () => {
    expect(extractPost(mount(TWEET_WITH_ID))).toEqual({
      id: '2030234234234',
      author: '@john',
      text: 'Found a SaaS doing $40k MRR.',
    })
  })

  it('allows a missing status id', () => {
    expect(extractPost(mount(TWEET_WITHOUT_ID))?.id).toBe('')
  })

  it('rejects non-tweets and empty tweets', () => {
    expect(extractPost(mount(NOT_A_TWEET))).toBeNull()
    expect(
      extractPost(
        mount('<article data-testid="tweet"><div>empty</div></article>'),
      ),
    ).toBeNull()
  })
})

describe('postKey', () => {
  it('keeps an existing tweet id', async () => {
    await expect(postKey({ id: '123', author: '@a', text: 'x' })).resolves.toBe(
      '123',
    )
  })

  it('creates a stable 16-character digest', async () => {
    const post = { id: '', author: '@a', text: 'hello' }
    const first = await postKey(post)
    expect(first).toMatch(/^[0-9a-f]{16}$/)
    await expect(postKey({ ...post })).resolves.toBe(first)
    await expect(postKey({ ...post, text: 'world' })).resolves.not.toBe(first)
  })
})
