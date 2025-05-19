import { describe, expect, it } from 'vitest'

import { parsePhrase } from '@/ai/rulesQueryProvider'

describe('parsePhrase', () => {
  it('treats a phrase with no filter words as a literal title', () => {
    const intent = parsePhrase('The Last Signal')

    expect(intent.title).toBe('the last signal')
    expect(intent.yearFrom).toBeNull()
    expect(intent.yearTo).toBeNull()
    expect(intent.genres).toEqual([])
  })

  it('expands a two-digit decade', () => {
    expect(parsePhrase('90s')).toMatchObject({ yearFrom: 1990, yearTo: 1999 })
    expect(parsePhrase('20s')).toMatchObject({ yearFrom: 2020, yearTo: 2029 })
  })

  it('expands a four-digit decade and a decade word', () => {
    expect(parsePhrase('1980s thriller')).toMatchObject({ yearFrom: 1980, yearTo: 1989 })
    expect(parsePhrase('eighties thriller')).toMatchObject({ yearFrom: 1980, yearTo: 1989 })
  })

  it('reads a bare year as an exact year', () => {
    expect(parsePhrase('2016 comedy')).toMatchObject({
      yearFrom: 2016,
      yearTo: 2016,
      genres: ['Comedy'],
      title: '',
    })
  })

  it('reads before, after and between', () => {
    expect(parsePhrase('drama before 2000')).toMatchObject({ yearFrom: null, yearTo: 1999 })
    expect(parsePhrase('drama after 2010')).toMatchObject({ yearFrom: 2011, yearTo: null })
    expect(parsePhrase('drama between 1995 and 2005')).toMatchObject({
      yearFrom: 1995,
      yearTo: 2005,
    })
  })

  it('maps genre synonyms onto catalogue genres', () => {
    expect(parsePhrase('science fiction').genres).toEqual(['Sci-Fi'])
    expect(parsePhrase('scifi').genres).toEqual(['Sci-Fi'])
    expect(parsePhrase('sci-fi').genres).toEqual(['Sci-Fi'])
    expect(parsePhrase('documentaries').genres).toEqual(['Documentary'])
    expect(parsePhrase('animated').genres).toEqual(['Animation'])
    expect(parsePhrase('rom-com').genres).toEqual(['Comedy', 'Romance'])
  })

  it('keeps the remaining words as the title once a filter has matched', () => {
    const intent = parsePhrase('sci-fi movies about space from the 90s')

    expect(intent).toMatchObject({
      title: 'space',
      yearFrom: 1990,
      yearTo: 1999,
      genres: ['Sci-Fi'],
    })
  })

  it('never strips filler words when nothing else matched', () => {
    expect(parsePhrase('the understory').title).toBe('the understory')
  })

  it('explains what it understood', () => {
    expect(parsePhrase('sci-fi from the 90s').explanation).toBe(
      'any title, years 1990-1999, genre Sci-Fi',
    )
    expect(parsePhrase('night').explanation).toBe('title "night"')
    expect(parsePhrase('comedy after 2010').explanation).toBe('any title, from 2011, genre Comedy')
  })

  it('carries the requested page through and marks its own source', () => {
    const intent = parsePhrase('night', 3)

    expect(intent.page).toBe(3)
    expect(intent.source).toBe('rules')
  })

  it('handles an empty phrase without throwing', () => {
    expect(parsePhrase('   ')).toMatchObject({ title: '', genres: [] })
  })
})
