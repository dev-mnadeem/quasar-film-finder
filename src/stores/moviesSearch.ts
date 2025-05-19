import { computed, ref, shallowRef } from 'vue'
import { defineStore } from 'pinia'

import { isAbortError, MoviesApiError } from '@/api/errors'
import { getMoviesProvider, type MoviesProvider } from '@/api/providers'
import { createQueryUnderstandingProvider } from '@/ai'
import type { QueryIntent, QueryUnderstandingProvider } from '@/ai/types'
import { DEFAULT_PAGE_SIZE } from '@/config/appConfig'
import type { Movie, MoviesPage } from '@/types/movies'

export type MoviesSearchStatus = 'idle' | 'loading' | 'success' | 'error'

const GENERIC_ERROR = 'Something went wrong while loading movies.'

/**
 * Owns the search lifecycle: phrase in, page of movies out.
 *
 * Two things matter here and both are tested:
 *
 * 1. **Only the newest request may touch the state.** Every call takes a ticket
 *    from `requestId`. A response — success *or* failure — is dropped unless its
 *    ticket is still the current one. Aborting alone is not enough: a request whose
 *    `fetch` already resolved cannot be cancelled, so a slow failure from an
 *    abandoned keystroke could otherwise blank out the results of a newer one.
 * 2. **Filters the source cannot honour are reported, not silently dropped.**
 */
export const useMoviesSearchStore = defineStore('moviesSearch', () => {
  const provider = shallowRef<MoviesProvider>(getMoviesProvider())
  const queryProvider = shallowRef<QueryUnderstandingProvider>(createQueryUnderstandingProvider())

  const phrase = ref('')
  const intent = shallowRef<QueryIntent | null>(null)
  const page = ref(1)
  const status = ref<MoviesSearchStatus>('idle')
  const errorMessage = ref('')
  const movies = shallowRef<readonly Movie[]>([])
  const total = ref(0)
  const totalPages = ref(0)
  const perPage = ref(DEFAULT_PAGE_SIZE)

  let abortController: AbortController | null = null
  let requestId = 0

  const isLoading = computed(() => status.value === 'loading')
  const sourceLabel = computed(() => provider.value.label)

  /** Filters the user asked for that this source has no parameter for. */
  const ignoredFilters = computed<readonly string[]>(() => {
    const current = intent.value
    if (!current) return []
    const ignored: string[] = []
    const caps = provider.value.capabilities
    if (!caps.yearFilter && (current.yearFrom !== null || current.yearTo !== null)) {
      ignored.push('release year')
    }
    if (!caps.genreFilter && current.genres.length > 0) {
      ignored.push('genre')
    }
    return ignored
  })

  /** True when the phrase resolved to filters only and the source needs a title. */
  const needsTitle = computed(() => {
    const current = intent.value
    return current !== null && current.title === '' && !provider.value.capabilities.genreFilter
  })

  function abortInFlight(): void {
    abortController?.abort()
    abortController = null
  }

  function resetResults(): void {
    movies.value = []
    total.value = 0
    totalPages.value = 0
    perPage.value = DEFAULT_PAGE_SIZE
  }

  function clear(): void {
    abortInFlight()
    requestId += 1
    phrase.value = ''
    intent.value = null
    page.value = 1
    status.value = 'idle'
    errorMessage.value = ''
    resetResults()
  }

  function applyPage(result: MoviesPage): void {
    page.value = result.page
    movies.value = result.movies
    total.value = result.total
    totalPages.value = result.totalPages
    perPage.value = result.perPage
    status.value = 'success'
    errorMessage.value = ''
  }

  function messageFor(error: unknown): string {
    if (error instanceof MoviesApiError) return error.message
    if (error instanceof Error) return error.message
    return GENERIC_ERROR
  }

  async function run(current: QueryIntent): Promise<void> {
    abortInFlight()
    const controller = new AbortController()
    abortController = controller
    const ticket = (requestId += 1)

    status.value = 'loading'
    errorMessage.value = ''

    try {
      const result = await provider.value.search(current, controller.signal)
      if (ticket !== requestId) return
      applyPage(result)
    } catch (error: unknown) {
      if (ticket !== requestId || isAbortError(error)) return
      status.value = 'error'
      errorMessage.value = messageFor(error)
      resetResults()
    } finally {
      if (abortController === controller) {
        abortController = null
      }
    }
  }

  /** Parse a raw phrase, then fetch its first page. */
  async function search(rawPhrase: string): Promise<void> {
    const text = rawPhrase.trim()
    phrase.value = text
    if (!text) {
      clear()
      return
    }

    const parsed = await queryProvider.value.parse(text, 1)
    intent.value = parsed
    page.value = 1

    if (!parsed.title && !provider.value.capabilities.genreFilter) {
      abortInFlight()
      requestId += 1
      status.value = 'idle'
      errorMessage.value = ''
      resetResults()
      return
    }

    await run(parsed)
  }

  async function setPage(nextPage: number): Promise<void> {
    const current = intent.value
    if (!current || !Number.isFinite(nextPage) || nextPage < 1) return
    const target = Math.floor(nextPage)
    if (target === page.value) return
    page.value = target
    await run({ ...current, page: target })
  }

  function reset(): void {
    clear()
  }

  /** Dependency injection seam used by the unit tests and by any future source picker. */
  function useSource(next: MoviesProvider): void {
    provider.value = next
  }

  function useQueryUnderstanding(next: QueryUnderstandingProvider): void {
    queryProvider.value = next
  }

  return {
    provider,
    phrase,
    intent,
    page,
    status,
    errorMessage,
    movies,
    total,
    totalPages,
    perPage,
    isLoading,
    sourceLabel,
    ignoredFilters,
    needsTitle,
    search,
    setPage,
    reset,
    useSource,
    useQueryUnderstanding,
  }
})
