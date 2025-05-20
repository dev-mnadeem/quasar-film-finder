import type { MoviesProviderId } from '@/config/appConfig'
import type { Movie, MoviesPage, ProviderCapabilities, SearchQuery } from '@/types/movies'

/**
 * The seam every catalogue plugs into.
 *
 * Adding a source (TMDB, OMDb, an internal service) means writing one file that
 * implements this interface and registering it in `providers/index.ts`. Nothing in
 * the store or the components changes.
 */
export interface MoviesProvider {
  readonly id: MoviesProviderId
  /** Human-readable name shown in the results header. */
  readonly label: string
  readonly capabilities: ProviderCapabilities
  search(query: SearchQuery, signal?: AbortSignal): Promise<MoviesPage>
  /** `null` when the source has no detail endpoint or the id is unknown. */
  getById(id: string, signal?: AbortSignal): Promise<Movie | null>
}
