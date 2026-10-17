import { test, expect } from '@playwright/test'

test('header navega entre seções e mantém uma única indicação ativa', async ({
  page,
}) => {
  test.skip(page.viewportSize()!.width < 1024, 'Navegação desktop')
  await page.goto('/')
  const nav = page.getByRole('navigation', {
    name: 'Navegação principal',
    exact: true,
  })
  for (const name of ['Início', 'Mercado', 'Criadores', 'Aprenda']) {
    const link = nav.getByRole('link', { name, exact: true })
    await link.click()
    await expect(link).toHaveAttribute('aria-current', 'page')
    await expect(nav.locator('[aria-current="page"]')).toHaveCount(1)
    await expect
      .poll(() => link.evaluate((el) => getComputedStyle(el).borderBottomColor))
      .toBe('rgb(210, 138, 76)')
  }
  await expect(page.locator('#aprenda')).toBeInViewport()
  await page.goBack()
  await expect(nav.getByRole('link', { name: 'Criadores' })).toHaveAttribute(
    'aria-current',
    'page',
  )
  await page.reload()
  await expect(nav.getByRole('link', { name: 'Criadores' })).toHaveAttribute(
    'aria-current',
    'page',
  )
  await nav.getByRole('link', { name: 'Início', exact: true }).click()
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
})

test('detalhes e carrinho pertencem ao Mercado no header', async ({ page }) => {
  test.skip(page.viewportSize()!.width < 1024, 'Navegação desktop')
  for (const path of ['/nfts/nft-001', '/carrinho']) {
    await page.goto(path)
    const nav = page.getByRole('navigation', {
      name: 'Navegação principal',
      exact: true,
    })
    await expect(nav.getByRole('link', { name: 'Mercado' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    await expect(nav.locator('[aria-current="page"]')).toHaveCount(1)
  }
})

test('botão central mobile abre catálogo e Início volta ao topo', async ({
  page,
}) => {
  test.skip(page.viewportSize()!.width >= 1024, 'Navegação mobile')
  await page.goto('/')
  const nav = page.getByRole('navigation', {
    name: 'Navegação principal mobile',
  })
  await nav
    .getByRole('link', { name: 'Explorar coleções', exact: true })
    .click()
  await expect(page).toHaveURL(/#catalogo$/)
  await expect(
    nav.getByRole('link', { name: 'Explorar coleções', exact: true }),
  ).toHaveAttribute('aria-current', 'page')
  await nav.getByRole('link', { name: 'Início', exact: true }).click()
  await expect(
    nav.getByRole('link', { name: 'Início', exact: true }),
  ).toHaveAttribute('aria-current', 'page')
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
})
