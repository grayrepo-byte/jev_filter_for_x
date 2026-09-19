import type { Post } from './types'

export const BATCH_SIZE = 5
export const FLUSH_MS = 300

type QueueOptions = {
  batchSize?: number
  flushMs?: number
}

export class ClassificationQueue {
  private batch: Post[] = []
  private readonly seen = new Set<string>()
  private timer: ReturnType<typeof setTimeout> | null = null
  private readonly batchSize: number
  private readonly flushMs: number

  constructor(
    private readonly onFlush: (posts: Post[]) => void,
    options: QueueOptions = {},
  ) {
    this.batchSize = options.batchSize ?? BATCH_SIZE
    this.flushMs = options.flushMs ?? FLUSH_MS
  }

  get size(): number {
    return this.batch.length
  }

  has(key: string): boolean {
    return this.seen.has(key)
  }

  /** Allow a failed item to be retried by a later request. */
  forget(key: string): void {
    this.seen.delete(key)
  }

  add(post: Post): void {
    if (this.seen.has(post.id)) return
    this.seen.add(post.id)
    this.batch.push(post)

    if (this.batch.length >= this.batchSize) {
      this.flush()
      return
    }
    this.schedule()
  }

  flush(): void {
    this.clearTimer()
    if (this.batch.length === 0) return
    const outgoing = this.batch
    this.batch = []
    this.onFlush(outgoing)
  }

  private schedule(): void {
    if (this.timer !== null) return
    this.timer = setTimeout(() => {
      this.timer = null
      this.flush()
    }, this.flushMs)
  }

  private clearTimer(): void {
    if (this.timer === null) return
    clearTimeout(this.timer)
    this.timer = null
  }
}
