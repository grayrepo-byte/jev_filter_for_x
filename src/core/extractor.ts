import type { Post } from './types'

const TWEET_SELECTOR = 'article[data-testid="tweet"]'
const TEXT_SELECTOR = '[data-testid="tweetText"]'
const STATUS_PATTERN = /\/status\/(\d+)/
const HANDLE_PATTERN = /^@[A-Za-z0-9_]+$/

export function extractPost(article: Element): Post | null {
  if (!article.matches(TWEET_SELECTOR)) return null

  const text = article.querySelector(TEXT_SELECTOR)?.textContent?.trim() ?? ''
  if (!text) return null

  const href = article
    .querySelector('a[href*="/status/"]')
    ?.getAttribute('href')
  const id = href?.match(STATUS_PATTERN)?.[1] ?? ''
  const author =
    Array.from(article.querySelectorAll('[data-testid="User-Name"] span'))
      .map((span) => span.textContent?.trim() ?? '')
      .find((value) => HANDLE_PATTERN.test(value)) ?? ''

  return { id, author, text }
}

export async function postKey(post: Post): Promise<string> {
  if (post.id) return post.id

  const bytes = new TextEncoder().encode(`${post.author}\u0000${post.text}`)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 16)
}
