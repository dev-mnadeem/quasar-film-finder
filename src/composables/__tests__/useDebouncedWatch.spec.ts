import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick, ref } from 'vue'

import { useDebouncedWatch, type DebouncedWatchHandle } from '../useDebouncedWatch'

const MS = 300

/** `onScopeDispose` only works inside an effect scope, which is what a component provides. */
function inScope<T>(setup: () => T): { value: T; stop: () => void } {
  const scope = effectScope()
  const value = scope.run(setup) as T
  return { value, stop: () => scope.stop() }
}

describe('useDebouncedWatch', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('calls back once after the source stops changing', async () => {
    const source = ref('')
    const spy = vi.fn<(value: string) => void>()
    const { stop } = inScope(() => useDebouncedWatch(source, spy, MS))

    source.value = 's'
    await nextTick()
    source.value = 'sp'
    await nextTick()
    source.value = 'spi'
    await nextTick()

    expect(spy).not.toHaveBeenCalled()
    vi.advanceTimersByTime(MS)
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith('spi')

    stop()
  })

  it('cancel drops the pending call', async () => {
    const source = ref('')
    const spy = vi.fn<(value: string) => void>()
    const { value, stop } = inScope<DebouncedWatchHandle>(() => useDebouncedWatch(source, spy, MS))

    source.value = 'x'
    await nextTick()
    value.cancel()
    vi.advanceTimersByTime(MS * 2)

    expect(spy).not.toHaveBeenCalled()
    stop()
  })

  it('flush runs the pending call immediately and only once', async () => {
    const source = ref('')
    const spy = vi.fn<(value: string) => void>()
    const { value, stop } = inScope<DebouncedWatchHandle>(() => useDebouncedWatch(source, spy, MS))

    source.value = 'now'
    await nextTick()
    value.flush()

    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith('now')

    vi.advanceTimersByTime(MS * 2)
    expect(spy).toHaveBeenCalledTimes(1)
    stop()
  })

  it('flush is a no-op when nothing is pending', () => {
    const source = ref('')
    const spy = vi.fn<(value: string) => void>()
    const { value, stop } = inScope<DebouncedWatchHandle>(() => useDebouncedWatch(source, spy, MS))

    value.flush()

    expect(spy).not.toHaveBeenCalled()
    stop()
  })

  it('stops firing once its scope is disposed', async () => {
    const source = ref('')
    const spy = vi.fn<(value: string) => void>()
    const { stop } = inScope(() => useDebouncedWatch(source, spy, MS))

    source.value = 'gone'
    await nextTick()
    stop()
    vi.advanceTimersByTime(MS * 2)

    expect(spy).not.toHaveBeenCalled()
  })
})
