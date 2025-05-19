import { expect, test } from '@playwright/test'

test.describe('Movie detail', () => {
  test('opens from a result card and shows the full record', async ({ page }) => {
    await page.goto('/?q=orbit')

    await page.getByTestId('movie-card').first().click()

    await expect(page).toHaveURL(/\/movie\/fx0006$/)
    await expect(page.getByTestId('detail-title')).toHaveText('Orbit Nine')
    await expect(page.getByTestId('detail-meta')).toContainText('1996')
    await expect(page.getByTestId('detail-meta')).toContainText('115 min')
    await expect(page.getByTestId('detail-overview')).toContainText('ninth crew rotation')
  })

  test('the back link returns to the search that led here', async ({ page }) => {
    await page.goto('/?q=orbit')
    await page.getByTestId('movie-card').first().click()

    await page.getByTestId('detail-back').click()

    await expect(page).toHaveURL(/\?q=orbit$/)
    await expect(page.getByTestId('movie-grid')).toBeVisible()
  })

  test('an unknown id is reported instead of rendering an empty card', async ({ page }) => {
    await page.goto('/movie/does-not-exist')

    await expect(page.getByTestId('detail-missing')).toContainText('No movie with that id')
  })

  test('an unknown route renders the 404 page', async ({ page }) => {
    await page.goto('/nope/not-here')

    await expect(page.getByTestId('not-found')).toContainText('No such page')
    await expect(page.getByTestId('not-found')).toContainText('/nope/not-here')
  })
})
