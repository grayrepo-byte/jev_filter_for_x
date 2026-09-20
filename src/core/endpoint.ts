export const DEFAULT_ENDPOINT = 'https://api.typesafe.ai/v1/systemone'

/**
 * Resolves user input into the address the classifier should call. A blank
 * value means "use the default", and anything that is not an http(s) URL is
 * rejected so a typo cannot be persisted as the endpoint.
 */
export function normalizeEndpoint(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return DEFAULT_ENDPOINT

  let url: URL
  try {
    url = new URL(trimmed)
  } catch {
    return null
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null

  return url.toString().replace(/\/+$/, '')
}

export function originPattern(endpoint: string): string {
  return `${new URL(endpoint).origin}/*`
}
