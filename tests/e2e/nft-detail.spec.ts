import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

async function login(page: Page) {
  await page
    .getByRole('button', { name: 'Entrar na conta', exact: true })
    .click()
  const dialog = page.getByRole('dialog', { name: 'Entrar na Kurio' })
  await dialog.getByLabel('E-mail', { exact: true }).fill('ana@kurio.test')
  await dialog.getByLabel('Senha', { exact: true }).fill('Kurio123!')
  await dialog.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(dialog).toBeHidden()
}

test('abre pelo catálogo e suporta acesso direto e refresh', async ({
  page,
}) => {
  await page.goto('/')
  await page
    .getByTestId('catalog-grid')
    .getByRole('link', {
      name: 'Ver detalhes de Emerald Ape #042',
      exact: true,
    })
    .click()
  await expect(page).toHaveURL(/\/nfts\/nft-001/)
  await expect(
    page.getByRole('heading', { name: 'Emerald Ape #042', level: 1 }),
  ).toBeVisible()
  await page.reload()
  await expect(
    page.getByRole('heading', { name: 'Emerald Ape #042', level: 1 }),
  ).toBeVisible()
  await expect(page.getByText('#0042', { exact: true })).toBeVisible()
})

test('galeria amplia e restaura o foco; miniaturas trocam o enquadramento', async ({
  page,
}) => {
  await page.goto('/nfts/nft-001')
  const thumbnail = page.getByRole('button', {
    name: 'Detalhe do rosto',
    exact: true,
  })
  if (await thumbnail.isVisible()) {
    await thumbnail.click()
    await expect(thumbnail).toHaveAttribute('aria-pressed', 'true')
    await expect(
      page.getByRole('img', { name: /— Detalhe do rosto/ }),
    ).toHaveAttribute('style', /1.35/)
  }
  const zoom = page.getByRole('button', { name: 'Ampliar imagem do NFT' })
  await zoom.click()
  const dialog = page.getByRole('dialog', {
    name: 'Imagem ampliada de Emerald Ape #042',
  })
  await expect(dialog).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(zoom).toBeFocused()
})

test('edições alteram preço e limite; edição esgotada bloqueia compra', async ({
  page,
}) => {
  await page.goto('/nfts/nft-001')
  await page.getByRole('button', { name: 'Edição 1/10', exact: true }).click()
  await page.getByRole('button', { name: 'Aumentar quantidade' }).click()
  await expect(
    page.getByRole('spinbutton', { name: 'Quantidade' }),
  ).toHaveValue('2')
  await expect(
    page.getByRole('button', { name: 'Aumentar quantidade' }),
  ).toBeDisabled()
  await page.getByRole('spinbutton', { name: 'Quantidade' }).fill('99')
  await expect(
    page.getByRole('spinbutton', { name: 'Quantidade' }),
  ).toHaveValue('2')
  await page
    .getByRole('button', { name: 'Edição 1/1, esgotada', exact: true })
    .click()
  await expect(
    page.getByText('Esta edição está esgotada. Escolha outra edição.'),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: /^(COMPRAR|Comprar NFT)$/ }),
  ).toBeDisabled()
  await page.getByRole('button', { name: 'Edição 1/50', exact: true }).click()
  await expect(
    page.getByRole('spinbutton', { name: 'Quantidade' }),
  ).toHaveValue('1')
  await expect(
    page.getByRole('button', { name: /^(COMPRAR|Comprar NFT)$/ }),
  ).toBeEnabled()
})

test('adiciona quantidades ao carrinho com preço preciso, persiste e preserva ao autenticar', async ({
  page,
}) => {
  await page.goto('/nfts/nft-001')
  await page.getByRole('button', { name: 'Aumentar quantidade' }).click()
  await page.getByRole('button', { name: /^(COMPRAR|Comprar NFT)$/ }).click()
  const cart = page.getByRole('dialog', { name: 'Carrinho de NFTs' })
  await expect(cart).toBeVisible()
  await expect(cart.getByText('2.38 ETH', { exact: true })).toHaveCount(2)
  await expect(cart).toContainText('Qtd. 2')
  await cart.getByRole('button', { name: 'Fechar carrinho' }).click()
  await page.goto('/')
  await page.reload()
  await expect(
    page.getByRole('button', { name: 'Abrir carrinho (2 itens)' }),
  ).toBeVisible()
  await login(page)
  await page.getByRole('button', { name: 'Abrir carrinho (2 itens)' }).click()
  await expect(page).toHaveURL(/\/carrinho/)
  await expect(
    page.getByRole('spinbutton', { name: 'Quantidade' }),
  ).toHaveValue('2')
  await expect(page.getByTestId('cart-subtotal')).toHaveText('2.38 ETH')
})

