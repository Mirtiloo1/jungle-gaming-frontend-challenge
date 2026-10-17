import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

async function openRegister(page: Page) {
  await page
    .getByRole('button', { name: 'Entrar na conta', exact: true })
    .click()
  const desktopTab = page.getByRole('button', { name: 'Ir para cadastro' })
  if (await desktopTab.isVisible()) await desktopTab.click()
  else
    await page
      .getByRole('button', { name: 'Novo na Kurio? Crie uma conta' })
      .click()
  return page.getByRole('dialog', { name: 'Criar conta na Kurio' })
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await expect(
    page.getByTestId('catalog-grid').getByRole('article'),
  ).toHaveCount(9)
})

test('alterna acesso, mostra senha e mantém foco no modal', async ({
  page,
}) => {
  const register = await openRegister(page)
  await expect(
    register.getByLabel('Nome de usuário', { exact: true }),
  ).toBeVisible()
  await register.getByLabel('Senha', { exact: true }).fill('Kurio123!')
  await register
    .getByRole('button', { name: 'Mostrar senha', exact: true })
    .click()
  await expect(register.getByLabel('Senha', { exact: true })).toHaveAttribute(
    'type',
    'text',
  )
  await register
    .getByRole('button', { name: 'Ocultar senha', exact: true })
    .click()
  await expect(register.getByLabel('Senha', { exact: true })).toHaveAttribute(
    'type',
    'password',
  )
  for (let index = 0; index < 14; index++) {
    await page.keyboard.press('Tab')
    expect(
      await register.evaluate((element) =>
        element.contains(document.activeElement),
      ),
    ).toBe(true)
  }
  await page.keyboard.press('Escape')
  await expect(register).toBeHidden()
  await expect(
    page.getByRole('button', { name: 'Entrar na conta', exact: true }),
  ).toBeFocused()
})

test('cadastra, persiste a conta e entra novamente pelo menu de usuário', async ({
  page,
}) => {
  const register = await openRegister(page)
  await register
    .getByLabel('Nome de usuário', { exact: true })
    .fill('colecionador_novo')
  await register.getByLabel('E-mail', { exact: true }).fill('novo@kurio.test')
  await register.getByLabel('Senha', { exact: true }).fill('NovaSenha123!')
  await register
    .getByLabel('Confirmar senha', { exact: true })
    .fill('NovaSenha123!')
  await register.getByRole('button', { name: /^Criar (conta|perfil)$/ }).click()
  await expect(register).toBeHidden()
  await page.reload()
  const account = page.getByRole('button', {
    name: 'Abrir menu da conta de colecionador_novo',
  })
  await expect(account).toBeVisible()
  await account.click()
  const menu = page.getByRole('menu')
  await expect(menu.getByText('novo@kurio.test', { exact: true })).toBeVisible()
  await expect(
    menu.getByRole('menuitem', { name: /Meu perfil/ }),
  ).not.toHaveAttribute('aria-disabled', 'true')
  await menu
    .getByRole('menuitem', { name: 'Sair da conta', exact: true })
    .click()
  await page
    .getByRole('alertdialog', { name: 'Sair da sua conta?' })
    .getByRole('button', { name: 'Sair da conta', exact: true })
    .click()
  await expect(page.getByRole('alertdialog')).toBeHidden()
  await page
    .getByRole('button', { name: 'Entrar na conta', exact: true })
    .click()
  const login = page.getByRole('dialog', { name: 'Entrar na Kurio' })
  await login.getByLabel('E-mail', { exact: true }).fill('novo@kurio.test')
  await login.getByLabel('Senha', { exact: true }).fill('NovaSenha123!')
  await login.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(account).toBeVisible()
})

test('valida confirmação de senha e conflito de cadastro na API', async ({
  page,
}) => {
  const register = await openRegister(page)
  await register
    .getByLabel('Nome de usuário', { exact: true })
    .fill('outro_nome')
  await register.getByLabel('E-mail', { exact: true }).fill('ana@kurio.test')
  await register.getByLabel('Senha', { exact: true }).fill('Kurio123!')
  await register
    .getByLabel('Confirmar senha', { exact: true })
    .fill('Diferente123!')
  await register.getByRole('button', { name: /^Criar (conta|perfil)$/ }).click()
  await expect(register.getByRole('alert')).toContainText(
    'As senhas precisam ser iguais',
  )
  await register
    .getByLabel('Confirmar senha', { exact: true })
    .fill('Kurio123!')
  await register.getByRole('button', { name: /^Criar (conta|perfil)$/ }).click()
  await expect(register.getByLabel('E-mail', { exact: true })).toHaveAttribute(
    'aria-invalid',
    'true',
  )
  await expect(register.locator('#auth-email-error')).toContainText(
    'Este e-mail já está cadastrado',
  )
})

test('ações sociais indicam indisponibilidade sem autenticar', async ({
  page,
}) => {
  await page
    .getByRole('button', { name: 'Entrar na conta', exact: true })
    .click()
  const login = page.getByRole('dialog', { name: 'Entrar na Kurio' })
  await login.getByRole('button', { name: 'Continuar com Google' }).click()
  await expect(login.getByRole('status')).toContainText('não está disponível')
  await login.getByRole('button', { name: 'Esqueceu a senha?' }).click()
  await expect(login.getByRole('status')).toContainText('recuperação de senha')
  await expect(login).toBeVisible()
})

test('busca ocupa a altura do campo e o popover fecha ao sair', async ({
  page,
}) => {
  const desktopTrigger = page.getByRole('button', {
    name: 'Abrir busca',
    exact: true,
  })
  const desktop = await desktopTrigger.isVisible()
  if (desktop) await desktopTrigger.click()
  const input = page.getByRole('searchbox', { name: 'Buscar coleções' })
  await input.focus()
  const inputBox = (await input.boundingBox())!
  const formBox = (await page
    .getByRole('search', { name: 'Busca de NFTs' })
    .boundingBox())!
  expect(inputBox.height).toBeGreaterThanOrEqual(44)
  expect(Math.abs(inputBox.height - formBox.height)).toBeLessThanOrEqual(2)
  if (desktop) {
    await page
      .getByRole('heading', { name: 'Seja dono do futuro da arte digital' })
      .click()
    await expect(input).toBeHidden()
    await desktopTrigger.click()
    await expect(input).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(input).toBeHidden()
    await desktopTrigger.click()
  }
  await input.fill('Golden Signal')
  await input.press('Enter')
  await expect(
    page.getByTestId('catalog-grid').getByRole('article'),
  ).toHaveCount(4)
  if (desktop) await expect(input).toBeHidden()
})
