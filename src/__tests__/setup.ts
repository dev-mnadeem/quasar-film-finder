// jsdom has no ResizeObserver, and Quasar's layout components observe their own size
// from 2.2x on. A no-op is enough: the specs assert on content, never on measured layout.
class NoopResizeObserver implements ResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

globalThis.ResizeObserver ??= NoopResizeObserver
