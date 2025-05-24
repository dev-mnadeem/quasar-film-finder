import { expect, test } from '@playwright/test'

/**
 * Runs against the bundled catalogue, so these assertions are about real rendered
 * data: no network, no stubs, no API key.
 */

test.describe('Search against the bundled catalogue', () => {
  test('starts on an idle state that explains itself', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByTestId('movie-idle-hint')).toBeVisible()
    await expect(page.getByTestId('movie-examples')).toContainText('sci-fi from the 90s')
    await expect(page.getByTestId('movie-grid')).toBeHidden()
  })

  test('debounced typing searches and puts the query in the URL', async ({ page }) => {
    await page.goto('/')

    await page.getByLabel('Search movies').fill('night')

    await expect(page.getByTestId('movie-grid')).toBeVisible()
    await expect(page.getByTestId('movie-total')).toContainText('4 results')
    await expect(page).toHaveURL(/\?q=night$/)
    await expect(page.getByTestId('movie-card')).toHaveCount(4)
  })

  test('posters actually load, and missing artwork falls back', async ({ page }) => {
    await page.goto('/?q=night')

    const images = page.getByTestId('movie-poster-image')
    await expect(images).toHaveCount(3)
    for (const image of await images.all()) {
      await expect(image).toHaveJSProperty('complete', true)
      expect(await image.evaluate((node: HTMLImageElement) => node.naturalWidth)).toBeGreaterThan(0)
    }

    // "The Night Gardener" has no poster in the catalogue.
    await expect(page.getByTestId('movie-poster-fallback')).toHaveCount(1)
    await expect(page.getByTestId('movie-poster-fallback')).toContainText('No poster')
  })

  test('paginates a broad query and keeps the page in the URL', async ({ page }) => {
    await page.goto('/?q=the')

    await expect(page.getByTestId('movie-total')).toContainText('11 results')
    await expect(page.getByTestId('movie-card')).toHaveCount(10)

    await page.getByTestId('movie-pagination').getByRole('button', { name: 'Next page' }).click()

    await expect(page).toHaveURL(/page=2/)
    await expect(page.getByTestId('movie-card')).toHaveCount(1)
    await expect(page.getByTestId('movie-total')).toContainText('page 2 of 2')

    await page.goBack()
    await expect(page.getByTestId('movie-card')).toHaveCount(10)
  })

  test('a deep link restores the exact page of results and stays there', async ({ page }) => {
    await page.goto('/?q=the&page=2')

    await expect(page.getByTestId('movie-card')).toHaveCount(1)
    await expect(page.getByTestId('movie-card-title')).toHaveText('Midnight at the Exchange')

    // The field is populated from the URL: that must not trigger a fresh search
    // that throws the visitor back to page 1. Proving a navigation does *not*
    // happen means outwaiting the debounce, so this sleep is the assertion.
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(700)
    await expect(page).toHaveURL(/page=2/)
    await expect(page.getByTestId('movie-card')).toHaveCount(1)
  })

  test('a phrase is parsed into a title, a year range and a genre', async ({ page }) => {
    await page.goto('/')

    await page.getByLabel('Search movies').fill('sci-fi from the 90s')

    await expect(page.getByTestId('movie-intent')).toContainText('any title')
    await expect(page.getByTestId('movie-intent')).toContainText('years 1990-1999')
    await expect(page.getByTestId('movie-intent')).toContainText('genre Sci-Fi')
    await expect(page.getByTestId('movie-card')).toHaveCount(3)
    await expect(page.getByTestId('movie-grid')).toContainText('Orbit Nine')
    await expect(page.getByTestId('movie-grid')).not.toContainText('Starling Protocol')
  })

  test('shows an empty state rather than a blank page', async ({ page }) => {
    await page.goto('/?q=zzzznothing')

    await expect(page.getByTestId('movie-empty')).toContainText('Nothing matched')
    await expect(page.getByTestId('movie-grid')).toBeHidden()
  })

  test('clearing the field returns to the idle state', async ({ page }) => {
    await page.goto('/?q=night')
    await expect(page.getByTestId('movie-grid')).toBeVisible()

    await page.getByLabel('Search movies').fill('')

    await expect(page.getByTestId('movie-idle-hint')).toBeVisible()
    await expect(page.getByTestId('movie-grid')).toBeHidden()
  })
})
