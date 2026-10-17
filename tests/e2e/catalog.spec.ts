import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

const catalog = (page: Page) =>
  page.getByRole('region', { name: 'Catálogo de NFTs', exact: true })
const cards = (page: Page) => catalog(page).getByRole('article')

async function login(page: Page, email = 'ana@kurio.test') {
  await page
    .getByRole('button', { name: 'Entrar na conta', exact: true })
    .click()
  const dialog = page.getByRole('dialog', { name: 'Entrar na Kurio' })
  await dialog.getByLabel('E-mail', { exact: true }).fill(email)
  await dialog.getByLabel('Senha', { exact: true }).fill('Kurio123!')
  await dialog.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(dialog).toBeHidden()
}

async function openFilters(page: Page) {
  const trigger = page.getByRole('button', { name: 'Abrir filtros' })
  if (await trigger.isVisible()) {
    await trigger.click()
    return page.getByRole('dialog', { name: 'Filtros', exact: true })
  }
  return page.getByRole('complementary', { name: 'Filtros do catálogo' })
}

async function logout(page: Page) {
  await page
    .getByRole('button', { name: 'Abrir menu da conta de Ana', exact: true })
    .click()
  await page
    .getByRole('menuitem', { name: 'Sair da conta', exact: true })
    .click()
  await page
    .getByRole('alertdialog', { name: 'Sair da sua conta?' })
    .getByRole('button', { name: 'Sair da conta', exact: true })
    .click()
  await expect(page.getByRole('alertdialog')).toBeHidden()
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await expect(cards(page)).toHaveCount(9)
})

test('combina coleção e rede, reinicia página e restaura pelo histórico e refresh', async ({
  page,
}) => {
  const pagination = page.getByRole('navigation', {
    name: 'Paginação do catálogo',
  })
  await pagination.getByRole('link', { name: 'Página 2', exact: true }).click()
  await expect(page).toHaveURL(/page=2/)
  const filters = await openFilters(page)
  await filters.getByText('Fotografia', { exact: true }).click()
  await filters.getByText('Ethereum', { exact: true }).click()
  await filters.getByRole('button', { name: 'Aplicar', exact: true }).click()
  await expect(page).toHaveURL(/collection=photography/)
  await expect(cards(page)).toHaveCount(1)
  await expect(cards(page).first()).toContainText('Emerald Ape #618')
  await expect(page).toHaveURL(/page=1/)
  await page.reload()
  await expect(cards(page)).toHaveCount(1)
  await page.goBack()
  await expect(page).toHaveURL(/page=2/)
  await expect(cards(page)).toHaveCount(9)
})

test('aplica preço pelo slider e permite recuperar resultado vazio', async ({
  page,
}) => {
  const filters = await openFilters(page)
  const min = filters.getByRole('slider', { name: 'Preço mínimo em ETH' })
  const max = filters.getByRole('slider', { name: 'Preço máximo em ETH' })
  await max.scrollIntoViewIfNeeded()
  const start = (await max.boundingBox())!
  const end = (await min.boundingBox())!
  await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2)
  await page.mouse.down()
  await page.mouse.move(end.x - end.width, end.y + end.height / 2, {
    steps: 15,
  })
  await page.mouse.up()
  await expect
    .poll(async () => Number(await max.getAttribute('aria-valuenow')))
    .toBeLessThan(10)
  await filters.getByRole('button', { name: 'Aplicar', exact: true }).click()
  await expect(catalog(page).getByText('Nenhum NFT encontrado')).toBeVisible()
  await catalog(page)
    .getByRole('button', { name: 'Ver todo o catálogo' })
    .click()
  await expect(cards(page)).toHaveCount(9)
})

test('busca, ordena e troca as abas usando parâmetros da URL', async ({
  page,
}) => {
  const desktopSearch = page.getByRole('button', {
    name: 'Abrir busca',
    exact: true,
  })
  if (await desktopSearch.isVisible()) await desktopSearch.click()
  const input = page.getByRole('searchbox', { name: 'Buscar coleções' })
  await input.fill('Golden Signal')
  await input.press('Enter')
  await expect(cards(page)).toHaveCount(4)
  await catalog(page).getByLabel('Ordenar por:').selectOption('price-desc')
  await expect(cards(page).first()).toContainText('Golden Signal #635')
  await expect(page).toHaveURL(/sort=price-desc/)
  await catalog(page)
    .getByRole('button', { name: 'Novos lançamentos', exact: true })
    .click()
  await expect(cards(page)).toHaveCount(1)
  await expect(cards(page).first()).toContainText('Golden Signal #160')
})

