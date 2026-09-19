import type { Classification } from '../core/types'
import { t, type LocalePreference } from '../i18n'
import { PREFIX, label } from './styles'

export const BADGE_ATTR = 'data-signalfeed-badge'
const MAX_TAGS_PER_KIND = 2

export function tierOf(score: number): 'high' | 'mid' | 'low' {
  if (score >= 70) return 'high'
  if (score >= 30) return 'mid'
  return 'low'
}

function styleTag(element: HTMLElement, color: string, background: string) {
  Object.assign(element.style, {
    display: 'inline-flex',
    alignItems: 'center',
    borderRadius: '999px',
    padding: '1px 7px',
    color,
    background,
    fontSize: '11px',
    lineHeight: '18px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  })
}

export function renderBadge(
  classification: Classification,
  locale: LocalePreference = 'auto',
  onHideAgain?: () => void,
): HTMLElement {
  const root = document.createElement('div')
  root.setAttribute(BADGE_ATTR, 'true')
  root.className = `${PREFIX}badge`
  root.style.setProperty('all', 'initial')
  root.dataset.tier = tierOf(classification.score)
  Object.assign(root.style, {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'nowrap',
    gap: '5px',
    minHeight: '24px',
    marginTop: '5px',
    overflow: 'hidden',
  })

  const score = document.createElement('span')
  score.className = `${PREFIX}score`
  score.textContent = String(classification.score)
  const tier = tierOf(classification.score)
  const colors =
    tier === 'high'
      ? ['#166534', '#dcfce7']
      : tier === 'mid'
        ? ['#854d0e', '#fef9c3']
        : ['#475569', '#f1f5f9']
  styleTag(score, colors[0], colors[1])
  score.style.fontWeight = '700'
  root.append(score)

  for (const topic of classification.topics.slice(0, MAX_TAGS_PER_KIND)) {
    const tag = document.createElement('span')
    tag.dataset.role = 'topic'
    tag.className = `${PREFIX}topic`
    tag.textContent = label(topic, locale)
    styleTag(tag, '#1d4ed8', '#eff6ff')
    root.append(tag)
  }

  for (const want of classification.wants.slice(0, MAX_TAGS_PER_KIND)) {
    const tag = document.createElement('span')
    tag.dataset.role = 'want'
    tag.className = `${PREFIX}want`
    tag.textContent = label(want, locale)
    styleTag(tag, '#6d28d9', '#f5f3ff')
    root.append(tag)
  }

  if (onHideAgain) {
    const action = document.createElement('button')
    action.type = 'button'
    action.className = `${PREFIX}hide-again`
    action.textContent = t('hideAgain', locale)
    action.setAttribute('aria-label', t('hideAgain', locale))
    Object.assign(action.style, {
      marginLeft: 'auto',
      border: '0',
      borderRadius: '999px',
      padding: '1px 7px',
      color: '#475569',
      background: '#e2e8f0',
      fontSize: '11px',
      lineHeight: '18px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      cursor: 'pointer',
      whiteSpace: 'nowrap',
    })
    action.addEventListener('click', (event) => {
      event.preventDefault()
      event.stopPropagation()
      onHideAgain()
    })
    root.append(action)
  }

  return root
}
