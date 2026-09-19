import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { fakeBrowser } from '@webext-core/fake-browser'
import SignalFeedOptions from './SignalFeedOptions'

beforeEach(() => fakeBrowser.reset())

describe('SignalFeedOptions', () => {
  it('renders preferences and mock-mode guidance', async () => {
    render(<SignalFeedOptions />)
    expect(await screen.findByText('What do you want from X?')).toBeInTheDocument()
    expect(screen.getByText(/Mock mode/)).toBeInTheDocument()
    expect(screen.getByText(/currently 70/)).toBeInTheDocument()
    expect(screen.getByText('How scores are calculated')).toBeInTheDocument()
    expect(screen.getByText(/40% × signal/)).toBeInTheDocument()
  })

  it('stores an API key locally only', async () => {
    render(<SignalFeedOptions />)
    await userEvent.type(await screen.findByLabelText('TypeSafe API key'), 'sk-abc')
    await userEvent.click(screen.getByRole('button', { name: 'Save key' }))
    await waitFor(async () => {
      expect((await browser.storage.local.get('apiKey')).apiKey).toBe('sk-abc')
      expect((await browser.storage.sync.get('apiKey')).apiKey).toBeUndefined()
    })
  })

  it('toggles a muted noise type', async () => {
    render(<SignalFeedOptions />)
    await userEvent.click(await screen.findByLabelText('Hide Rant'))
    await waitFor(async () => {
      const stored = await browser.storage.sync.get('settings')
      const settings = stored.settings as { hiddenNoiseTypes: string[] }
      expect(settings.hiddenNoiseTypes).not.toContain('RANT')
    })
  })

  it('switches and persists the interface language', async () => {
    render(<SignalFeedOptions />)
    await userEvent.selectOptions(await screen.findByLabelText('Language'), 'zh-CN')

    expect(await screen.findByText('过滤设置')).toBeInTheDocument()
    expect(screen.getByText('人工智能')).toBeInTheDocument()
    await waitFor(async () => {
      const stored = await browser.storage.sync.get('settings')
      expect(stored.settings).toMatchObject({ locale: 'zh-CN' })
    })
  })
})
