import catalogJson from './catalog.json'
import type { Movie } from '@/types/movies'

interface CatalogEntry {
  id: string
  title: string
  year: number
  rating: number
  runtimeMinutes: number
  genres: string[]
  overview: string
  posterPath?: string | null
}

/** Poster files are generated from this catalogue by `scripts/generate-posters.mjs`. */
function posterPathFor(entry: CatalogEntry): string | null {
  if (entry.posterPath === null) {
    return null
  }
  return entry.posterPath ?? `/posters/${entry.id}.svg`
}

function toMovie(entry: CatalogEntry): Movie {
  return {
    id: entry.id,
    title: entry.title,
    year: entry.year,
    posterPath: posterPathFor(entry),
    rating: entry.rating,
    genres: Object.freeze([...entry.genres]),
    overview: entry.overview,
    runtimeMinutes: entry.runtimeMinutes,
  }
}

/** The bundled catalogue, sorted by title so ties in the search ranking are stable. */
export const CATALOG: readonly Movie[] = Object.freeze(
  (catalogJson.movies as CatalogEntry[])
    .map(toMovie)
    .sort((a, b) => a.title.localeCompare(b.title, 'en')),
)

/** Every genre present in the catalogue, alphabetical. Drives the genre filter. */
export const CATALOG_GENRES: readonly string[] = Object.freeze(
  [...new Set(CATALOG.flatMap((movie) => movie.genres))].sort((a, b) => a.localeCompare(b, 'en')),
)
