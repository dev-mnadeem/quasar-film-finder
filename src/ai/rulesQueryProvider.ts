import type { QueryIntent, QueryUnderstandingProvider } from '@/ai/types'
import { MAX_RELEASE_YEAR, MIN_RELEASE_YEAR } from '@/config/appConfig'
import { CATALOG_GENRES } from '@/data/catalog'

/** Spoken forms that map onto a catalogue genre. Longest phrases are matched first. */
const GENRE_SYNONYMS: ReadonlyArray<readonly [phrase: string, genres: readonly string[]]> = [
  ['science fiction', ['Sci-Fi']],
  ['rom com', ['Romance', 'Comedy']],
  ['rom-com', ['Romance', 'Comedy']],
  ['sci fi', ['Sci-Fi']],
  ['sci-fi', ['Sci-Fi']],
  ['scifi', ['Sci-Fi']],
  ['documentaries', ['Documentary']],
  ['documentary', ['Documentary']],
  ['docs', ['Documentary']],
  ['animated', ['Animation']],
  ['animation', ['Animation']],
  ['cartoons', ['Animation']],
  ['romantic', ['Romance']],
  ['romance', ['Romance']],
  ['thrillers', ['Thriller']],
  ['thriller', ['Thriller']],
  ['comedies', ['Comedy']],
  ['comedy', ['Comedy']],
  ['dramas', ['Drama']],
  ['drama', ['Drama']],
  ['horror', ['Horror']],
  ['action', ['Action']],
]

/** Decade words, so "nineties" behaves like "90s". */
const DECADE_WORDS: Readonly<Record<string, number>> = {
  sixties: 1960,
  seventies: 1970,
  eighties: 1980,
  nineties: 1990,
  noughties: 2000,
}

/**
 * Words that carry no title information once a filter has been recognised.
 * They are only stripped when at least one filter matched, so a literal title
 * search such as "The Last Signal" is never mangled.
 */
const FILLER_WORDS: ReadonlySet<string> = new Set([
  'a',
  'about',
  'an',
  'and',
  'film',
  'films',
  'from',
  'in',
  'like',
  'me',
  'movie',
  'movies',
  'of',
  'set',
  'show',
  'something',
  'the',
  'with',
])

/** Two-digit decades: 30-99 belong to the 1900s, 00-29 to the 2000s. */
const TWO_DIGIT_CENTURY_SPLIT = 30
const DECADE_LENGTH = 9

function clampYear(year: number): number {
  return Math.min(Math.max(year, MIN_RELEASE_YEAR), MAX_RELEASE_YEAR)
}

function expandTwoDigitDecade(value: number): number {
  return value >= TWO_DIGIT_CENTURY_SPLIT ? 1900 + value : 2000 + value
}

interface Extraction {
  rest: string
  yearFrom: number | null
  yearTo: number | null
  matched: boolean
}

function extractYears(phrase: string): Extraction {
  let rest = phrase
  let yearFrom: number | null = null
  let yearTo: number | null = null
  let matched = false

  const consume = (pattern: RegExp, apply: (groups: string[]) => void): void => {
    rest = rest.replace(pattern, (...args) => {
      const groups = args.slice(1, -2).map(String)
      apply(groups)
      matched = true
      return ' '
    })
  }

  consume(/\bbetween\s+((?:19|20)\d{2})\s+and\s+((?:19|20)\d{2})\b/g, ([a, b]) => {
    const low = Math.min(Number(a), Number(b))
    const high = Math.max(Number(a), Number(b))
    yearFrom = clampYear(low)
    yearTo = clampYear(high)
  })
  consume(/\b(?:before|earlier than)\s+((?:19|20)\d{2})\b/g, ([a]) => {
    yearTo = clampYear(Number(a) - 1)
  })
  consume(/\b(?:after|since|newer than)\s+((?:19|20)\d{2})\b/g, ([a]) => {
    yearFrom = clampYear(Number(a) + 1)
  })
  consume(/\b((?:19|20)\d{2})s\b/g, ([a]) => {
    yearFrom = clampYear(Number(a))
    yearTo = clampYear(Number(a) + DECADE_LENGTH)
  })
  consume(/\b(\d{2})s\b/g, ([a]) => {
    const start = expandTwoDigitDecade(Number(a))
    yearFrom = clampYear(start)
    yearTo = clampYear(start + DECADE_LENGTH)
  })
  consume(
    new RegExp(`\\b(${Object.keys(DECADE_WORDS).join('|')})\\b`, 'g'),
    ([word]: string[]): void => {
      const start = DECADE_WORDS[word as keyof typeof DECADE_WORDS]
      if (start === undefined) return
      yearFrom = clampYear(start)
      yearTo = clampYear(start + DECADE_LENGTH)
    },
  )
  consume(/\b((?:19|20)\d{2})\b/g, ([a]) => {
    yearFrom = clampYear(Number(a))
    yearTo = clampYear(Number(a))
  })

  return { rest, yearFrom, yearTo, matched }
}

function extractGenres(phrase: string): { rest: string; genres: string[] } {
  let rest = phrase
  const found = new Set<string>()

  for (const [needle, genres] of GENRE_SYNONYMS) {
    const pattern = new RegExp(`\\b${needle.replace(/[-]/g, '\\-')}\\b`, 'g')
    if (!pattern.test(rest)) continue
    rest = rest.replace(pattern, ' ')
    for (const genre of genres) found.add(genre)
  }

  const known = new Set(CATALOG_GENRES)
  const genres = [...found].filter((genre) => known.has(genre)).sort((a, b) => a.localeCompare(b))
  return { rest, genres }
}

function stripFiller(phrase: string): string {
  return phrase
    .split(/\s+/)
    .filter((word) => word && !FILLER_WORDS.has(word))
    .join(' ')
}

function describe(intent: Omit<QueryIntent, 'explanation' | 'source'>): string {
  const parts: string[] = []
  parts.push(intent.title ? `title "${intent.title}"` : 'any title')
  if (intent.yearFrom !== null && intent.yearTo !== null) {
    parts.push(
      intent.yearFrom === intent.yearTo
        ? `year ${intent.yearFrom}`
        : `years ${intent.yearFrom}-${intent.yearTo}`,
    )
  } else if (intent.yearFrom !== null) {
    parts.push(`from ${intent.yearFrom}`)
  } else if (intent.yearTo !== null) {
    parts.push(`up to ${intent.yearTo}`)
  }
  if (intent.genres.length > 0) {
    parts.push(`genre ${intent.genres.join(' + ')}`)
  }
  return parts.join(', ')
}

/**
 * Deterministic, offline parse of a search phrase. Pure apart from reading the
 * catalogue's genre list, so it is exhaustively unit-testable and never costs a
 * request.
 */
export function parsePhrase(phrase: string, page = 1): QueryIntent {
  const normalised = phrase.trim().toLowerCase()
  const years = extractYears(normalised)
  const { rest, genres } = extractGenres(years.rest)
  const hasFilters = years.matched || genres.length > 0

  const title = (hasFilters ? stripFiller(rest) : phrase.trim().toLowerCase())
    .replace(/\s+/g, ' ')
    .trim()

  const core = {
    title,
    page,
    yearFrom: years.yearFrom,
    yearTo: years.yearTo,
    genres,
  }
  return { ...core, source: 'rules', explanation: describe(core) }
}

export const rulesQueryProvider: QueryUnderstandingProvider = {
  id: 'rules',
  label: 'Local rule parser',
  async parse(phrase: string, page: number): Promise<QueryIntent> {
    return parsePhrase(phrase, page)
  },
}
