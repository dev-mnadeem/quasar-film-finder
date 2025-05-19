import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createQueryUnderstandingProvider } from '@/ai'
import { createRemoteQueryProvider } from '@/ai/remoteQueryProvider'

const ENDPOINT = 'https://example.test/intent'

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('createQueryUnderstandingProvider', () => {
  it('uses the local rule parser when no endpoint is configured', () => {
    expect(createQueryUnderstandingProvider('').id).toBe('rules')
  })

  it('uses the remote provider when an endpoint is configured', () => {
    expect(createQueryUnderstandingProvider(ENDPOINT).id).toBe('remote')
  })
})

describe('createRemoteQueryProvider', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('posts the phrase and uses the structured answer', async () => {
    const fetchMock = vi
      .mocked(fetch)
      .mockResolvedValue(
        jsonResponse({ title: 'Space', yearFrom: 1990, yearTo: 1999, genres: ['sci-fi'] }),
      )

    const intent = await createRemoteQueryProvider(ENDPOINT).parse('90s space films', 1)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe(ENDPOINT)
    expect(intent).toMatchObject({
      title: 'space',
      yearFrom: 1990,
      yearTo: 1999,
      genres: ['Sci-Fi'],
      source: 'remote',
    })
  })

  it('discards genres the catalogue does not have', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ title: 'x', genres: ['Western', 'Horror'] }))

    const intent = await createRemoteQueryProvider(ENDPOINT).parse('x', 1)

    expect(intent.genres).toEqual(['Horror'])
  })

  it('discards years outside the accepted range', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ title: 'x', yearFrom: 12, yearTo: 9999 }))

    const intent = await createRemoteQueryProvider(ENDPOINT).parse('x', 1)

    expect(intent.yearFrom).toBeNull()
    expect(intent.yearTo).toBeNull()
  })

  it('falls back to the rule parser when the endpoint fails', async () => {
    vi.mocked(fetch).mockRejectedValue(new TypeError('network down'))

    const intent = await createRemoteQueryProvider(ENDPOINT).parse('sci-fi from the 90s', 1)

    expect(intent.source).toBe('rules')
    expect(intent).toMatchObject({ yearFrom: 1990, yearTo: 1999, genres: ['Sci-Fi'] })
  })

  it('falls back when the endpoint answers with an error status', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('nope', { status: 500 }))

    const intent = await createRemoteQueryProvider(ENDPOINT).parse('night', 1)

    expect(intent.source).toBe('rules')
    expect(intent.title).toBe('night')
  })

  it('falls back when the endpoint answers with nothing usable', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ title: '', genres: [] }))

    const intent = await createRemoteQueryProvider(ENDPOINT).parse('night', 1)

    expect(intent.source).toBe('rules')
    expect(intent.title).toBe('night')
  })

  it('propagates an abort instead of falling back', async () => {
    vi.mocked(fetch).mockRejectedValue(new DOMException('aborted', 'AbortError'))

    await expect(createRemoteQueryProvider(ENDPOINT).parse('night', 1)).rejects.toThrow(
      DOMException,
    )
  })
})
