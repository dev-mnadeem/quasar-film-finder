import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import MoviePoster from '../MoviePoster.vue'
import type { Movie } from '@/types/movies'

function movie(overrides: Partial<Movie> = {}): Movie {
  return {
    id: 'fx0001',
    title: 'The Last Signal',
    year: 1998,
    posterPath: '/posters/fx0001.svg',
    rating: 8.1,
    genres: ['Sci-Fi'],
    overview: null,
    runtimeMinutes: 124,
    ...overrides,
  }
}

describe('MoviePoster', () => {
  it('renders the artwork with a descriptive alt text', () => {
    const wrapper = mount(MoviePoster, { props: { movie: movie() } })
    const image = wrapper.get('[data-testid="movie-poster-image"]')

    expect(image.attributes('src')).toBe('/posters/fx0001.svg')
    expect(image.attributes('alt')).toBe('Poster for The Last Signal')
    expect(image.attributes('loading')).toBe('lazy')
  })

  it('loads the first cards eagerly', () => {
    const wrapper = mount(MoviePoster, { props: { movie: movie(), eager: true } })

    expect(wrapper.get('[data-testid="movie-poster-image"]').attributes('loading')).toBe('eager')
  })

  it('shows a fallback tile when the catalogue has no artwork', () => {
    const wrapper = mount(MoviePoster, { props: { movie: movie({ posterPath: null }) } })

    expect(wrapper.find('[data-testid="movie-poster-image"]').exists()).toBe(false)
    expect(wrapper.get('[data-testid="movie-poster-fallback"]').text()).toContain('No poster')
  })

  it('derives up to two initials for the fallback tile', () => {
    const wrapper = mount(MoviePoster, {
      props: { movie: movie({ posterPath: null, title: 'Night Harbour' }) },
    })

    expect(wrapper.get('[data-testid="movie-poster-fallback"]').text()).toContain('NH')
  })

  it('falls back when the image fails to load', async () => {
    const wrapper = mount(MoviePoster, { props: { movie: movie() } })

    await wrapper.get('[data-testid="movie-poster-image"]').trigger('error')

    expect(wrapper.find('[data-testid="movie-poster-image"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="movie-poster-fallback"]').exists()).toBe(true)
  })

  it('gives a new movie in the same slot a fresh attempt', async () => {
    const wrapper = mount(MoviePoster, { props: { movie: movie() } })
    await wrapper.get('[data-testid="movie-poster-image"]').trigger('error')
    expect(wrapper.find('[data-testid="movie-poster-fallback"]').exists()).toBe(true)

    await wrapper.setProps({ movie: movie({ id: 'fx0002', posterPath: '/posters/fx0002.svg' }) })

    expect(wrapper.find('[data-testid="movie-poster-image"]').exists()).toBe(true)
  })
})
