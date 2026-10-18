import { expect, test } from '@playwright/test'

test('home shows the catalogue and opens chapter 01', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Caching, from first principles.',
  )
  const catalogue = page.locator('section', { has: page.locator('#chapters') })
  await expect(catalogue.locator('ol > li')).toHaveCount(8)
  await expect(catalogue).toContainText("Someone else's basket")
  await expect(page.getByRole('figure').first()).toContainText('HTTP GET to localhost')

  await page.getByRole('link', { name: 'Start chapter 01' }).click()
  await expect(page).toHaveURL(/\/workshop\/01-hits-and-misses$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Hits and misses')
})

test('the shelf evicts the bestseller with FIFO and keeps it with LRU', async ({ page }) => {
  await page.goto('/#shelf')
  const shelf = page.locator('#shelf')
  const play = shelf.getByRole('button', { name: 'Play the bestseller pattern' })

  await play.click()
  await expect(shelf.getByTestId('Dune fetched')).toHaveText('2')
  await expect(shelf.getByTestId('Hits')).toHaveText('4')

  await shelf.getByText('LRU', { exact: true }).click()
  await expect(shelf.getByTestId('Visits')).toHaveText('0')
  await play.click()
  await expect(shelf.getByTestId('Dune fetched')).toHaveText('1')
  await expect(shelf.getByRole('status')).toContainText('Dune was on the shelf')

  await shelf.getByRole('button', { name: 'Orbital' }).click()
  await expect(shelf.getByRole('status')).toContainText('Hit.')
  await shelf.getByRole('button', { name: 'Middlemarch' }).click()
  await expect(shelf.getByRole('status')).toContainText('evicted to make room')
})

test('Hazel quizzes you, in readable colours', async ({ page }) => {
  await page.goto('/workshop/07-caching-nothing')
  await page.getByRole('button', { name: 'Ask Hazel' }).click()
  const panel = page.getByRole('region', { name: "Hazel's notes" })
  await expect(panel).toContainText('bool(0) is False')

  await panel.getByRole('button', { name: 'if cache.get(key):' }).click()
  const verdict = panel.getByRole('status').first()
  await expect(verdict).toContainText('Not quite.')
  await expect(panel.getByRole('button', { name: 'if key in cache:' })).toBeDisabled()
  // The explanation is dark text on the light card, never light on light.
  const colours = await verdict.evaluate((node) => ({
    text: getComputedStyle(node).color,
    card: getComputedStyle(node.closest('section') as Element).backgroundColor,
  }))
  expect(colours).toEqual({ text: 'rgb(70, 65, 58)', card: 'rgb(255, 252, 245)' })

  await page.keyboard.press('Escape')
  await expect(panel).toBeHidden()
})

test('chapters page through in order', async ({ page }) => {
  await page.goto('/workshop')
  await expect(page.locator('main ol > li')).toHaveCount(8)

  await page.locator('main ol > li').nth(4).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Stampedes')
  await expect(page.locator('main')).toContainText('bestseller queries:  50')
  await page.getByRole('link', { name: /Next/ }).click()
  await expect(page).toHaveURL(/06-eviction$/)
})

test('nothing scrolls sideways', async ({ page }) => {
  for (const path of ['/', '/workshop', '/workshop/08-http-caching', '/workshop/06-eviction']) {
    await page.goto(path)
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow, path).toBeLessThanOrEqual(0)
  }
})

test('back to top returns to the top', async ({ page }) => {
  await page.goto('/workshop/08-http-caching')
  await page.evaluate(() => window.scrollTo(0, 3000))
  const button = page.getByRole('button', { name: 'Back to top' })

  await expect(button).toBeVisible()
  await button.click()
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
})
