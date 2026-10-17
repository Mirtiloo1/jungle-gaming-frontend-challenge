import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'

async function enter(page: Page, email = 'ana@kurio.test') {
  await page.getByRole('button', { name: 'Entrar para continuar' }).click()
  const login = page.getByRole('dialog', { name: 'Entrar na Kurio' })
  await login.getByLabel('E-mail', { exact: true }).fill(email)
  await login.getByLabel('Senha', { exact: true }).fill('Kurio123!')
  await login.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(login).toBeHidden()
}
async function setup(page: Page, connect = true) {
  await page.goto('/nfts/nft-001')
  await page.getByRole('button', { name: /^(COMPRAR|Comprar NFT)$/ }).click()
  await page.getByRole('link', { name: 'Ver carrinho' }).click()
  await page.getByRole('button', { name: 'Conectar e finalizar' }).click()
  await enter(page)
  await expect(
    page.getByRole('button', { name: 'Conectar carteira', exact: true }),
  ).toBeVisible()
  if (connect) {
    await page
      .getByRole('button', { name: 'Conectar carteira', exact: true })
      .click()
    await expect(
      page.getByRole('button', { name: 'Confirmar compra', exact: true }),
    ).toBeVisible()
  }
}
async function scenario(page: Page, value: string) {
  await page.getByText('Modo demonstração', { exact: true }).click()
  await page.getByLabel('Cenário de demonstração').selectOption(value)
}
async function review(page: Page) {
  await page
    .getByRole('button', { name: 'Confirmar compra', exact: true })
    .click()
  const dialog = page.getByRole('dialog', { name: 'Revisar pagamento' })
  await expect(dialog).toBeVisible()
  return dialog
}
async function orderCount(page: Page) {
  return page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem('kurio.mock-database.v1')!)
    return Object.keys(data.checkout.ana.orders).length
  })
}

test('compra completa exige login, revisa e apresenta recibo imutável', async ({
  page,
}) => {
  await setup(page)
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false)
  const dialog = await review(page)
  await expect(dialog.getByTestId('checkout-total')).toHaveText('1.206 ETH')
  await dialog.getByRole('button', { name: 'Confirmar pagamento' }).click()
  const receipt = page.getByRole('dialog', { name: 'Pedido confirmado' })
  await expect(receipt).toBeVisible({ timeout: 10000 })
  await expect(receipt).toContainText('Emerald Ape #042')
  await expect(receipt).toContainText('1.206 ETH')
  await page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem('kurio.mock-database.v1')!)
    data.checkout.ana.fee = '0.04'
    localStorage.setItem('kurio.mock-database.v1', JSON.stringify(data))
  })
  await page.reload()
  await expect(receipt).toBeVisible()
  await expect(receipt).toContainText('1.206 ETH')
  await receipt.getByRole('button', { name: 'Ver transação simulada' }).click()
  await expect(receipt.getByText('Explorador de demonstração')).toBeVisible()
  await receipt.getByRole('button', { name: 'Fechar confirmação' }).click()
  await page.goto('/carrinho')
  await expect(
    page.getByRole('heading', { name: 'Seu carrinho está vazio' }),
  ).toBeVisible()
})

test('pagamento recusado preserva carrinho e permite nova tentativa aprovada', async ({
  page,
}) => {
  await setup(page)
  await scenario(page, 'payment-declined')
  await (
    await review(page)
  )
    .getByRole('button', { name: 'Confirmar pagamento' })
    .click()
  await expect(
    page.getByRole('heading', { name: 'Pagamento recusado', exact: true }),
  ).toBeVisible({ timeout: 10000 })
  await expect(
    page.getByRole('dialog', { name: 'Pedido confirmado' }),
  ).toHaveCount(0)
  await page
    .getByRole('button', { name: 'Tentar novamente', exact: true })
    .click()
  await scenario(page, 'default')
  await (
    await review(page)
  )
    .getByRole('button', { name: 'Confirmar pagamento' })
    .click()
  await expect(
    page.getByRole('dialog', { name: 'Pedido confirmado' }),
  ).toBeVisible({ timeout: 10000 })
  expect(await orderCount(page)).toBe(2)
})

test('clique repetido envia um único pedido', async ({ page }) => {
  await setup(page)
  const dialog = await review(page)
  await dialog
    .getByRole('button', { name: 'Confirmar pagamento' })
    .evaluate((el: HTMLButtonElement) => {
      el.click()
      el.click()
    })
  await expect(
    page.getByRole('dialog', { name: 'Pedido confirmado' }),
  ).toBeVisible({ timeout: 10000 })
  expect(await orderCount(page)).toBe(1)
})

