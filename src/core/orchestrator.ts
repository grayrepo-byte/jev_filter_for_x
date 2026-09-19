import { extractPost, postKey } from './extractor'
import { isClassificationResult, MSG_CLASSIFY_REQUEST } from './messages'
import { decideVisibility } from './policy'
import type { Classification, Post, Settings } from './types'
import { BADGE_ATTR, renderBadge } from '../ui/badge'
import { renderHidden } from '../ui/hidden'
import { PREFIX } from '../ui/styles'

export const PROCESSED_ATTR = 'data-signalfeed-processed'
export const STATUS_ATTR = 'data-signalfeed-status'
const ARTICLE_SELECTOR = 'article[data-testid="tweet"]'
const MEDIA_SELECTOR = [
  '[data-testid="tweetPhoto"]',
  '[data-testid="videoPlayer"]',
  '[data-testid="videoComponent"]',
  '[data-testid="card.wrapper"]',
].join(',')

type OrchestratorDependencies = {
  send: (message: { type: string; posts: Post[] }) => Promise<unknown>
  getSettings: () => Promise<Settings>
  onSettingsChanged: (callback: (settings: Settings) => void) => () => void
  keyOf?: (post: Post) => Promise<string>
}

export type Orchestrator = {
  start(): Promise<void>
  stop(): void
  rescan(): void
  applyClassifications(items: Classification[]): void
}

