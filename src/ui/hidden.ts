import type { HideDecision } from '../core/policy'
import { t, type LocalePreference } from '../i18n'
import { PREFIX } from './styles'

export const HIDDEN_ATTR = 'data-signalfeed-hidden'

export function renderHidden(
  decision: HideDecision,
  onRestore: () => void,
  locale: LocalePreference = 'auto',
): HTMLElement {
  const root = document.createElement('details')
  root.setAttribute(HIDDEN_ATTR, 'true')
  root.className = `${PREFIX}hidden`
  root.style.setProperty('all', 'initial')
  Object.assign(root.style, {
    display: 'block',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    background: '#f8fafc',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  })

  const summary = document.createElement('summary')
  summary.className = `${PREFIX}restore`
  Object.assign(summary.style, {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    padding: '10px 12px',
    cursor: 'pointer',
    listStyle: 'none',
  })

  const note = document.createElement('span')
  note.className = `${PREFIX}hidden-note`
  note.textContent = t('hiddenPost', locale, {
    reason: decision.reason ?? t('lowValue', locale),
  })
  Object.assign(note.style, { color: '#64748b', fontSize: '13px' })

  const action = document.createElement('span')
  action.textContent = t('showPost', locale)
  Object.assign(action.style, {
    color: '#2563eb',
    fontSize: '13px',
    fontWeight: '600',
    whiteSpace: 'nowrap',
  })
  summary.addEventListener('click', (event) => {
    event.preventDefault()
    onRestore()
  })

  summary.append(note, action)
  root.append(summary)
  return root
}