test('timeout após criação recupera o mesmo pedido sem reenviar', async ({
  page,
}) => {
  await setup(page)
  await scenario(page, 'order-timeout')
  let submissions = 0
  page.on('request', (request) => {
    if (request.method() === 'POST' && request.url().endsWith('/api/orders'))
      submissions++
  })
  await (
    await review(page)
  )
    .getByRole('button', { name: 'Confirmar pagamento' })
    .click()
  await expect(
    page.getByRole('dialog', { name: 'Pedido confirmado' }),
  ).toBeVisible({ timeout: 12000 })
  expect(await orderCount(page)).toBe(1)
  expect(submissions).toBe(1)
})

test('pedido pendente retoma após refresh com assinatura Socket.IO', async ({
  page,
}) => {
  await setup(page)
  await scenario(page, 'order-pending')
  await (
    await review(page)
  )
    .getByRole('button', { name: 'Confirmar pagamento' })
    .click()
  await expect(
    page.getByRole('heading', { name: 'Pagamento em processamento' }),
  ).toBeVisible()
  const url = page.url()
  await page.reload()
  await expect(page).toHaveURL(url)
  await expect(
    page.getByRole('dialog', { name: 'Pedido confirmado' }),
  ).toBeVisible({ timeout: 12000 })
  expect(await orderCount(page)).toBe(1)
  await expect(page.getByTestId('order-status')).toHaveAttribute(
    'data-socket-version',
    '2',
  )
})

test('cotação alterada exige nova revisão e só depois cria o pedido', async ({
  page,
}) => {
  await setup(page)
  await scenario(page, 'quote-changed')
  await (
    await review(page)
  )
    .getByRole('button', { name: 'Confirmar pagamento' })
    .click()
  await expect(page.getByRole('alert')).toContainText(
    'Os valores foram atualizados',
  )
  expect(await orderCount(page)).toBe(0)
  const second = await review(page)
  await expect(second.getByTestId('checkout-total')).toHaveText('1.21 ETH')
  await second.getByRole('button', { name: 'Confirmar pagamento' }).click()
  await expect(
    page.getByRole('dialog', { name: 'Pedido confirmado' }),
  ).toBeVisible({ timeout: 10000 })
})

test('recusa e desconexão de carteira permitem recuperação', async ({
  page,
}) => {
  await setup(page, false)
  await scenario(page, 'wallet-rejected')
  await page
    .getByRole('button', { name: 'Conectar carteira', exact: true })
    .click()
  await expect(page.getByRole('alert')).toContainText('Conexão recusada')
  await page.getByLabel('Cenário de demonstração').selectOption('default')
  await page.getByRole('radio', { name: 'MetaMask', exact: true }).check()
  await page
    .getByRole('button', { name: 'Conectar carteira', exact: true })
    .click()
  await expect(
    page.getByRole('button', { name: 'Confirmar compra' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Desconectar carteira' }).click()
  await expect(
    page.getByRole('button', { name: 'Conectar carteira', exact: true }),
  ).toBeVisible()
  expect(await orderCount(page)).toBe(0)
})

test('valida dados com erro associado e permite cadastrar outra carteira', async ({
  page,
}) => {
  await setup(page)
  if (page.viewportSize()!.width < 1024)
    await page.getByRole('button', { name: 'Dados do colecionador' }).click()
  await page.getByLabel('Nome de exibição', { exact: false }).fill('')
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  const input = page.getByLabel('Nome de exibição', { exact: false })
  await expect(input).toHaveAttribute('aria-invalid', 'true')
  await expect(input).toBeFocused()
  await input.fill('Ana Colecionadora')
  await page
    .getByRole('button', { name: 'Trocar carteira', exact: true })
    .click()
  const dialog = page.getByRole('dialog', { name: 'Trocar carteira' })
  await dialog
    .getByLabel('Nome da carteira', { exact: true })
    .fill('Nova carteira')
  await dialog
    .getByLabel('Endereço da nova carteira', { exact: true })
    .fill('invalido')
  await dialog.getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(dialog.getByRole('alert')).toContainText('0x seguido de 40')
  await expect(
    dialog.getByLabel('Endereço da nova carteira', { exact: true }),
  ).toHaveAttribute('aria-invalid', 'true')
  await dialog
    .getByLabel('Endereço da nova carteira', { exact: true })
    .fill('0x1111111111111111111111111111111111111111')
  await dialog.getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(dialog).toBeHidden()
  if (page.viewportSize()!.width >= 1024) {
    await expect(
      page
        .getByLabel('Carteira cadastrada', { exact: true })
        .locator('option:checked'),
    ).toHaveText(/Nova carteira/)
  } else
    await expect(
      page.getByRole('radio', { name: /Nova carteira/ }),
    ).toHaveAttribute('aria-checked', 'true')
})
