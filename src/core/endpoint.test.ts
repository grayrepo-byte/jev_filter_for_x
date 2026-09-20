import { describe, expect, it } from 'vitest'
import { DEFAULT_ENDPOINT, normalizeEndpoint, originPattern } from './endpoint'

describe('normalizeEndpoint', () => {
  it('falls back to the default for a blank address', () => {
    expect(normalizeEndpoint('')).toBe(DEFAULT_ENDPOINT)
    expect(normalizeEndpoint('   ')).toBe(DEFAULT_ENDPOINT)
  })

  it('leaves the default address unchanged', () => {
    expect(normalizeEndpoint(DEFAULT_ENDPOINT)).toBe(DEFAULT_ENDPOINT)
  })

  it('trims whitespace and trailing slashes', () => {
    expect(normalizeEndpoint('  https://api.example.com/v1/systemone  ')).toBe(
      'https://api.example.com/v1/systemone',
    )
    expect(normalizeEndpoint('https://api.example.com/v1/systemone//')).toBe(
      'https://api.example.com/v1/systemone',
    )
  })

  it('keeps a custom host, port, and path', () => {
    expect(normalizeEndpoint('http://localhost:8080/jev')).toBe(
      'http://localhost:8080/jev',
    )
  })

  it('rejects addresses that are not http(s) URLs', () => {
    for (const input of [
      'api.example.com',
      'ftp://api.example.com',
      'javascript:alert(1)',
      'not a url',
    ]) {
      expect(normalizeEndpoint(input)).toBeNull()
    }
  })
})

describe('originPattern', () => {
  it('matches the origin of the address', () => {
    expect(originPattern(DEFAULT_ENDPOINT)).toBe('https://api.typesafe.ai/*')
    expect(originPattern('http://localhost:8080/jev')).toBe(
      'http://localhost:8080/*',
    )
  })
})
