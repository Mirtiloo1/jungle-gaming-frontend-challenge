import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'

async function login(
  page: Page,
  email = 'ana@kurio.test',
  password = 'Kurio123!',
) {
  await page
    .getByRole('button', { name: 'Entrar na conta', exact: true })
    .first()
    .click()
  const dialog = page.getByRole('dialog', { name: 'Entrar na Kurio' })
  await dialog.getByLabel('E-mail', { exact: true }).fill(email)
  await dialog.getByLabel('Senha', { exact: true }).fill(password)
  await dialog.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(dialog).toBeHidden()
}
async function openProfile(page: Page) {
  await page.goto('/')
  await login(page)
  await page
    .getByRole('button', { name: 'Abrir menu da conta de Ana', exact: true })
    .click()
  await page.getByRole('menuitem', { name: 'Meu perfil', exact: true }).click()
  await expect(page).toHaveURL(/\/perfil$/)
  await expect(
    page.getByLabel('Nome de exibição', { exact: false }),
  ).toHaveValue('Ana')
}

test('perfil acessível pelo ícone salva dados e mantém após refresh', async ({
  page,
}) => {
  await openProfile(page)
  await page.getByLabel('Nome de exibição', { exact: false }).fill('Ana Silva')
  await page.getByLabel('Nome de usuário', { exact: false }).fill('ana_silva')
  await page.getByLabel('Nome ENS (opcional)').fill('ana.kurio')
  await page
    .getByLabel('Apelido da carteira', { exact: false })
    .fill('Minha principal')
  await page.getByRole('button', { name: 'Salvar', exact: true }).click()
  await expect(page.getByRole('status')).toHaveText('Perfil salvo com sucesso.')
  await page.reload()
  await expect(
    page.getByLabel('Nome de exibição', { exact: false }),
  ).toHaveValue('Ana Silva')
  await expect(page.getByLabel('Nome ENS (opcional)')).toHaveValue('ana.kurio')
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false)
})

