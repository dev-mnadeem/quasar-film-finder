/** Raised by every movie source so the store has one error type to handle. */
export class MoviesApiError extends Error {
  readonly status: number | undefined

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'MoviesApiError'
    this.status = status
  }
}

/** True for the rejection `fetch` produces when its `AbortSignal` fires. */
export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

/** Rejection used by sources that abort without going through `fetch`. */
export function abortError(): DOMException {
  return new DOMException('The operation was aborted.', 'AbortError')
}
