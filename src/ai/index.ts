import { createRemoteQueryProvider } from '@/ai/remoteQueryProvider'
import { rulesQueryProvider } from '@/ai/rulesQueryProvider'
import type { QueryUnderstandingProvider } from '@/ai/types'
import { appConfig } from '@/config/appConfig'

/**
 * Picks the understanding provider for this build. With no endpoint configured the
 * app is fully offline and fully deterministic, which is the default.
 */
export function createQueryUnderstandingProvider(
  endpoint: string = appConfig.queryUnderstandingEndpoint,
): QueryUnderstandingProvider {
  return endpoint ? createRemoteQueryProvider(endpoint) : rulesQueryProvider
}

export { rulesQueryProvider, createRemoteQueryProvider }
export type { QueryUnderstandingProvider }
export type { QueryIntent } from '@/ai/types'
