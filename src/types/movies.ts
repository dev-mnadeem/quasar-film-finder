/**
 * Domain types for the movie search UI.
 *
 * `MovieRecord` / `MoviesSearchResponse` describe the *wire* shape returned by the
 * HackerRank jsonmock endpoint. Everything above the provider layer works with
 * `Movie` and `MoviesPage`, so a second catalogue source never leaks its own field
 * names into the store or the components.
 */

/** Raw entry as returned by `https://jsonmock.hackerrank.com/api/movies/search`. */
export interface MovieRecord {
  readonly Title: string
  readonly Year: number
  readonly imdbID: string
}

/** Raw envelope as returned by the jsonmock endpoint. */
export interface MoviesSearchResponse {
  readonly page: number
  readonly per_page: number
  readonly total: number
  readonly total_pages: number
  readonly data: readonly MovieRecord[]
}

/**
 * Normalised movie. Fields a source cannot supply are `null` or empty rather than
 * absent, so components never have to branch on `undefined`.
 */
export interface Movie {
  readonly id: string
  readonly title: string
  readonly year: number
  /** Absolute path under `public/`, or `null` when the source has no artwork. */
  readonly posterPath: string | null
  /** 0–10, or `null` when unknown. */
  readonly rating: number | null
  readonly genres: readonly string[]
  readonly overview: string | null
  readonly runtimeMinutes: number | null
}

/** One page of search results, normalised across sources. */
export interface MoviesPage {
  readonly movies: readonly Movie[]
  readonly page: number
  readonly perPage: number
  readonly total: number
  readonly totalPages: number
}

/** A fully resolved search request. Filters are ignored by sources that cannot honour them. */
export interface SearchQuery {
  readonly title: string
  readonly page: number
  readonly yearFrom: number | null
  readonly yearTo: number | null
  readonly genres: readonly string[]
}

/**
 * What a source can actually do. The UI reads this instead of hard-coding
 * assumptions, so switching sources degrades visibly rather than silently.
 */
export interface ProviderCapabilities {
  readonly yearFilter: boolean
  readonly genreFilter: boolean
  readonly details: boolean
}

export function emptyQuery(title = '', page = 1): SearchQuery {
  return { title, page, yearFrom: null, yearTo: null, genres: [] }
}

export function hasActiveFilters(query: SearchQuery): boolean {
  return query.yearFrom !== null || query.yearTo !== null || query.genres.length > 0
}
