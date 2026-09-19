import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BATCH_SIZE, ClassificationQueue } from './queue'

const post = (id: string) => ({ id, author: '@a', text: `text-${id}` })

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('ClassificationQueue', () => {
  it('flushes at the batch size', () => {
    const flush = vi.fn()
    const queue = new ClassificationQueue(flush)
    for (let index = 0; index < BATCH_SIZE; index++) {
      queue.add(post(String(index)))
    }
    expect(flush).toHaveBeenCalledOnce()
    expect(flush.mock.calls[0][0]).toHaveLength(BATCH_SIZE)
  })

  it('flushes a partial batch on the timer', () => {
    const flush = vi.fn()
    const queue = new ClassificationQueue(flush, { flushMs: 300 })
    queue.add(post('1'))
    vi.advanceTimersByTime(300)
    expect(flush).toHaveBeenCalledWith([post('1')])
  })

  it('deduplicates queued and already flushed ids', () => {
    const flush = vi.fn()
    const queue = new ClassificationQueue(flush, { flushMs: 10 })
    queue.add(post('1'))
    queue.add(post('1'))
    vi.advanceTimersByTime(10)
    queue.add(post('1'))
    vi.advanceTimersByTime(10)
    expect(flush).toHaveBeenCalledOnce()
    expect(queue.has('1')).toBe(true)
  })

  it('allows a failed id to be retried after it is forgotten', () => {
    const flush = vi.fn()
    const queue = new ClassificationQueue(flush, { batchSize: 1 })
    queue.add(post('1'))
    queue.forget('1')
    queue.add(post('1'))
    expect(flush).toHaveBeenCalledTimes(2)
  })

  it('splits overflow into a later batch', () => {
    const flush = vi.fn()
    const queue = new ClassificationQueue(flush, {
      batchSize: 2,
      flushMs: 10,
    })
    queue.add(post('1'))
    queue.add(post('2'))
    queue.add(post('3'))
    vi.advanceTimersByTime(10)
    expect(flush.mock.calls.map((call) => call[0].length)).toEqual([2, 1])
  })
})