export function createOrchestrator(
  dependencies: OrchestratorDependencies,
): Orchestrator {
  const keyOf = dependencies.keyOf ?? postKey
  const byKey = new Map<string, Classification>()
  const revealed = new Set<string>()
  const stashed = new Map<HTMLElement, HTMLElement[]>()
  let settings: Settings | null = null
  let observer: MutationObserver | null = null
  let unsubscribe: (() => void) | null = null
  let pending: Post[] = []
  let scheduled = false

  function setStatus(status: string): void {
    document.documentElement?.setAttribute(STATUS_ATTR, status)
  }

  function applyItems(items: Classification[]): void {
    for (const item of items) byKey.set(item.tweetId, item)
    repaintAll()
    setStatus('ready')
  }

  function scheduleFlush(): void {
    if (scheduled) return
    scheduled = true
    const flush = () => {
      scheduled = false
      const batch = pending
      pending = []
      if (batch.length === 0) return
      setStatus('classifying')
      void dependencies
        .send({ type: MSG_CLASSIFY_REQUEST, posts: batch })
        .then((response) => {
          if (isClassificationResult(response)) applyItems(response.items)
          else setStatus('awaiting-result')
        })
        .catch((error) => {
          setStatus('background-error')
          console.error('[JevFilterForX] background request failed', error)
        })
    }
    if (typeof requestIdleCallback === 'function') requestIdleCallback(flush)
    else setTimeout(flush, 0)
  }

  function collect(article: Element): void {
    if (article.hasAttribute(PROCESSED_ATTR)) return
    article.setAttribute(PROCESSED_ATTR, 'true')
    const post = extractPost(article)
    if (!post) return

    const element = article as HTMLElement
    void keyOf(post)
      .then((key) => {
        element.dataset.signalfeedKey = key
        const known = byKey.get(key)
        if (known) {
          paint(element, known)
          return
        }
        pending.push({ ...post, id: key })
        scheduleFlush()
      })
      .catch(() => undefined)
  }

  function scan(root: ParentNode): void {
    if (!settings?.enabled) return
    if (root instanceof Element && root.matches(ARTICLE_SELECTOR)) collect(root)
    root.querySelectorAll(ARTICLE_SELECTOR).forEach(collect)
  }

  function restoreStashed(article: HTMLElement): void {
    const holder = article.querySelector<HTMLElement>(`.${PREFIX}hidden-holder`)
    const stored = stashed.get(article)
    const fallback = holder
      ? Array.from(holder.querySelector('details')?.children ?? []).slice(1)
      : []
    const content = (stored ?? fallback).filter(
      (node): node is HTMLElement => node instanceof HTMLElement,
    )
    if (holder && content.length > 0) {
      const fragment = document.createDocumentFragment()
      for (const node of content) fragment.append(node)
      holder.replaceWith(fragment)
    } else {
      holder?.remove()
    }
    stashed.delete(article)
  }

  function hideTargets(
    article: HTMLElement,
    text: HTMLElement,
  ): HTMLElement[] {
    const media = Array.from(
      article.querySelectorAll<HTMLElement>(MEDIA_SELECTOR),
    ).filter((node) => !node.closest(`.${PREFIX}hidden-holder`))
    if (media.length === 0) return [text]

    const nodes = [text, ...media]
    let common: HTMLElement | null = text.parentElement
    while (
      common &&
      common !== article &&
      !nodes.every((node) => common?.contains(node))
    ) {
      common = common.parentElement
    }

    if (common && common !== article) {
      const roots: HTMLElement[] = []
      for (const node of nodes) {
        let root = node
        while (root.parentElement && root.parentElement !== common) {
          root = root.parentElement
        }
        if (!roots.includes(root)) roots.push(root)
      }
      const capturesActions = roots.some(
        (root) =>
          root.matches('[role="group"]') || Boolean(root.querySelector('[role="group"]')),
      )
      if (!capturesActions) return roots
    }

    // Conservative fallback for an unfamiliar X layout: hide the text and
    // the topmost media nodes, never the article header or action group.
    const targets: HTMLElement[] = [text]
    for (const attachment of media) {
      if (targets.some((target) => target.contains(attachment))) continue
      targets.push(attachment)
    }
    return targets
  }

  function paint(article: HTMLElement, classification: Classification): void {
    if (!settings) return
    article.querySelector(`[${BADGE_ATTR}]`)?.remove()
    restoreStashed(article)

    if (!settings.enabled) return

    const content = article.querySelector<HTMLElement>(
      '[data-testid="tweetText"]',
    )
    const decision = decideVisibility(classification, settings)
    if (!decision.hidden || revealed.has(classification.tweetId)) {
      if (content?.parentElement) {
        const hideAgain = decision.hidden
          ? () => {
              revealed.delete(classification.tweetId)
              paint(article, classification)
            }
          : undefined
        content.parentElement.insertBefore(
          renderBadge(classification, settings.locale, hideAgain),
          content.nextSibling,
        )
      }
      return
    }

    if (!content?.parentElement) return
    const targets = hideTargets(article, content)
    const holder = document.createElement('div')
    holder.className = `${PREFIX}hidden-holder`
    const hidden = renderHidden(
      decision,
      () => {
        revealed.add(classification.tweetId)
        paint(article, classification)
      },
      settings.locale,
    )
    targets[0].replaceWith(holder)
    hidden.append(...targets)
    holder.append(hidden)
    stashed.set(article, targets)
  }

  function repaintAll(): void {
    document
      .querySelectorAll<HTMLElement>('[data-signalfeed-key]')
      .forEach((article) => {
        const key = article.dataset.signalfeedKey
        if (!key) return
        const classification = byKey.get(key)
        if (classification) paint(article, classification)
      })
  }

  return {
    async start() {
      setStatus('starting')
      settings = await dependencies.getSettings()
      scan(document)
      unsubscribe = dependencies.onSettingsChanged((next) => {
        const wasDisabled = !settings?.enabled
        settings = next
        if (wasDisabled && next.enabled) scan(document)
        repaintAll()
      })
      observer = new MutationObserver((records) => {
        for (const record of records) {
          for (const node of record.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) scan(node as Element)
          }
        }
      })
      if (document.body) {
        observer.observe(document.body, { childList: true, subtree: true })
      }
      setStatus(settings.enabled ? 'active' : 'disabled')
    },

    stop() {
      observer?.disconnect()
      observer = null
      unsubscribe?.()
      unsubscribe = null
      document
        .querySelectorAll<HTMLElement>('[data-signalfeed-key]')
        .forEach((article) => {
          article.querySelector(`[${BADGE_ATTR}]`)?.remove()
          restoreStashed(article)
          article.removeAttribute(PROCESSED_ATTR)
          delete article.dataset.signalfeedKey
        })
      document.documentElement?.removeAttribute(STATUS_ATTR)
    },

    rescan() {
      scan(document)
    },

    applyClassifications(items) {
      applyItems(items)
    },
  }
}
