import type { SearchQuery } from '@/types/movies'

/** A phrase turned into something the provider layer can execute. */
export interface QueryIntent extends SearchQuery {
  /** Which understanding provider produced this intent. */
  readonly source: 'rules' | 'remote'
  /** One short line the UI shows so the interpretation is never a surprise. */
  readonly explanation: string
}

/**
 * Turns "90s sci-fi about space" into `{title: 'space', yearFrom: 1990, yearTo: 1999,
 * genres: ['Sci-Fi']}`.
 *
 * Implementations must be safe to call on every keystroke and must never reject for
 * an unparseable phrase — the worst acceptable outcome is "the whole phrase is the
 * title".
 */
export interface QueryUnderstandingProvider {
  readonly id: 'rules' | 'remote'
  readonly label: string
  parse(phrase: string, page: number, signal?: AbortSignal): Promise<QueryIntent>
}
