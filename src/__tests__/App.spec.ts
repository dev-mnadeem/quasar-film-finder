import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { Quasar } from 'quasar'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'

import App from '../App.vue'
import { routes } from '@/router'

// jsdom has no layout observer. Browser specs exercise the actual Quasar layout.
beforeAll(() => {
  vi.stubGlobal('ResizeObserver', class {
    observe() {}
    unobserve() {}
    disconnect() {}
  })
})
afterAll(() => vi.unstubAllGlobals())

async function mountApp(initialPath = '/') {
  const pinia = createPinia()
  const router = createRouter({ history: createMemoryHistory(), routes })
  await router.push(initialPath)
  const wrapper = mount(App, { global: { plugins: [Quasar, pinia, router] } })
  await router.isReady()
  await flushPromises()
  return wrapper
}

describe('App', () => {
  it('renders the shell and the search screen on the index route', async () => {
    const wrapper = await mountApp('/')

    expect(wrapper.text()).toContain('Film Finder')
    expect(wrapper.text()).toContain('Search movies')
    expect(wrapper.find('[data-testid="movie-idle-hint"]').exists()).toBe(true)
  })

  it('names the active catalogue source in the header', async () => {
    const wrapper = await mountApp('/')

    expect(wrapper.find('[data-testid="app-source"]').text()).toBe('Bundled catalogue')
  })

  it('renders results for a query carried in the URL', async () => {
    const wrapper = await mountApp('/?q=night')

    expect(wrapper.find('[data-testid="movie-grid"]').exists()).toBe(true)
    expect(wrapper.findAll('[data-testid="movie-card"]')).toHaveLength(4)
    expect(wrapper.find('[data-testid="movie-total"]').text()).toContain('4 results')
  })

  it('renders the 404 page for an unknown route', async () => {
    const wrapper = await mountApp('/no-such-page')

    expect(wrapper.find('[data-testid="not-found"]').text()).toContain('No such page')
  })
})
