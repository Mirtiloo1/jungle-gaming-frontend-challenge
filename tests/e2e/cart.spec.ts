import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'

async function addNft(page: Page) {
  await page.goto('/nfts/nft-001')
  await page.getByRole('button', { name: /^(COMPRAR|Comprar NFT)$/ }).click()
  await page
    .getByRole('dialog', { name: 'Carrinho de NFTs' })
    .getByRole('link', { name: 'Ver carrinho' })
    .click()
  await expect(page).toHaveURL(/\/carrinho/)
  await expect(page.getByTestId('cart-subtotal')).toHaveText('1.19 ETH')
}

test('carrinho vazio tem acesso ao catálogo e não oferece finalizar', async ({
  page,
}) => {
  await page.goto('/carrinho')
  await expect(
    page.getByRole('heading', { name: 'Seu carrinho está vazio' }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Conectar e finalizar' }),
  ).toHaveCount(0)
  await page.getByRole('link', { name: 'Explorar NFTs', exact: true }).click()
  await expect(page).toHaveURL(/#catalogo$/)
})

test('quantidade, limites, persistência e remoção recalculam totais exatos', async ({
  page,
}) => {
  await addNft(page)
  const row = page.getByRole('listitem', {
    name: 'Emerald Ape #042, edição 1/50',
    exact: true,
  })
  await expect(page.getByTestId('cart-total')).toHaveText('1.206 ETH')
  await row.getByRole('button', { name: 'Aumentar quantidade' }).click()
  await expect(page.getByTestId('cart-subtotal')).toHaveText('2.38 ETH')
  await expect(page.getByTestId('cart-total')).toHaveText('2.396 ETH')
  await page.reload()
  await expect(row.getByRole('spinbutton')).toHaveValue('2')
  await row.getByRole('spinbutton').fill('999')
  await expect(row.getByRole('spinbutton')).toHaveValue('5')
  await expect(
    row.getByRole('button', { name: 'Aumentar quantidade' }),
  ).toBeDisabled()
  await expect(
    row.getByRole('button', { name: /Remover Emerald/ }),
  ).toBeEnabled()
  await row.getByRole('button', { name: /Remover Emerald/ }).click()
  await expect(
    page.getByRole('heading', { name: 'Seu carrinho está vazio' }),
  ).toBeVisible()
  await page.reload()
  await expect(
    page.getByRole('heading', { name: 'Seu carrinho está vazio' }),
  ).toBeVisible()
})

test('cupom inválido ou expirado não altera total; cupom válido persiste e pode ser removido', async ({
  page,
}) => {
  await addNft(page)
  await page.getByLabel('Código promocional').fill('invalido')
  await page.getByRole('button', { name: 'Aplicar', exact: true }).click()
  await expect(page.getByRole('alert')).toHaveText(
    'Código promocional inválido.',
  )
  await expect(page.getByTestId('cart-total')).toHaveText('1.206 ETH')
  await page.getByLabel('Código promocional').fill('KURIOEXPIRED')
  await page.getByRole('button', { name: 'Aplicar', exact: true }).click()
  await expect(page.getByRole('alert')).toHaveText(
    'Este código promocional expirou.',
  )
  await expect(page.getByTestId('cart-total')).toHaveText('1.206 ETH')
  await page.getByLabel('Código promocional').fill('kurio10')
  await page.getByRole('button', { name: 'Aplicar', exact: true }).click()
  await expect(page.getByTestId('cart-discount')).toHaveText('(−) 0.119 ETH')
  await expect(page.getByTestId('cart-total')).toHaveText('1.087 ETH')
  await page.reload()
  await expect(page.getByTestId('cart-total')).toHaveText('1.087 ETH')
  await page.getByRole('button', { name: 'Remover cupom' }).click()
  await expect(page.getByTestId('cart-total')).toHaveText('1.206 ETH')
})

test('falha na atualização preserva os itens; finalizar abre pagamento protegido', async ({
  page,
}) => {
  await addNft(page)
  await page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem('kurio.mock-database.v1')!)
    data.carts = {}
    localStorage.setItem('kurio.mock-database.v1', JSON.stringify(data))
  })
  await page.getByRole('button', { name: 'Aumentar quantidade' }).click()
  await expect(page.getByRole('alert')).toHaveText(
    'Item não encontrado no carrinho.',
  )
  await expect(page.getByRole('spinbutton')).toHaveValue('1')
  await page.getByRole('button', { name: 'Conectar e finalizar' }).click()
  await expect(page).toHaveURL(/\/pagamento/)
  await expect(
    page.getByRole('button', { name: 'Entrar para continuar' }),
  ).toBeVisible()
})

test('layout de carrinho não tem overflow e recomendações navegam', async ({
  page,
}) => {
  await addNft(page)
  const mobileLayout = page.viewportSize()!.width < 1024
  if (mobileLayout) {
    await expect(
      page.getByRole('heading', { name: 'Carrinho de NFTs', exact: true }),
    ).toBeVisible()
    await expect(page.getByRole('searchbox')).toHaveCount(0)
    await expect(
      page.getByRole('navigation', { name: 'Navegação principal mobile' }),
    ).toHaveCount(0)
    await expect(page.getByRole('contentinfo')).toHaveCount(0)
    await page.getByRole('link', { name: 'Voltar ao mercado' }).click()
    const button = page.getByRole('button', {
      name: 'Abrir carrinho (1 itens)',
    })
    const anchor = await button.getByTestId('cart-icon-anchor').boundingBox()
    const badge = await button.getByText('1', { exact: true }).boundingBox()
    expect(anchor).not.toBeNull()
    expect(badge).not.toBeNull()
    expect(
      Math.abs(badge!.x + badge!.width / 2 - (anchor!.x + anchor!.width)),
    ).toBeLessThanOrEqual(1)
    expect(
      Math.abs(badge!.y + badge!.height / 2 - anchor!.y),
    ).toBeLessThanOrEqual(1)
    await button.click()
    await expect(page.getByTestId('cart-total')).toBeVisible()
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
    ).toBe(false)
    return
  }
  await expect(
    page.getByRole('heading', { name: 'Colecionadores também viram' }),
  ).toBeVisible()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false)
  await page
    .getByRole('region', { name: 'Colecionadores também viram' })
    .getByRole('link', {
      name: 'Ver detalhes de Cosmic Bloom #118',
      exact: true,
    })
    .click()
  await expect(page).toHaveURL(/\/nfts\/nft-004/)
})

test('revalida o carrinho quando preço e estoque mudam em tempo real', async ({
  page,
}) => {
  await page.goto('/nfts/nft-001')
  await page.getByRole('button', { name: 'Aumentar quantidade' }).click()
  await page.getByRole('button', { name: /^(COMPRAR|Comprar NFT)$/ }).click()
  await page.evaluate(() => {
    localStorage.setItem('kurio.mock-scenario', 'nft-updated')
  })
  await page
    .getByRole('dialog', { name: 'Carrinho de NFTs' })
    .getByRole('link', { name: 'Ver carrinho' })
    .click()
  const row = page.getByRole('listitem', {
    name: 'Emerald Ape #042, edição 1/50',
    exact: true,
  })
  await expect(row.getByRole('spinbutton')).toHaveValue('1', {
    timeout: 5_000,
  })
  await expect(
    page.getByText(
      'A quantidade de Emerald Ape #042 foi ajustada ao limite disponível.',
    ),
  ).toBeVisible()
  await expect(page.getByTestId('cart-subtotal')).toHaveText('1.29 ETH')
})
