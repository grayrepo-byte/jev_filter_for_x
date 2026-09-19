import { defineBackground } from 'wxt/sandbox'
import { createClassifier } from '../../core/classifier'
import { JevAuthError } from '../../core/jev'
import {
  MSG_CLASSIFICATION_RESULT,
  MSG_CLASSIFY_REQUEST,
  type ClassifyRequest,
  type ClassificationResult,
} from '../../core/messages'
import { ClassificationQueue } from '../../core/queue'
import type { Classification, Post } from '../../core/types'
import { getCached, pruneExpired, putCached } from '../../storage/cache'
import { getApiKey, setAuthError } from '../../storage/settings'

export async function openSettingsPage(
  open: () => Promise<void> = () => browser.runtime.openOptionsPage(),
): Promise<void> {
  await open()
}

export async function handlePosts(posts: Post[]): Promise<Classification[]> {
  if (posts.length === 0) return []

  const cached = await getCached(posts.map((post) => post.id))
  const misses = posts.filter((post) => !cached.has(post.id))

  if (misses.length > 0) {
    const classifier = createClassifier(await getApiKey())
    try {
      const fresh = await classifier.classify(misses)
      await putCached(fresh)
      for (const item of fresh) cached.set(item.tweetId, item)
      await setAuthError(false)
    } catch (error) {
      if (error instanceof JevAuthError) await setAuthError(true)
      throw error
    }
  }

  return posts
    .map((post) => cached.get(post.id))
    .filter((item): item is Classification => item !== undefined)
}

export async function broadcast(items: Classification[]): Promise<void> {
  if (items.length === 0) return
  const tabs = await browser.tabs.query({})
  await Promise.all(
    tabs.map(async (tab) => {
      if (tab.id === undefined) return
      try {
        await browser.tabs.sendMessage(tab.id, {
          type: MSG_CLASSIFICATION_RESULT,
          items,
        })
      } catch {
        // Tabs without the content script are expected.
      }
    }),
  )
}

type PipelineDependencies = {
  classify: (posts: Post[]) => Promise<Classification[]>
  publish: (items: Classification[]) => Promise<void>
  batchSize?: number
  flushMs?: number
}

type Waiter = {
  resolve: (item: Classification) => void
  reject: (error: unknown) => void
}

/**
 * Keeps batching global while also returning results directly to the sender.
 * The direct reply is important: tab broadcasts are best-effort and may be
 * unavailable while a tab is being restored or an extension is reloaded.
 */
export function createBackgroundPipeline({
  classify,
  publish,
  batchSize,
  flushMs,
}: PipelineDependencies) {
  const settled = new Set<string>()
  const waiters = new Map<string, Waiter[]>()
  let processing = Promise.resolve()

  const finish = (items: Classification[]) => {
    for (const item of items) {
      settled.add(item.tweetId)
      const pending = waiters.get(item.tweetId) ?? []
      waiters.delete(item.tweetId)
      for (const waiter of pending) waiter.resolve(item)
    }
  }

  const fail = (posts: Post[], error: unknown) => {
    for (const post of posts) {
      queue.forget(post.id)
      const pending = waiters.get(post.id) ?? []
      waiters.delete(post.id)
      for (const waiter of pending) waiter.reject(error)
    }
  }

  const queue = new ClassificationQueue(
    (posts) => {
      processing = processing.then(async () => {
        try {
          const items = await classify(posts)
          finish(items)
          await publish(items).catch(() => undefined)
        } catch (error) {
          fail(posts, error)
          console.error('[JevFilterForX] classification failed', error)
        }
      })
    },
    { batchSize, flushMs },
  )

  const awaitQueued = (post: Post): Promise<Classification> =>
    new Promise((resolve, reject) => {
      const pending = waiters.get(post.id) ?? []
      pending.push({ resolve, reject })
      waiters.set(post.id, pending)
      queue.add(post)
    })

  async function requestPosts(posts: Post[]): Promise<Classification[]> {
    const unique = [...new Map(posts.map((post) => [post.id, post])).values()]
    const results = await Promise.all(
      unique.map(async (post) => {
        if (!settled.has(post.id)) return awaitQueued(post)
        const [cached] = await classify([post])
        if (!cached) throw new Error(`Missing cached result for ${post.id}`)
        return cached
      }),
    )
    const byId = new Map(results.map((item) => [item.tweetId, item]))
    return posts
      .map((post) => byId.get(post.id))
      .filter((item): item is Classification => item !== undefined)
  }

  return { requestPosts }
}

export default defineBackground(() => {
  void pruneExpired().catch(() => undefined)
  browser.action.onClicked.addListener(() => {
    void openSettingsPage().catch((error) => {
      console.error('[JevFilterForX] failed to open settings', error)
    })
  })
  const pipeline = createBackgroundPipeline({
    classify: handlePosts,
    publish: broadcast,
  })

  browser.runtime.onMessage.addListener(
    (message: unknown): Promise<ClassificationResult> | undefined => {
      const request = message as ClassifyRequest
      if (
        request?.type !== MSG_CLASSIFY_REQUEST ||
        !Array.isArray(request.posts)
      ) {
        return
      }
      return pipeline.requestPosts(request.posts).then((items) => ({
        type: MSG_CLASSIFICATION_RESULT,
        items,
      }))
    },
  )
})
