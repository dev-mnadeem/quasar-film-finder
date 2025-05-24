import { expect, test } from '@playwright/test'

/**
 * Runs against a build configured for the live jsonmock source, with the endpoint
 * stubbed by `page.route`. That keeps the HTTP client, its response validation and
 * the capability warnings under test without depending on a third-party service.
 */

const SEARCH_ROUTE = '**/api/movies/search**'

const pageOne = {
  page: 1,
  per_page: 10,
  total: 11,
  total_pages: 2,
  data: [
    { Title: 'Alpha', Year: 2001, imdbID: 'tt100' },
    { Title: 'Beta', Year: 2002, imdbID: 'tt101' },
  ],
}

const pageTwo = {
  page: 2,
  per_page: 10,
  total: 11,
  total_pages: 2,
  data: [{ Title: 'Gamma', Year: 2003, imdbID: 'tt102' }],
}

test.describe('jsonmock source', () => {
  test('searches and paginates against the stubbed endpoint', async ({ page }) => {
    await page.route(SEARCH_ROUTE, async (route) => {
      const requested = new URL(route.request().url()).searchParams.get('page') ?? '1'
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(requested === '2' ? pageTwo : pageOne),
      })
    })

    await page.goto('/')
    await page.getByLabel('Search movies').fill('mock')
    await page.getByTestId('movie-search-submit').click()

    await expect(page.getByTestId('movie-grid')).toContainText('Alpha')
    await expect(page.getByTestId('movie-total')).toContainText('11 results')

    await page.getByTestId('movie-pagination').getByRole('button', { name: 'Next page' }).click()
    await expect(page.getByTestId('movie-grid')).toContainText('Gamma')
  })

  test('exposes busy state while a request is in flight', async ({ page }) => {
    let release: () => void = () => {}
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })

    await page.route(SEARCH_ROUTE, async (route) => {
      await gate
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(pageOne),
      })
    })

    await page.goto('/')
    await page.getByLabel('Search movies').fill('hold')
    const busy = expect(page.getByTestId('movie-results-section')).toHaveAttribute(
      'aria-busy',
      'true',
    )
    await page.getByTestId('movie-search-submit').click()
    await busy
    await expect(page.getByTestId('movie-skeleton')).toBeVisible()

    release()
    await expect(page.getByTestId('movie-results-section')).toHaveAttribute('aria-busy', 'false')
    await expect(page.getByTestId('movie-grid')).toContainText('Alpha')
  })

  test('surfaces a server failure with a retry that recovers', async ({ page }) => {
    let failNext = true
    await page.route(SEARCH_ROUTE, async (route) => {
      if (failNext) {
        failNext = false
        await route.fulfill({ status: 503, contentType: 'text/plain', body: 'down' })
        return
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(pageOne),
      })
    })

    await page.goto('/?q=boom')

    await expect(page.getByTestId('movie-error')).toContainText('503')
    await page.getByTestId('movie-error').getByRole('button', { name: 'Retry' }).click()
    await expect(page.getByTestId('movie-grid')).toContainText('Alpha')
  })

  test('says so when the source cannot honour a filter', async ({ page }) => {
    await page.route(SEARCH_ROUTE, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(pageOne),
      })
    })

    await page.goto('/?q=alpha%20from%20the%2090s')

    await expect(page.getByTestId('movie-ignored-filters')).toContainText('release year')
    await expect(page.getByTestId('movie-grid')).toContainText('Alpha')
  })
})
