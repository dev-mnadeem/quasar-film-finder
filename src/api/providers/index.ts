import { fixtureProvider } from '@/api/providers/fixtureProvider'
import { jsonmockProvider } from '@/api/providers/jsonmockProvider'
import type { MoviesProvider } from '@/api/providers/types'
import { appConfig, type MoviesProviderId } from '@/config/appConfig'

/** Every source the build knows about, keyed by the value of `VITE_MOVIES_PROVIDER`. */
export const MOVIES_PROVIDERS: Readonly<Record<MoviesProviderId, MoviesProvider>> = Object.freeze({
  fixture: fixtureProvider,
  jsonmock: jsonmockProvider,
})

export function getMoviesProvider(id: MoviesProviderId = appConfig.moviesProvider): MoviesProvider {
  return MOVIES_PROVIDERS[id]
}

export type { MoviesProvider }
