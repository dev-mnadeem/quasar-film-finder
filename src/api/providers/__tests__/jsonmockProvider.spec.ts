import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getMoviesProvider, MOVIES_PROVIDERS } from '@/api/providers'
import { jsonmockProvider } from '@/api/providers/jsonmockProvider'
import { emptyQuery } from '@/types/movies'

describe('provider registry', () => {
  it('knows both sources', () => {
    expect(Object.keys(MOVIES_PROVIDERS).sort()).toEqual(['fixture', 'jsonmock'])
  })

  it('returns the bundled catalogue by default', () => {
    expect(getMoviesProvider().id).toBe('fixture')
  })

  it('returns the requested source', () => {
    expect(getMoviesProvider('jsonmock').id).toBe('jsonmock')
  })
})

describe('jsonmockProvider', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('advertises that it cannot filter or show details', () => {
    expect(jsonmockProvider.capabilities).toEqual({
      yearFilter: false,
      genreFilter: false,
      details: false,
    })
  })

  it('normalises the wire shape into the domain shape', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          page: 1,
          per_page: 10,
          total: 1,
          total_pages: 1,
          data: [{ Title: 'Alpha', Year: 2001, imdbID: 'tt100' }],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    )

    const result = await jsonmockProvider.search(emptyQuery('alpha'))

    expect(result).toMatchObject({ page: 1, perPage: 10, total: 1, totalPages: 1 })
    expect(result.movies[0]).toEqual({
      id: 'tt100',
      title: 'Alpha',
      year: 2001,
      posterPath: null,
      rating: null,
      genres: [],
      overview: null,
      runtimeMinutes: null,
    })
  })

  it('sends only the parameters the endpoint understands', async () => {
    const fetchMock = vi
      .mocked(fetch)
      .mockResolvedValue(
        new Response(
          JSON.stringify({ page: 2, per_page: 10, total: 0, total_pages: 0, data: [] }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      )

    await jsonmockProvider.search({
      title: 'alpha',
      page: 2,
      yearFrom: 1990,
      yearTo: 1999,
      genres: ['Sci-Fi'],
    })

    const url = new URL(String(fetchMock.mock.calls[0]?.[0]))
    expect(url.searchParams.get('Title')).toBe('alpha')
    expect(url.searchParams.get('page')).toBe('2')
    expect([...url.searchParams.keys()].sort()).toEqual(['Title', 'page'])
  })

  it('has no detail endpoint', async () => {
    expect(await jsonmockProvider.getById('tt100')).toBeNull()
  })
})
