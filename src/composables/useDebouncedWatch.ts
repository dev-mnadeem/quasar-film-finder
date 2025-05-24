import { onScopeDispose, watch, type Ref } from 'vue'

import { SEARCH_DEBOUNCE_MS } from '@/config/appConfig'

export interface DebouncedWatchHandle {
  /** Drop a pending call. Used when something else has already run the search. */
  cancel(): void
  /** Run a pending call now, if there is one. */
  flush(): void
}

/**
 * Calls `callback` once the watched ref has been quiet for `ms`.
 *
 * `cancel()` matters as much as the debounce itself: pressing Enter or clicking
 * Search runs the query immediately, and without cancelling, the timer would fire
 * afterwards and issue a second identical request.
 */
export function useDebouncedWatch<T>(
  source: Ref<T>,
  callback: (value: T) => void,
  ms: number = SEARCH_DEBOUNCE_MS,
): DebouncedWatchHandle {
  let timer: ReturnType<typeof setTimeout> | undefined
  let pending: { value: T } | undefined

  function cancel(): void {
    if (timer !== undefined) {
      clearTimeout(timer)
      timer = undefined
    }
    pending = undefined
  }

  function flush(): void {
    const next = pending
    cancel()
    if (next) {
      callback(next.value)
    }
  }

  watch(
    source,
    (value) => {
      cancel()
      pending = { value }
      timer = setTimeout(() => {
        timer = undefined
        pending = undefined
        callback(value)
      }, ms)
    },
    { flush: 'post' },
  )

  onScopeDispose(cancel)

  return { cancel, flush }
}
