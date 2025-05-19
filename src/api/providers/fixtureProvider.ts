import { abortError } from '@/api/errors'
import type { MoviesProvider } from '@/api/providers/types'
import { DEFAULT_PAGE_SIZE } from '@/config/appConfig'
import { CATALOG } from '@/data/catalog'
import type { Movie, MoviesPage, SearchQuery } from '@/types/movies'

/** Titles that begin with the term rank above titles that merely contain it. */
const RANK_PREFIX = 0
const RANK_SUBSTRING = 1

function matchesTitle(movie: Movie, term: string): boolean {
  return movie.title.toLowerCase().includes(term)
}

function matchesYear(movie: Movie, query: SearchQuery): boolean {
  if (query.yearFrom !== null && movie.year < query.yearFrom) return false
  if (query.yearTo !== null && movie.year > query.yearTo) return false
  return true
}

function matchesGenres(movie: Movie, query: SearchQuery): boolean {
  if (query.genres.length === 0) return true
  const owned = new Set(movie.genres.map((genre) => genre.toLowerCase()))
  return query.genres.every((genre) => owned.has(genre.toLowerCase()))
}

function rank(movie: Movie, term: string): number {
  return movie.title.toLowerCase().startsWith(term) ? RANK_PREFIX : RANK_SUBSTRING
}

/**
 * Filters the bundled catalogue. Pure, synchronous and total-ordered, so the same
 * query always produces the same page in the same order.
 */
export function searchCatalog(query: SearchQuery, catalog: readonly Movie[] = CATALOG): MoviesPage {
  const term = query.title.trim().toLowerCase()
  const matched = catalog
    .filter(
      (movie) =>
        matchesTitle(movie, term) && matchesYear(movie, query) && matchesGenres(movie, query),
    )
    .sort((a, b) => rank(a, term) - rank(b, term) || a.title.localeCompare(b.title, 'en'))

  const total = matched.length
  const totalPages = Math.ceil(total / DEFAULT_PAGE_SIZE)
  const page = Math.min(Math.max(1, Math.floor(query.page)), Math.max(1, totalPages))
  const start = (page - 1) * DEFAULT_PAGE_SIZE

  return {
    movies: matched.slice(start, start + DEFAULT_PAGE_SIZE),
    page,
    perPage: DEFAULT_PAGE_SIZE,
    total,
    totalPages,
  }
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw abortError()
  }
}

/**
 * Local catalogue used by default, so `npm run dev` and both test suites work with
 * no API key and no network. It is also the reference implementation of
 * `MoviesProvider`: it supports every capability, which keeps the UI's
 * capability-aware branches honest.
 */
export const fixtureProvider: MoviesProvider = {
  id: 'fixture',
  label: 'Bundled catalogue',
  capabilities: { yearFilter: true, genreFilter: true, details: true },

  async search(query: SearchQuery, signal?: AbortSignal): Promise<MoviesPage> {
    throwIfAborted(signal)
    return searchCatalog(query)
  },

  async getById(id: string, signal?: AbortSignal): Promise<Movie | null> {
    throwIfAborted(signal)
    return CATALOG.find((movie) => movie.id === id) ?? null
  },
}
