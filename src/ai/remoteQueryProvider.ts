import { parsePhrase, rulesQueryProvider } from '@/ai/rulesQueryProvider'
import type { QueryIntent, QueryUnderstandingProvider } from '@/ai/types'
import { MAX_RELEASE_YEAR, MIN_RELEASE_YEAR } from '@/config/appConfig'
import { CATALOG_GENRES } from '@/data/catalog'

interface RemoteIntentBody {
  title?: unknown
  yearFrom?: unknown
  yearTo?: unknown
  genres?: unknown
}

function readYear(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  const year = Math.trunc(value)
  return year >= MIN_RELEASE_YEAR && year <= MAX_RELEASE_YEAR ? year : null
}

/** Only genres the catalogue actually has survive: a model is not allowed to invent facets. */
function readGenres(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const known = new Map(CATALOG_GENRES.map((genre) => [genre.toLowerCase(), genre]))
  const out = new Set<string>()
  for (const entry of value) {
    if (typeof entry !== 'string') continue
    const match = known.get(entry.trim().toLowerCase())
    if (match) out.add(match)
  }
  return [...out].sort((a, b) => a.localeCompare(b))
}

/**
 * Sends the phrase to a server-side endpoint that may use a language model, and
 * falls back to the local rule parser on any failure.
 *
 * The endpoint is a URL, never a model API key: a browser bundle is a public
 * document, so the key stays on whatever service answers this call. With
 * `VITE_AI_QUERY_ENDPOINT` unset the app never builds this provider at all.
 */
export function createRemoteQueryProvider(endpoint: string): QueryUnderstandingProvider {
  return {
    id: 'remote',
    label: 'Query endpoint',
    async parse(phrase: string, page: number, signal?: AbortSignal): Promise<QueryIntent> {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ phrase }),
          signal,
        })
        if (!response.ok) {
          return parsePhrase(phrase, page)
        }
        const body = (await response.json()) as RemoteIntentBody
        const title = typeof body.title === 'string' ? body.title.trim().toLowerCase() : ''
        const genres = readGenres(body.genres)
        const yearFrom = readYear(body.yearFrom)
        const yearTo = readYear(body.yearTo)
        if (!title && genres.length === 0 && yearFrom === null && yearTo === null) {
          return parsePhrase(phrase, page)
        }
        return {
          title,
          page,
          yearFrom,
          yearTo,
          genres,
          source: 'remote',
          explanation: `endpoint: ${title ? `title "${title}"` : 'any title'}${
            genres.length > 0 ? `, genre ${genres.join(' + ')}` : ''
          }`,
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          throw error
        }
        return rulesQueryProvider.parse(phrase, page)
      }
    },
  }
}
