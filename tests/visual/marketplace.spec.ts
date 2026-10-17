import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear()
  })
})

for (const [label, path] of [
  ['início', '/'],
  ['detalhe-nft', '/nfts/nft-001'],
] as const) {
  test(`${label} preserva o layout`, async ({ page }) => {
    test.skip(test.info().project.name === 'tablet')
    await page.goto(path)
    if (path === '/')
      await expect(page.getByTestId('catalog-grid')).toBeVisible()
    else
      await expect(
        page.getByRole('heading', { name: 'Emerald Ape #042', level: 1 }),
      ).toBeVisible()
    await expect(page).toHaveScreenshot(`${label}.png`, {
      fullPage: true,
      animations: 'disabled',
      caret: 'hide',
      maxDiffPixelRatio: 0.01,
    })
  })
}
