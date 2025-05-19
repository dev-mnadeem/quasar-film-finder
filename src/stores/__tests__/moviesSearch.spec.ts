import { createPinia, setActivePinia } from 'pinia'
import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MoviesApiError } from '@/api/errors'
import type { MoviesProvider } from '@/api/providers'
import type { Movie, MoviesPage, ProviderCapabilities, SearchQuery } from '@/types/movies'
import { useMoviesSearchStore } from '../moviesSearch'

function movie(title: string, year = 2000): Movie {
  return {
    id: title.toLowerCase(),
    title,
    year,
    posterPath: null,
    rating: null,
    genres: [],
    overview: null,
    runtimeMinutes: null,
  }
}

function pageOf(titles: string[], overrides: Partial<MoviesPage> = {}): MoviesPage {
  return {
    movies: titles.map((title) => movie(title)),
    page: 1,
    perPage: 10,
    total: titles.length,
    totalPages: 1,
    ...overrides,
  }
}

interface Deferred<T> {
  promise: Promise<T>
  resolve: (value: T) => void
  reject: (reason: unknown) => void
}

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

const ALL_CAPABILITIES: ProviderCapabilities = {
  yearFilter: true,
  genreFilter: true,
  details: true,
}

type SearchFn = (query: SearchQuery, signal?: AbortSignal) => Promise<MoviesPage>

function stubProvider(
  search: SearchFn,
  capabilities: ProviderCapabilities = ALL_CAPABILITIES,
  label = 'Test source',
): MoviesProvider {
  return {
    id: 'fixture',
    label,
    capabilities,
    search,
    getById: async () => null,
  }
}

