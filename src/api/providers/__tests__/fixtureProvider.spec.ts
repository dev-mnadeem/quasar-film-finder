import { describe, expect, it } from 'vitest'

import { fixtureProvider, searchCatalog } from '@/api/providers/fixtureProvider'
import { CATALOG, CATALOG_GENRES } from '@/data/catalog'
import { emptyQuery } from '@/types/movies'

describe('bundled catalogue', () => {
  it('exposes every genre used by its entries', () => {
    const used = new Set(CATALOG.flatMap((movie) => movie.genres))
    expect([...CATALOG_GENRES].sort()).toEqual([...used].sort())
  })

  it('gives every entry a stable id', () => {
    const ids = CATALOG.map((movie) => movie.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('searchCatalog', () => {
  it('matches titles case-insensitively on a substring', () => {
    const result = searchCatalog(emptyQuery('night'))

    expect(result.total).toBe(4)
    expect(result.movies.map((movie) => movie.title)).toContain('Midnight at the Exchange')
  })

  it('ranks prefix matches above substring matches', () => {
    const result = searchCatalog(emptyQuery('orbit'))

    expect(result.movies[0]?.title).toBe('Orbit Nine')
    expect(result.movies[1]?.title).toBe('Low Orbit Lullaby')
  })

  it('paginates with a stable page size', () => {
    const first = searchCatalog(emptyQuery('the', 1))
    const second = searchCatalog(emptyQuery('the', 2))

    expect(first.total).toBe(11)
    expect(first.totalPages).toBe(2)
    expect(first.movies).toHaveLength(10)
    expect(second.movies).toHaveLength(1)
    expect(second.page).toBe(2)

    const ids = [...first.movies, ...second.movies].map((movie) => movie.id)
    expect(new Set(ids).size).toBe(11)
  })

  it('clamps a page beyond the end back onto the last page', () => {
    expect(searchCatalog(emptyQuery('night', 99)).page).toBe(1)
  })

  it('filters by year range', () => {
    const result = searchCatalog({ ...emptyQuery(''), yearFrom: 1990, yearTo: 1999 })

    expect(result.total).toBeGreaterThan(0)
    for (const movie of result.movies) {
      expect(movie.year).toBeGreaterThanOrEqual(1990)
      expect(movie.year).toBeLessThanOrEqual(1999)
    }
  })

  it('requires every requested genre to be present', () => {
    const one = searchCatalog({ ...emptyQuery(''), genres: ['Sci-Fi'] })
    const both = searchCatalog({ ...emptyQuery(''), genres: ['Sci-Fi', 'Romance'] })

    expect(both.total).toBeLessThan(one.total)
    for (const movie of both.movies) {
      expect(movie.genres).toContain('Sci-Fi')
      expect(movie.genres).toContain('Romance')
    }
  })

  it('combines a title, a year range and a genre', () => {
    const result = searchCatalog({
      ...emptyQuery(''),
      yearFrom: 1990,
      yearTo: 1999,
      genres: ['Sci-Fi'],
    })

    expect(result.movies.map((movie) => movie.title)).toEqual([
      'Orbit Nine',
      'Starfall Country',
      'The Last Signal',
    ])
  })

  it('returns an empty page rather than throwing when nothing matches', () => {
    const result = searchCatalog(emptyQuery('zzzznothing'))

    expect(result.total).toBe(0)
    expect(result.totalPages).toBe(0)
    expect(result.movies).toEqual([])
    expect(result.page).toBe(1)
  })

  it('is deterministic for the same query', () => {
    const a = searchCatalog(emptyQuery('the'))
    const b = searchCatalog(emptyQuery('the'))
    expect(a.movies.map((m) => m.id)).toEqual(b.movies.map((m) => m.id))
  })
})

describe('fixtureProvider', () => {
  it('advertises full capabilities', () => {
    expect(fixtureProvider.capabilities).toEqual({
      yearFilter: true,
      genreFilter: true,
      details: true,
    })
  })

  it('resolves a movie by id', async () => {
    const movie = await fixtureProvider.getById('fx0006')
    expect(movie?.title).toBe('Orbit Nine')
  })

  it('returns null for an unknown id', async () => {
    expect(await fixtureProvider.getById('nope')).toBeNull()
  })

  it('rejects when the signal is already aborted', async () => {
    const controller = new AbortController()
    controller.abort()

    await expect(fixtureProvider.search(emptyQuery('night'), controller.signal)).rejects.toThrow(
      DOMException,
    )
  })

  it('gives every entry either a poster path or an explicit null', () => {
    const withPoster = CATALOG.filter((movie) => movie.posterPath !== null)
    const withoutPoster = CATALOG.filter((movie) => movie.posterPath === null)

    expect(withPoster.length).toBe(24)
    expect(withoutPoster.length).toBe(2)
    for (const movie of withPoster) {
      expect(movie.posterPath).toBe(`/posters/${movie.id}.svg`)
    }
  })
})
