import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_SETTINGS } from '../storage/settings'
import { TWEET_WITH_ID } from '../test/fixtures/tweet'
import type { Classification } from './types'
import {
  PROCESSED_ATTR,
  STATUS_ATTR,
  createOrchestrator,
} from './orchestrator'
import { MSG_CLASSIFICATION_RESULT } from './messages'

const settings = { ...DEFAULT_SETTINGS, enabled: true, hideNoise: false }
function dependencies(overrides = {}) {
  return {
    send: vi.fn().mockResolvedValue(undefined),
    getSettings: vi.fn().mockResolvedValue(settings),
    onSettingsChanged: vi.fn().mockReturnValue(() => undefined),
    keyOf: vi.fn().mockResolvedValue('2030234234234'),
    ...overrides,
  }
}
function mount(html: string) {
  const feed = document.createElement('div')
  feed.innerHTML = html
  document.body.append(feed)
}
const flush = () => new Promise((resolve) => setTimeout(resolve, 0))
const item = (
  patch: Partial<Classification> = {},
): Classification => ({
  tweetId: '2030234234234',
  topics: ['AI'],
  value: 'USEFUL',
  wants: ['LEARN'],
  noiseType: null,
  score: 91,
  confidence: 0.9,
  classifiedAt: 0,
  model: 'test',
  ...patch,
})

let running: ReturnType<typeof createOrchestrator> | null = null
beforeEach(() => {
  document.body.innerHTML = ''
})
afterEach(() => {
  running?.stop()
  running = null
})

async function start(deps: ReturnType<typeof dependencies>) {
  running = createOrchestrator(deps)
  await running.start()
  return running
}

describe('orchestrator', () => {
  it('marks and sends extracted tweets once', async () => {
    mount(TWEET_WITH_ID)
    const deps = dependencies()
    const orchestrator = await start(deps)
    await flush()
    expect(document.querySelector('article')!.hasAttribute(PROCESSED_ATTR)).toBe(
      true,
    )
    expect(deps.send).toHaveBeenCalledOnce()
    orchestrator.rescan()
    await flush()
    expect(deps.send).toHaveBeenCalledOnce()
  })

  it('does nothing when disabled', async () => {
    mount(TWEET_WITH_ID)
    const deps = dependencies({
      getSettings: vi
        .fn()
        .mockResolvedValue({ ...settings, enabled: false }),
    })
    await start(deps)
    await flush()
    expect(deps.send).not.toHaveBeenCalled()
  })

  it('adds a badge for a visible classification', async () => {
    mount(TWEET_WITH_ID)
    const orchestrator = await start(dependencies())
    await flush()
    orchestrator.applyClassifications([item()])
    expect(document.querySelector('[data-signalfeed-badge]')).not.toBeNull()
  })

  it('paints a direct classification response from the background', async () => {
    mount(TWEET_WITH_ID)
    const deps = dependencies({
      send: vi.fn().mockResolvedValue({
        type: MSG_CLASSIFICATION_RESULT,
        items: [item()],
      }),
    })
    await start(deps)
    await flush()

    expect(document.querySelector('[data-signalfeed-badge]')).not.toBeNull()
    expect(document.documentElement.getAttribute(STATUS_ATTR)).toBe('ready')
  })

  it('hides and restores low-value text without destroying it', async () => {
    mount(`
      <article data-testid="tweet">
        <header>John Doe</header>
        <div class="content-column">
          <div class="text-block">
            <div data-testid="User-Name"><span>John Doe</span><span>@john</span></div>
            <div data-testid="tweetText">Found a SaaS doing $40k MRR.</div>
            <a href="/john/status/2030234234234"><time></time></a>
          </div>
          <div class="media-block"><div data-testid="tweetPhoto"><img alt="attachment" /></div></div>
          <div class="metadata">Today</div>
          <div role="group"><button>Like</button></div>
        </div>
      </article>
    `)
    const orchestrator = await start(
      dependencies({
        getSettings: vi
          .fn()
          .mockResolvedValue({ ...settings, hideNoise: true }),
      }),
    )
    await flush()
    orchestrator.applyClassifications([
      item({ value: 'NOISE', score: 8 }),
    ])
    expect(document.querySelector('[data-signalfeed-hidden]')?.textContent).toContain(
      'Score 8',
    )
    expect(
      document
        .querySelector('[data-testid="tweetText"]')
        ?.closest('[data-signalfeed-hidden]'),
    ).not.toBeNull()
    expect(
      document
        .querySelector('[data-testid="tweetPhoto"]')
        ?.closest('[data-signalfeed-hidden]'),
    ).not.toBeNull()
    expect(document.querySelector('[role="group"]')?.closest('[data-signalfeed-hidden]')).toBeNull()
    document
      .querySelector<HTMLElement>('[data-signalfeed-hidden] summary')!
      .click()
    expect(document.querySelector('[data-testid="tweetText"]')).not.toBeNull()
    expect(
      document
        .querySelector('[data-testid="tweetPhoto"]')
        ?.closest('[data-signalfeed-hidden]'),
    ).toBeNull()
    expect(document.querySelector('[data-signalfeed-hidden]')).toBeNull()

    const hideAgain = document.querySelector<HTMLButtonElement>(
      '.signalfeed-hide-again',
    )
    expect(hideAgain).not.toBeNull()
    hideAgain!.click()
    expect(document.querySelector('[data-signalfeed-hidden]')).not.toBeNull()
    expect(
      document
        .querySelector('[data-testid="tweetPhoto"]')
        ?.closest('[data-signalfeed-hidden]'),
    ).not.toBeNull()
  })

  it('restores all page content when stopped', async () => {
    mount(TWEET_WITH_ID)
    const orchestrator = await start(
      dependencies({
        getSettings: vi
          .fn()
          .mockResolvedValue({ ...settings, hideNoise: true }),
      }),
    )
    await flush()
    orchestrator.applyClassifications([
      item({ value: 'NOISE', score: 8 }),
    ])

    orchestrator.stop()

    expect(document.querySelector('[data-testid="tweetText"]')).not.toBeNull()
    expect(document.querySelector('[data-signalfeed-hidden]')).toBeNull()
    expect(document.querySelector('[data-signalfeed-badge]')).toBeNull()
  })

  it('tolerates malformed tweets', async () => {
    mount('<article data-testid="tweet"></article>')
    await expect(start(dependencies())).resolves.toBeDefined()
  })
})
