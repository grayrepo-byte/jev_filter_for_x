import { defineContentScript } from 'wxt/sandbox'
import { MSG_CLASSIFICATION_RESULT } from '../../core/messages'
import { createOrchestrator } from '../../core/orchestrator'
import type { Classification } from '../../core/types'
import { getSettings, onSettingsChanged } from '../../storage/settings'

export default defineContentScript({
  matches: ['https://x.com/*', 'https://twitter.com/*'],
  main() {
    const orchestrator = createOrchestrator({
      send: (message) => browser.runtime.sendMessage(message),
      getSettings,
      onSettingsChanged,
    })

    browser.runtime.onMessage.addListener((message: unknown) => {
      const result = message as { type?: string; items?: Classification[] }
      if (
        result?.type === MSG_CLASSIFICATION_RESULT &&
        Array.isArray(result.items)
      ) {
        orchestrator.applyClassifications(result.items)
      }
    })

    void orchestrator.start()
    window.addEventListener('pagehide', () => orchestrator.stop(), {
      once: true,
    })
  },
})
