import 'fake-indexeddb/auto'
import '@testing-library/jest-dom/vitest'
import { fakeBrowser } from '@webext-core/fake-browser'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

Object.assign(globalThis, {
  browser: fakeBrowser,
  chrome: fakeBrowser,
})

afterEach(cleanup)
