import { delay, http, HttpResponse } from 'msw'
import {
  allMockUsers,
  authenticatedUser,
  hashMockPassword,
  publicUser,
  readDatabase,
  writeDatabase,
} from './database'
import { checkoutAccount, profileErrors, walletErrors } from './checkout'
import type {
  AccountProfile,
  ProfileInput,
  WalletInput,
} from '@/features/account/types'

const fail = (
  message: string,
  status: number,
  fields: Record<string, string> = {},
) => HttpResponse.json({ message, fields }, { status })
const scenario = () => localStorage.getItem('kurio.mock-scenario')
export const accountHandlers = [
  http.get('*/api/profile', async ({ request }) => {
    await delay(130)
    const user = authenticatedUser(request)
    if (!user) return fail('Entre na conta para ver seu perfil.', 401)
    if (scenario() === 'profile-error')
      return fail('Não foi possível carregar seu perfil.', 503)
    const data = readDatabase(),
      account = checkoutAccount(data, user)
    writeDatabase(data)
    const profile: AccountProfile = {
      ...account.profile,
      avatar: account.avatar ?? null,
      walletNickname:
        account.walletNickname ??
        account.wallets.find(
          (wallet) => wallet.isPrimary || wallet.id === 'primary',
        )?.name ??
        '',
    }
    return HttpResponse.json({ profile, user })
  }),
  http.put('*/api/profile', async ({ request }) => {
    await delay(180)
    const user = authenticatedUser(request)
    if (!user) return fail('Sua sessão expirou. Entre novamente.', 401)
    if (scenario() === 'profile-error')
      return fail(
        'Não foi possível salvar. Suas alterações continuam no formulário.',
        503,
      )
    const body = (await request.json()) as ProfileInput
    const errors = profileErrors(body ?? {})
    if (
      typeof body.walletNickname !== 'string' ||
      body.walletNickname.length < 2 ||
      body.walletNickname.length > 40
    )
      errors.walletNickname = 'Use de 2 a 40 caracteres.'
    if (
      body.avatar !== null &&
      (typeof body.avatar !== 'string' ||
        !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(
          body.avatar,
        ) ||
        body.avatar.length > 500_000)
    )
      errors.avatar =
        'Use uma imagem PNG, JPEG ou WebP de até 350 KB após otimização.'
    const users = allMockUsers()
    if (
      users.some(
        (item) =>
          item.id !== user.id &&
          item.email.toLowerCase() === body.email?.trim().toLowerCase(),
      )
    )
      errors.email = 'Este e-mail já está em uso.'
    if (
      users.some(
        (item) =>
          item.id !== user.id &&
          (item.username ?? item.name).toLowerCase() ===
            body.username?.toLowerCase(),
      )
    )
      errors.username = 'Este nome de usuário já está em uso.'
    const current = users.find((item) => item.id === user.id)!
    let passwordHash = current.passwordHash
    if (body.currentPassword || body.newPassword || body.confirmPassword) {
      if (
        !body.currentPassword ||
        (await hashMockPassword(body.currentPassword)) !== current.passwordHash
      )
        errors.currentPassword = 'A senha atual não confere.'
      if (
        typeof body.newPassword !== 'string' ||
        body.newPassword.length < 8 ||
        !/[a-z]/i.test(body.newPassword) ||
        !/\d/.test(body.newPassword)
      )
        errors.newPassword = 'Use ao menos 8 caracteres, com letras e números.'
      if (body.newPassword !== body.confirmPassword)
        errors.confirmPassword = 'As senhas precisam ser iguais.'
      if (!Object.keys(errors).length)
        passwordHash = await hashMockPassword(body.newPassword)
    }
    if (Object.keys(errors).length)
      return fail(
        'Revise os campos destacados.',
        errors.email?.includes('uso') || errors.username?.includes('uso')
          ? 409
          : 422,
        errors,
      )
    const data = readDatabase(),
      account = checkoutAccount(data, user)
    const profile = {
      displayName: body.displayName.trim(),
      username: body.username.trim(),
      email: body.email.trim().toLowerCase(),
      profileName: body.profileName,
      referral: body.referral,
      ens: body.ens,
      notes: body.notes,
    }
    account.profile = profile
    account.avatar = body.avatar
    account.walletNickname = body.walletNickname.trim()
    const primary = account.wallets.find(
      (wallet) => wallet.isPrimary || wallet.id === 'primary',
    )
    if (primary) primary.name = account.walletNickname
    const updated = {
      ...current,
      name: profile.displayName,
      username: profile.username,
      email: profile.email,
      passwordHash,
      avatar: body.avatar,
    }
    data.users = [...data.users.filter((item) => item.id !== user.id), updated]
    if (passwordHash !== current.passwordHash)
      for (const [token, session] of Object.entries(data.sessions))
        if (
          session.userId === user.id &&
          request.headers.get('Authorization') !== `Bearer ${token}`
        )
          delete data.sessions[token]
    writeDatabase(data)
    return HttpResponse.json({
      profile: {
        ...profile,
        avatar: body.avatar,
        walletNickname: account.walletNickname,
      },
      user: publicUser(updated),
    })
  }),
  http.get('*/api/wallets', async ({ request }) => {
    await delay(120)
    const user = authenticatedUser(request)
    if (!user) return fail('Entre na conta para ver suas carteiras.', 401)
    if (scenario() === 'wallet-error')
      return fail('Não foi possível carregar suas carteiras.', 503)
    const data = readDatabase(),
      account = checkoutAccount(data, user)
    writeDatabase(data)
    return HttpResponse.json({
      wallets: account.wallets,
      secondaryUsesPrimary: account.secondaryUsesPrimary ?? false,
    })
  }),
  http.put('*/api/wallets/preferences', async ({ request }) => {
    const user = authenticatedUser(request)
    if (!user) return fail('Entre novamente.', 401)
    const body = (await request.json()) as { secondaryUsesPrimary: boolean }
    if (typeof body.secondaryUsesPrimary !== 'boolean')
      return fail('Preferência inválida.', 422)
    const data = readDatabase(),
      account = checkoutAccount(data, user)
    account.secondaryUsesPrimary = body.secondaryUsesPrimary
    writeDatabase(data)
    return HttpResponse.json({
      wallets: account.wallets,
      secondaryUsesPrimary: body.secondaryUsesPrimary,
    })
  }),
  http.put('*/api/wallets/:id', async ({ request, params }) => {
    await delay(180)
    const user = authenticatedUser(request)
    if (!user) return fail('Entre novamente.', 401)
    if (scenario() === 'wallet-error')
      return fail('Não foi possível salvar sua carteira. Tente novamente.', 503)
    const body = (await request.json()) as WalletInput
    const fields = walletErrors(body ?? {})
    if (Object.keys(fields).length)
      return fail('Revise os dados e o endereço da carteira.', 422, fields)
    const data = readDatabase(),
      account = checkoutAccount(data, user)
    const wallet = account.wallets.find((item) => item.id === params.id)
    if (!wallet) return fail('Carteira não encontrada.', 404)
    if (
      account.wallets.some(
        (item) =>
          item.id !== wallet.id &&
          item.network === body.network &&
          item.address.toLowerCase() === body.address.toLowerCase(),
      )
    )
      return fail('Esta carteira já está cadastrada nesta rede.', 409, {
        address: 'Endereço já cadastrado.',
      })
    if (
      Object.values(account.orders).some(
        (record) =>
          record.order.status === 'pending' &&
          record.order.wallet.id === wallet.id,
      )
    )
      return fail(
        'Aguarde o pagamento em andamento antes de editar esta carteira.',
        409,
      )
    if (body.isPrimary)
      for (const other of account.wallets) other.isPrimary = false
    Object.assign(wallet, {
      name: body.name.trim(),
      address: body.address,
      ens: body.ens,
      network: body.network,
      kind: body.kind,
      isPrimary: body.isPrimary ?? wallet.isPrimary,
      details: body.details,
      connected: false,
      provider: null,
    })
    if (wallet.isPrimary || wallet.id === 'primary')
      account.walletNickname = wallet.name
    writeDatabase(data)
    return HttpResponse.json({
      wallets: account.wallets,
      secondaryUsesPrimary: account.secondaryUsesPrimary ?? false,
    })
  }),
]
