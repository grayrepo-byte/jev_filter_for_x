import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fakeBrowser } from '@webext-core/fake-browser'
import { DEFAULT_ENDPOINT } from '../../core/endpoint'
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

describe('Jev API endpoint', () => {
  const saveEndpoint = () =>
    screen.getByRole('button', { name: 'Save endpoint' })

  it('starts on the default address and saves a custom one after access is granted', async () => {
    const request = vi
      .spyOn(browser.permissions, 'request')
      .mockResolvedValue(true)
    render(<SignalFeedOptions />)

    const field = await screen.findByLabelText('Jev API endpoint')
    expect(field).toHaveValue(DEFAULT_ENDPOINT)

    await userEvent.clear(field)
    await userEvent.type(field, 'https://jev.example.com/v1/systemone')
    await userEvent.click(saveEndpoint())

    await waitFor(async () => {
      expect((await browser.storage.local.get('jevEndpoint')).jevEndpoint).toBe(
        'https://jev.example.com/v1/systemone',
      )
    })
    expect(request).toHaveBeenCalledWith({
      origins: ['https://jev.example.com/*'],
    })
  })

  it('saves the default address without asking for host access', async () => {
    const request = vi
      .spyOn(browser.permissions, 'request')
      .mockResolvedValue(true)
    render(<SignalFeedOptions />)

    await userEvent.click(await screen.findByRole('button', { name: 'Save endpoint' }))

    expect(request).not.toHaveBeenCalled()
    await waitFor(async () => {
      expect((await browser.storage.local.get('jevEndpoint')).jevEndpoint).toBe(
        DEFAULT_ENDPOINT,
      )
    })
  })

  it('rejects an address that is not a URL', async () => {
    render(<SignalFeedOptions />)

    const field = await screen.findByLabelText('Jev API endpoint')
    await userEvent.clear(field)
    await userEvent.type(field, 'api.example.com')
    await userEvent.click(saveEndpoint())

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(
      (await browser.storage.local.get('jevEndpoint')).jevEndpoint,
    ).toBeUndefined()
  })

  it('keeps the stored address when host access is denied', async () => {
    vi.spyOn(browser.permissions, 'request').mockResolvedValue(false)
    render(<SignalFeedOptions />)

    const field = await screen.findByLabelText('Jev API endpoint')
    await userEvent.clear(field)
    await userEvent.type(field, 'https://jev.example.com/v1/systemone')
    await userEvent.click(saveEndpoint())

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(
      (await browser.storage.local.get('jevEndpoint')).jevEndpoint,
    ).toBeUndefined()
  })
})