test('conflito e falha de gravação preservam os campos para correção', async ({
  page,
}) => {
  await openProfile(page)
  await page.getByLabel('E-mail', { exact: false }).fill('bruno@kurio.test')
  await page.getByRole('button', { name: 'Salvar', exact: true }).click()
  await expect(
    page.getByText('Este e-mail já está em uso.', { exact: true }),
  ).toBeVisible()
  await expect(page.getByLabel('E-mail', { exact: false })).toBeFocused()
  await page.getByLabel('E-mail', { exact: false }).fill('ana@kurio.test')
  await page
    .getByLabel('Nome de exibição', { exact: false })
    .fill('Ana Editada')
  await page.evaluate(() =>
    localStorage.setItem('kurio.mock-scenario', 'profile-error'),
  )
  await page.getByRole('button', { name: 'Salvar', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Não foi possível salvar')
  await expect(
    page.getByLabel('Nome de exibição', { exact: false }),
  ).toHaveValue('Ana Editada')
  await page.evaluate(() => localStorage.removeItem('kurio.mock-scenario'))
  await page.getByRole('button', { name: 'Salvar', exact: true }).click()
  await expect(page.getByRole('status')).toHaveText('Perfil salvo com sucesso.')
})

test('altera senha somente com a senha atual correta e autentica com a nova', async ({
  page,
}) => {
  await openProfile(page)
  await page.getByLabel('Senha atual', { exact: true }).fill('errada')
  await page.getByLabel('Nova senha', { exact: true }).fill('NovaSenha123!')
  await page
    .getByLabel('Confirmar nova senha', { exact: true })
    .fill('NovaSenha123!')
  await page.getByRole('button', { name: 'Salvar', exact: true }).click()
  await expect(
    page.getByText('A senha atual não confere.', { exact: true }),
  ).toBeVisible()
  await page.getByLabel('Senha atual', { exact: true }).fill('Kurio123!')
  await page
    .getByRole('button', { name: 'Mostrar nova senha', exact: true })
    .click()
  await expect(page.getByLabel('Nova senha', { exact: true })).toHaveAttribute(
    'type',
    'text',
  )
  await page.getByRole('button', { name: 'Salvar', exact: true }).click()
  await expect(page.getByRole('status')).toHaveText('Perfil salvo com sucesso.')
  await page.getByRole('button', { name: /^(Sair|Sair da conta)$/ }).click()
  await page
    .getByRole('alertdialog', { name: 'Sair da sua conta?' })
    .getByRole('button', { name: 'Sair da conta', exact: true })
    .click()
  await expect(page.getByRole('alertdialog')).toBeHidden()
  await expect(
    page.getByRole('heading', { name: 'Entre para acessar sua conta' }),
  ).toBeVisible()
  await login(page, 'ana@kurio.test', 'NovaSenha123!')
  await expect(
    page.getByLabel('Nome de exibição', { exact: false }),
  ).toHaveValue('Ana')
})

test('avatar pode ser enviado, persistido e removido', async ({ page }) => {
  await openProfile(page)
  const data = await page.evaluate(() => {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 32
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#d28a4c'
    ctx.fillRect(0, 0, 32, 32)
    return canvas.toDataURL('image/png').split(',')[1]
  })
  await page.getByLabel('Arquivo de avatar').setInputFiles({
    name: 'avatar.png',
    mimeType: 'image/png',
    buffer: Buffer.from(data, 'base64'),
  })
  await expect(
    page.getByRole('img', { name: 'Avatar de Ana', exact: true }).first(),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Salvar', exact: true }).click()
  await expect(page.getByRole('status')).toHaveText('Perfil salvo com sucesso.')
  await page.reload()
  await expect(
    page.getByRole('img', { name: 'Avatar de Ana', exact: true }).first(),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Remover', exact: true }).click()
  await page.getByRole('button', { name: 'Salvar', exact: true }).click()
  await expect(page.getByRole('status')).toHaveText('Perfil salvo com sucesso.')
  await page.reload()
  await expect(
    page.getByRole('img', { name: 'Avatar de Ana', exact: true }),
  ).toHaveCount(0)
})

test('edita carteira principal, valida endereço e integra ao pagamento', async ({
  page,
}) => {
  await openProfile(page)
  await page.goto('/perfil/carteiras')
  await expect(
    page.getByLabel('Apelido da carteira', { exact: false }),
  ).toHaveValue('Principal')
  await page
    .getByLabel('Endereço da carteira', { exact: false })
    .fill('invalido')
  await page
    .getByRole('button', { name: 'Salvar carteira', exact: true })
    .click()
  await expect(
    page.getByLabel('Endereço da carteira', { exact: false }),
  ).toHaveAttribute('aria-invalid', 'true')
  await page
    .getByLabel('Endereço da carteira', { exact: false })
    .fill('0x2222222222222222222222222222222222222222')
  await page
    .getByLabel('Apelido da carteira', { exact: false })
    .fill('Meu cofre')
  await page
    .getByRole('button', { name: 'Salvar carteira', exact: true })
    .click()
  await expect(page.getByRole('status')).toHaveText(
    'Carteira salva com sucesso.',
  )
  await page.reload()
  await expect(
    page.getByLabel('Apelido da carteira', { exact: false }),
  ).toHaveValue('Meu cofre')
  await page.goto('/nfts/nft-001')
  await page.getByRole('button', { name: /^(COMPRAR|Comprar NFT)$/ }).click()
  await page.getByRole('link', { name: 'Ver carrinho' }).click()
  await page.getByRole('button', { name: 'Conectar e finalizar' }).click()
  if (page.viewportSize()!.width >= 1024) {
    await page
      .getByRole('button', { name: 'Trocar carteira', exact: true })
      .click()
    await expect(
      page
        .getByRole('dialog', { name: 'Trocar carteira' })
        .getByRole('button', { name: /Meu cofre/ }),
    ).toBeVisible()
  } else
    await expect(page.getByRole('radio', { name: /Meu cofre/ })).toBeVisible()
})

test('cadastra carteira secundária e mantém a preferência após refresh', async ({
  page,
}) => {
  await openProfile(page)
  await page.goto('/perfil/carteiras')
  await page.getByRole('button', { name: 'Adicionar', exact: true }).click()
  const add = page.getByRole('dialog', {
    name: 'Adicionar carteira',
    exact: true,
  })
  await add.getByLabel('Nome da carteira', { exact: true }).fill('  Viagens  ')
  await add.getByLabel('Endereço da nova carteira').fill('0x1234')
  await add.getByLabel('ENS (opcional)').fill('apelido')
  await add
    .getByRole('button', { name: 'Salvar carteira', exact: true })
    .click()
  await expect(add.getByLabel('Endereço da nova carteira')).toHaveAttribute(
    'aria-invalid',
    'true',
  )
  await expect(add.getByLabel('Endereço da nova carteira')).toBeFocused()
  await expect(add.getByLabel('ENS (opcional)')).toHaveAttribute(
    'aria-invalid',
    'true',
  )
  await expect(
    add.getByRole('alert').filter({ hasText: '0x seguido de 40' }),
  ).toBeVisible()
  await add.getByLabel('ENS (opcional)').fill('')
  await add
    .getByLabel('Endereço da nova carteira')
    .fill('  0x3333333333333333333333333333333333333333  ')
  await add
    .getByRole('button', { name: 'Salvar carteira', exact: true })
    .click()
  await expect(page.getByRole('button', { name: /Viagens/ })).toBeVisible()
  await page.getByLabel('Igual à carteira principal').check()
  await expect(page.getByLabel('Igual à carteira principal')).toBeChecked()
  await expect(page.getByLabel('Igual à carteira principal')).toBeEnabled()
  await page.reload()
  await expect(page.getByRole('button', { name: /Viagens/ })).toBeVisible()
  await expect(page.getByLabel('Igual à carteira principal')).toBeChecked()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false)
})

test('logout e troca de conta não expõem dados de outro usuário', async ({
  page,
}) => {
  await openProfile(page)
  await page
    .getByLabel('Nome de exibição', { exact: false })
    .fill('Ana Particular')
  await page.getByRole('button', { name: 'Salvar', exact: true }).click()
  await expect(page.getByRole('status')).toHaveText('Perfil salvo com sucesso.')
  await page.getByRole('button', { name: /^(Sair|Sair da conta)$/ }).click()
  await page
    .getByRole('alertdialog', { name: 'Sair da sua conta?' })
    .getByRole('button', { name: 'Sair da conta', exact: true })
    .click()
  await expect(page.getByRole('alertdialog')).toBeHidden()
  await expect(
    page.getByRole('heading', { name: 'Entre para acessar sua conta' }),
  ).toBeVisible()
  await login(page, 'bruno@kurio.test')
  await expect(
    page.getByLabel('Nome de exibição', { exact: false }),
  ).toHaveValue('Bruno')
  await expect(page.getByLabel('E-mail', { exact: false })).toHaveValue(
    'bruno@kurio.test',
  )
})

test('sair pede confirmação e cancelar mantém a sessão', async ({ page }) => {
  await openProfile(page)
  await page.getByRole('button', { name: /^(Sair|Sair da conta)$/ }).click()
  const confirmation = page.getByRole('alertdialog', {
    name: 'Sair da sua conta?',
  })
  await expect(confirmation).toBeVisible()
  await confirmation.getByRole('button', { name: 'Continuar na conta' }).click()
  await expect(confirmation).toBeHidden()
  await page.reload()
  await expect(
    page.getByLabel('Nome de exibição', { exact: false }),
  ).toHaveValue('Ana')
})

test('lista de interesse mostra e remove favoritos dentro da conta', async ({
  page,
}) => {
  await openProfile(page)
  await page.goto('/nfts/nft-001')
  await page
    .getByRole('button', { name: 'Favoritar Emerald Ape #042', exact: true })
    .click()
  await expect(
    page.getByRole('button', {
      name: 'Remover Emerald Ape #042 dos favoritos',
      exact: true,
    }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', {
      name: 'Remover Emerald Ape #042 dos favoritos',
      exact: true,
    }),
  ).toBeEnabled()
  await page.goto('/perfil')
  const nav = page.getByRole('navigation', {
    name:
      page.viewportSize()!.width >= 1024
        ? 'Menu do perfil'
        : 'Menu do perfil mobile',
    exact: true,
  })
  await nav.getByRole('link', { name: /Lista de interesse|Favoritos/ }).click()
  await expect(page).toHaveURL(/\/perfil\/favoritos$/)
  const favorites = page.getByRole('region', { name: 'Sua lista de interesse' })
  await expect(favorites.getByRole('article')).toHaveCount(1)
  await page.reload()
  await expect(favorites.getByRole('article')).toHaveCount(1)
  await favorites
    .getByRole('button', { name: 'Remover Emerald Ape #042 dos favoritos' })
    .click()
  await expect(
    favorites.getByRole('heading', { name: 'Sua lista ainda está vazia' }),
  ).toBeVisible()
  await page.reload()
  await expect(
    favorites.getByRole('heading', { name: 'Sua lista ainda está vazia' }),
  ).toBeVisible()
})

test('atividade exibe uma compra realizada e permite abrir o recibo após refresh', async ({
  page,
}) => {
  await openProfile(page)
  await page.goto('/perfil/atividade')
  await expect(
    page.getByRole('heading', { name: 'Você ainda não fez nenhuma compra' }),
  ).toBeVisible()
  await page.goto('/nfts/nft-001')
  await page.getByRole('button', { name: /^(COMPRAR|Comprar NFT)$/ }).click()
  await page.getByRole('link', { name: 'Ver carrinho' }).click()
  await page.getByRole('button', { name: 'Conectar e finalizar' }).click()
  await page
    .getByRole('button', { name: 'Conectar carteira', exact: true })
    .click()
  await page
    .getByRole('button', { name: 'Confirmar compra', exact: true })
    .click()
  await page
    .getByRole('dialog', { name: 'Revisar pagamento' })
    .getByRole('button', { name: 'Confirmar pagamento' })
    .click()
  await expect(
    page.getByRole('dialog', { name: 'Pedido confirmado' }),
  ).toBeVisible({ timeout: 10000 })
  await page.goto('/perfil/atividade')
  const activity = page.getByRole('region', { name: 'Histórico de compras' })
  await expect(activity.getByRole('article')).toHaveCount(1)
  await expect(activity).toContainText('Compra confirmada')
  await expect(activity).toContainText('Emerald Ape #042')
  await page.reload()
  const openReceipt = activity.getByRole('button', { name: 'Ver recibo' })
  const receipt = page.getByRole('dialog', { name: 'Pedido confirmado' })
  await openReceipt.click()
  await expect(receipt).toBeVisible()
  await expect(receipt).toContainText('Emerald Ape #042')
  await receipt.getByRole('button', { name: 'Fechar confirmação' }).click()
  await expect(receipt).toBeHidden()
  await expect(page).toHaveURL(/\/perfil\/atividade$/)
  await expect(
    page.getByRole('heading', { name: 'Sua atividade' }),
  ).toBeVisible()
  await expect(openReceipt).toBeFocused()
  await openReceipt.click()
  await expect(receipt).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(receipt).toBeHidden()
  await expect(page).toHaveURL(/\/perfil\/atividade$/)
  await page.getByRole('button', { name: /^(Sair|Sair da conta)$/ }).click()
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: 'Sair da conta', exact: true })
    .click()
  await expect(
    page.getByRole('heading', { name: 'Entre para acessar sua conta' }),
  ).toBeVisible()
  await login(page, 'bruno@kurio.test')
  await expect(
    page.getByRole('heading', { name: 'Você ainda não fez nenhuma compra' }),
  ).toBeVisible()
})