test('favoritos do detalhe ficam sincronizados com o catálogo', async ({
  page,
}) => {
  await page.goto('/nfts/nft-001')
  await page
    .getByRole('button', { name: 'Favoritar Emerald Ape #042', exact: true })
    .click()
  const dialog = page.getByRole('dialog', { name: 'Entrar na Kurio' })
  await dialog.getByLabel('E-mail', { exact: true }).fill('ana@kurio.test')
  await dialog.getByLabel('Senha', { exact: true }).fill('Kurio123!')
  await dialog.getByRole('button', { name: 'Entrar', exact: true }).click()
  const favorite = page.getByRole('button', {
    name: 'Favoritar Emerald Ape #042',
    exact: true,
  })
  await expect(favorite).toBeEnabled()
  await favorite.click()
  await expect(
    page.getByRole('button', {
      name: 'Remover Emerald Ape #042 dos favoritos',
      exact: true,
    }),
  ).toBeEnabled()
  await page.goto('/')
  await expect(
    page.getByTestId('catalog-grid').getByRole('button', {
      name: 'Remover Emerald Ape #042 dos favoritos',
      exact: true,
    }),
  ).toHaveAttribute('aria-pressed', 'true')
})

test('abas exibem avaliações e itens relacionados abrem outro NFT', async ({
  page,
}) => {
  await page.goto('/nfts/nft-001')
  await page
    .getByRole('tab', { name: 'Avaliações de colecionadores (19)' })
    .click()
  const reviews = page.getByRole('tabpanel')
  await expect(reviews.getByRole('listitem')).toHaveCount(4)
  await reviews.getByRole('button', { name: 'Ver mais avaliações' }).click()
  await expect(reviews.getByRole('listitem')).toHaveCount(9)
  await page.getByRole('tab', { name: 'Detalhes do NFT', exact: true }).click()
  await expect(page.getByRole('tabpanel')).toContainText('Nova Sato')
  await page
    .getByRole('region', { name: 'Mais desta coleção' })
    .getByRole('link', { name: 'Ver detalhes de Sage Nomad #009', exact: true })
    .click()
  await expect(
    page.getByRole('heading', { name: 'Sage Nomad #009', level: 1 }),
  ).toBeVisible()
})

test('NFT inexistente e falha transitória têm recuperação', async ({
  page,
}) => {
  await page.goto('/nfts/inexistente')
  await expect(
    page.getByRole('heading', { name: 'NFT não encontrado', exact: true }),
  ).toBeVisible()
  await page.getByRole('link', { name: 'Voltar ao catálogo' }).click()
  await page.evaluate(() =>
    localStorage.setItem('kurio.mock-scenario', 'detail-error'),
  )
  await page.goto('/nfts/nft-001')
  await expect(
    page.getByRole('heading', { name: 'Não foi possível carregar este NFT' }),
  ).toBeVisible()
  await page.evaluate(() => localStorage.removeItem('kurio.mock-scenario'))
  await page
    .getByRole('button', { name: 'Tentar novamente', exact: true })
    .click()
  await expect(
    page.getByRole('heading', { name: 'Emerald Ape #042', level: 1 }),
  ).toBeVisible()
})

test('atualiza preço e disponibilidade sem recarregar a página', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem('kurio.mock-scenario', 'nft-updated')
  })
  await page.goto('/nfts/nft-001')
  await expect(
    page.getByRole('heading', { name: 'Emerald Ape #042', level: 1 }),
  ).toBeVisible()
  const price =
    page.viewportSize()!.width < 1024
      ? page.getByLabel('Total selecionado')
      : page.getByTestId('nft-edition-price')
  await expect(price).toHaveText('1.29 ETH', {
    timeout: 5_000,
  })
  await expect(
    page.getByText('Até 1 unidades por pedido nesta edição.'),
  ).toBeVisible()
})