test('favoritos exigem login, persistem por NFT e podem ser removidos da lista', async ({
  page,
}) => {
  await cards(page).first().getByRole('button').click()
  const dialog = page.getByRole('dialog', { name: 'Entrar na Kurio' })
  await expect(dialog).toBeVisible()
  await dialog.getByLabel('E-mail', { exact: true }).fill('ana@kurio.test')
  await dialog.getByLabel('Senha', { exact: true }).fill('Kurio123!')
  await dialog.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(dialog).toBeHidden()
  const first = cards(page).first().getByRole('button')
  await expect(first).toBeEnabled()
  await first.click()
  await expect(first).toHaveAttribute('aria-pressed', 'true')
  await expect(cards(page).nth(1).getByRole('button')).toHaveAttribute(
    'aria-pressed',
    'false',
  )
  await expect(first).toBeEnabled()
  await page.reload()
  await expect(cards(page).first().getByRole('button')).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await catalog(page)
    .getByRole('button', { name: 'Meus favoritos', exact: true })
    .click()
  await expect(cards(page)).toHaveCount(1)
  await cards(page).first().getByRole('button').click()
  await expect(catalog(page).getByText('Nenhum NFT encontrado')).toBeVisible()
})

test('faz rollback de favorito e permite repetir após falha', async ({
  page,
}) => {
  await login(page)
  const button = cards(page).first().getByRole('button')
  await expect(button).toBeEnabled()
  await page.evaluate(() =>
    localStorage.setItem('kurio.mock-scenario', 'favorite-error'),
  )
  await button.click()
  await expect(button).toHaveAttribute('aria-pressed', 'true')
  await expect(catalog(page).getByRole('alert')).toContainText(
    'Não foi possível atualizar seu favorito',
  )
  await expect(button).toHaveAttribute('aria-pressed', 'false')
  await page.evaluate(() => localStorage.removeItem('kurio.mock-scenario'))
  await button.click()
  await expect(button).toHaveAttribute('aria-pressed', 'true')
  await expect(button).toBeEnabled()
})

test('logout e troca de conta não compartilham favoritos', async ({ page }) => {
  await login(page)
  const first = cards(page).first().getByRole('button')
  await expect(first).toBeEnabled()
  await first.click()
  await expect(first).toHaveAttribute('aria-pressed', 'true')
  await expect(first).toBeEnabled()
  await logout(page)
  await expect(first).toHaveAttribute('aria-pressed', 'false')
  await login(page, 'bruno@kurio.test')
  await catalog(page)
    .getByRole('button', { name: 'Meus favoritos', exact: true })
    .click()
  await expect(catalog(page).getByText('Nenhum NFT encontrado')).toBeVisible()
})

test('recupera o catálogo após falha da API', async ({ page }) => {
  await page.evaluate(() =>
    localStorage.setItem('kurio.mock-scenario', 'catalog-error'),
  )
  await page.reload()
  await expect(catalog(page).getByRole('alert')).toContainText(
    'Não foi possível carregar o catálogo',
  )
  await page.evaluate(() => localStorage.removeItem('kurio.mock-scenario'))
  await catalog(page)
    .getByRole('button', { name: 'Tentar novamente', exact: true })
    .click()
  await expect(cards(page)).toHaveCount(9)
})

test('expiração revoga os favoritos privados e permite entrar novamente', async ({
  page,
}) => {
  await login(page)
  const first = cards(page).first().getByRole('button')
  await expect(first).toBeEnabled()
  await page.evaluate(() => {
    const key = 'kurio.mock-database.v1'
    const database = JSON.parse(localStorage.getItem(key)!)
    for (const session of Object.values(database.sessions) as {
      expiresAt: number
    }[])
      session.expiresAt = 0
    localStorage.setItem(key, JSON.stringify(database))
  })
  await first.click()
  await expect(catalog(page).getByRole('alert')).toContainText(
    'Sessão expirada',
  )
  await expect(
    page.getByRole('button', { name: 'Entrar na conta', exact: true }),
  ).toBeEnabled()
  await expect(first).toHaveAttribute('aria-pressed', 'false')
  await login(page)
  await expect(first).toBeEnabled()
  await first.click()
  await expect(first).toHaveAttribute('aria-pressed', 'true')
})

test('logout em outra aba remove o acesso aos favoritos', async ({
  page,
  context,
}) => {
  await login(page)
  const second = await context.newPage()
  await second.goto('/')
  await expect(
    second.getByRole('button', {
      name: 'Abrir menu da conta de Ana',
      exact: true,
    }),
  ).toBeVisible()
  await logout(page)
  await expect(
    second.getByRole('button', { name: 'Entrar na conta', exact: true }),
  ).toBeEnabled()
  await expect(
    second.getByRole('button', {
      name: 'Abrir menu da conta de Ana',
      exact: true,
    }),
  ).toHaveCount(0)
  await second.close()
})
