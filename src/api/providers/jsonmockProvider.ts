import { fetchMoviesSearch } from '@/api/moviesClient'
import type { MoviesProvider } from '@/api/providers/types'
import type { Movie, MoviesPage, MovieRecord, SearchQuery } from '@/types/movies'

/** The jsonmock endpoint returns three fields and nothing else. */
function toMovie(record: MovieRecord): Movie {
  return {
    id: record.imdbID,
    title: record.Title,
    year: record.Year,
    posterPath: null,
    rating: null,
    genres: [],
    overview: null,
    runtimeMinutes: null,
  }
}

/**
 * Live HackerRank jsonmock catalogue.
 *
 * It searches by title only: it has no year or genre parameters and no detail
 * endpoint, which is what `capabilities` tells the UI. The UI then says so out loud
 * instead of silently dropping the filters the user typed.
 */
export const jsonmockProvider: MoviesProvider = {
  id: 'jsonmock',
  label: 'HackerRank jsonmock',
  capabilities: { yearFilter: false, genreFilter: false, details: false },

  async search(query: SearchQuery, signal?: AbortSignal): Promise<MoviesPage> {
    const response = await fetchMoviesSearch({ title: query.title, page: query.page }, signal)
    return {
      movies: response.data.map(toMovie),
      page: response.page,
      perPage: response.per_page,
      total: response.total,
      totalPages: response.total_pages,
    }
  },

  async getById(): Promise<Movie | null> {
    return null
  },
}