describe('useMoviesSearchStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('parses the phrase and loads the first page', async () => {
    const search = vi.fn<SearchFn>(async () => pageOf(['Night Harbour', 'Night Shift Symphony']))
    const store = useMoviesSearchStore()
    store.useSource(stubProvider(search))

    await store.search('night')

    expect(search).toHaveBeenCalledTimes(1)
    expect(search.mock.calls[0]?.[0]).toMatchObject({ title: 'night', page: 1 })
    expect(store.status).toBe('success')
    expect(store.movies).toHaveLength(2)
    expect(store.total).toBe(2)
  })

  it('passes year and genre filters extracted from the phrase', async () => {
    const search = vi.fn<SearchFn>(async () => pageOf(['Orbit Nine']))
    const store = useMoviesSearchStore()
    store.useSource(stubProvider(search))

    await store.search('sci-fi from the 90s')

    expect(search.mock.calls[0]?.[0]).toMatchObject({
      title: '',
      yearFrom: 1990,
      yearTo: 1999,
      genres: ['Sci-Fi'],
    })
  })

  it('reports filters the source cannot honour instead of dropping them', async () => {
    const store = useMoviesSearchStore()
    store.useSource(
      stubProvider(async () => pageOf(['Alpha']), {
        yearFilter: false,
        genreFilter: false,
        details: false,
      }),
    )

    await store.search('alpha from the 90s')

    expect(store.ignoredFilters).toEqual(['release year'])
    expect(store.status).toBe('success')
  })

  it('will not search a title-only source with no title', async () => {
    const search = vi.fn<SearchFn>(async () => pageOf(['Alpha']))
    const store = useMoviesSearchStore()
    store.useSource(stubProvider(search, { yearFilter: false, genreFilter: false, details: false }))

    await store.search('documentary')

    expect(search).not.toHaveBeenCalled()
    expect(store.needsTitle).toBe(true)
    expect(store.status).toBe('idle')
  })

  it('clears everything for an empty phrase', async () => {
    const store = useMoviesSearchStore()
    store.useSource(stubProvider(async () => pageOf(['Alpha'])))

    await store.search('alpha')
    expect(store.movies).toHaveLength(1)

    await store.search('   ')

    expect(store.status).toBe('idle')
    expect(store.movies).toHaveLength(0)
    expect(store.phrase).toBe('')
    expect(store.intent).toBeNull()
  })

  it('fetches another page through setPage', async () => {
    const search = vi.fn<SearchFn>(async (query) =>
      query.page === 2
        ? pageOf(['Second'], { page: 2, total: 11, totalPages: 2 })
        : pageOf(['First'], { page: 1, total: 11, totalPages: 2 }),
    )
    const store = useMoviesSearchStore()
    store.useSource(stubProvider(search))

    await store.search('the')
    await store.setPage(2)

    expect(store.page).toBe(2)
    expect(store.movies[0]?.title).toBe('Second')
  })

  it('ignores setPage without a query, and setPage to the current page', async () => {
    const search = vi.fn<SearchFn>(async () => pageOf(['Alpha'], { total: 11, totalPages: 2 }))
    const store = useMoviesSearchStore()
    store.useSource(stubProvider(search))

    await store.setPage(2)
    expect(search).not.toHaveBeenCalled()

    await store.search('alpha')
    await store.setPage(1)
    expect(search).toHaveBeenCalledTimes(1)
  })

  it('surfaces the source error message', async () => {
    const store = useMoviesSearchStore()
    store.useSource(
      stubProvider(async () => {
        throw new MoviesApiError('Movie search failed (503 Unavailable)', 503)
      }),
    )

    await store.search('boom')

    expect(store.status).toBe('error')
    expect(store.errorMessage).toBe('Movie search failed (503 Unavailable)')
    expect(store.movies).toHaveLength(0)
  })

  it('drops a slow success that a newer request has already superseded', async () => {
    const slow = deferred<MoviesPage>()
    const fresh = deferred<MoviesPage>()
    const queue = [slow, fresh]
    const store = useMoviesSearchStore()
    store.useSource(stubProvider(() => queue.shift()!.promise))

    const first = store.search('slow')
    await flushPromises()
    const second = store.search('fresh')
    await flushPromises()

    fresh.resolve(pageOf(['Fresh']))
    slow.resolve(pageOf(['Stale']))
    await Promise.all([first, second])
    await flushPromises()

    expect(store.movies.map((m) => m.title)).toEqual(['Fresh'])
    expect(store.status).toBe('success')
  })

  it('drops a slow failure that a newer request has already superseded', async () => {
    const slow = deferred<MoviesPage>()
    const fresh = deferred<MoviesPage>()
    const queue = [slow, fresh]
    const store = useMoviesSearchStore()
    store.useSource(stubProvider(() => queue.shift()!.promise))

    const first = store.search('slow')
    await flushPromises()
    const second = store.search('fresh')
    await flushPromises()

    fresh.resolve(pageOf(['Fresh']))
    slow.reject(new MoviesApiError('a failure nobody is waiting for'))
    await Promise.all([first, second])
    await flushPromises()

    expect(store.status).toBe('success')
    expect(store.errorMessage).toBe('')
    expect(store.movies.map((m) => m.title)).toEqual(['Fresh'])
  })

  it('reset returns the store to its initial state', async () => {
    const store = useMoviesSearchStore()
    store.useSource(stubProvider(async () => pageOf(['Alpha'])))

    await store.search('alpha')
    store.reset()

    expect(store.status).toBe('idle')
    expect(store.movies).toHaveLength(0)
    expect(store.phrase).toBe('')
    expect(store.page).toBe(1)
  })

  it('uses the injected query understanding provider', async () => {
    const search = vi.fn<SearchFn>(async () => pageOf(['Alpha']))
    const store = useMoviesSearchStore()
    store.useSource(stubProvider(search))
    store.useQueryUnderstanding({
      id: 'remote',
      label: 'stub',
      parse: async (phrase, page) => ({
        title: phrase.toUpperCase(),
        page,
        yearFrom: null,
        yearTo: null,
        genres: [],
        source: 'remote',
        explanation: 'stubbed',
      }),
    })

    await store.search('alpha')

    expect(search.mock.calls[0]?.[0]?.title).toBe('ALPHA')
    expect(store.intent?.explanation).toBe('stubbed')
  })
})
