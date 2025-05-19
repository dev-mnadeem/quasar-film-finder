/**
 * Every tunable in the app, read once from `import.meta.env`.
 *
 * Nothing else in `src/` touches `import.meta.env` directly, so the set of knobs a
 * reviewer has to learn is exactly the set documented in `.env.example`.
 */

/** Delay between the last keystroke and the search request. */
export const SEARCH_DEBOUNCE_MS = 350

/** Page size used when a source lets us choose (the jsonmock endpoint fixes its own). */
export const DEFAULT_PAGE_SIZE = 10

/** Number of page links `QPagination` renders before collapsing into ellipses. */
export const MAX_PAGINATION_LINKS = 7

/** Cards rendered by the skeleton grid while the first page is loading. */
export const SKELETON_CARD_COUNT = 10

/** Lowest and highest release year the year filter will accept. */
export const MIN_RELEASE_YEAR = 1900
export const MAX_RELEASE_YEAR = 2100

export type MoviesProviderId = 'fixture' | 'jsonmock'

const PROVIDER_IDS: readonly MoviesProviderId[] = ['fixture', 'jsonmock']

function readProviderId(raw: unknown): MoviesProviderId {
  return PROVIDER_IDS.includes(raw as MoviesProviderId) ? (raw as MoviesProviderId) : 'fixture'
}

function readString(raw: unknown): string {
  return typeof raw === 'string' ? raw.trim() : ''
}

export interface AppConfig {
  /** Which catalogue backs the search box. */
  readonly moviesProvider: MoviesProviderId
  /**
   * Optional HTTP endpoint that turns a natural-language phrase into a structured
   * query. Empty string means "use the local rule-based parser only".
   */
  readonly queryUnderstandingEndpoint: string
}

export const appConfig: AppConfig = {
  moviesProvider: readProviderId(import.meta.env.VITE_MOVIES_PROVIDER),
  queryUnderstandingEndpoint: readString(import.meta.env.VITE_AI_QUERY_ENDPOINT),
}
