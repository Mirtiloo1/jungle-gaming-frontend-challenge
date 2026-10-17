import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { fieldClass } from '@/features/checkout/ProfileFields'
import type { Network, Provider, Wallet } from '@/features/checkout/types'
import { networkLabels, providerLabels } from '@/features/checkout/types'
import { http } from '@/lib/http'
import { apiErrorMessage } from '@/lib/api-error'
import { readSessionToken } from '@/lib/session-token'
import type { AccountProfile, WalletInput, WalletList } from './types'

export default function WalletForm({
  wallet,
  profile,
  userId,
  onSaved,
  primary,
}: {
  wallet?: Wallet
  profile: AccountProfile
  userId: string
  onSaved: (id: string) => void
  primary: boolean
}) {
  const [draft, setDraft] = useState<WalletInput>({
    name: wallet?.name ?? '',
    address: wallet?.address ?? '',
    ens: wallet?.ens ?? '',
    network: wallet?.network ?? 'ethereum',
    kind: wallet?.kind ?? wallet?.provider ?? 'coinbase',
    isPrimary: wallet?.isPrimary ?? primary,
    details: wallet?.details ?? {
      displayName: profile.displayName,
      profileName: profile.profileName,
      email: profile.email,
      referral: profile.referral,
      secondaryAddress: '',
    },
  })
  const [fields, setFields] = useState<Record<string, string>>({})
  const [message, setMessage] = useState('')
  const client = useQueryClient()
  const token = readSessionToken()
  const mutation = useMutation({
    mutationFn: async () => {
      if (wallet) {
        await http.put<WalletList>(
          `/wallets/${encodeURIComponent(wallet.id)}`,
          draft,
        )
        return wallet.id
      }
      return (await http.post<Wallet>('/wallets', draft)).data.id
    },
    onSuccess: (id) => {
      if (readSessionToken() !== token) return
      setFields({})
      setMessage('Carteira salva com sucesso.')
      void client.invalidateQueries({ queryKey: ['checkout', userId] })
      onSaved(id)
    },
    onError: (error) => {
      setMessage('')
      const next = isAxiosError(error)
        ? (error.response?.data.fields ?? {})
        : {}
      setFields(next)
      requestAnimationFrame(() =>
        document.getElementById('wallet-address')?.focus(),
      )
    },
    retry: false,
  })
  const text = (
    key: 'name' | 'address',
    label: string,
    placeholder?: string,
  ) => (
    <label htmlFor={`wallet-${key}`} className="text-sm">
      {label}
      <span className="text-highlight"> *</span>
      <input
        id={`wallet-${key}`}
        required
        value={draft[key]}
        placeholder={placeholder}
        maxLength={key === 'name' ? 40 : 50}
        onChange={(event) => {
          setDraft({ ...draft, [key]: event.target.value })
          setMessage('')
        }}
        className={`${fieldClass} mt-3`}
        aria-invalid={!!fields[key]}
        aria-describedby={fields[key] ? `wallet-${key}-error` : undefined}
      />
      {fields[key] && (
        <span
          id={`wallet-${key}-error`}
          className="mt-1 block text-xs text-highlight"
        >
          {fields[key]}
        </span>
      )}
    </label>
  )
  const detail = (
    key:
      'displayName' | 'profileName' | 'email' | 'referral' | 'secondaryAddress',
    label: string,
    required = false,
    placeholder?: string,
  ) => (
    <label htmlFor={`wallet-${key}`} className="text-sm">
      {label}
      {required && <span className="text-highlight"> *</span>}
      <input
        id={`wallet-${key}`}
        required={required}
        type={key === 'email' ? 'email' : 'text'}
        maxLength={key === 'email' ? 254 : 100}
        value={draft.details![key]}
        onChange={(event) => {
          setDraft({
            ...draft,
            details: { ...draft.details!, [key]: event.target.value },
          })
          setMessage('')
        }}
        placeholder={placeholder}
        className={`${fieldClass} mt-3`}
      />
    </label>
  )
  return (
    <form
      id="wallet-form"
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        mutation.mutate()
      }}
    >
      <fieldset
        disabled={mutation.isPending}
        className="min-w-0 rounded-2xl bg-card/50 p-4 lg:bg-transparent lg:p-0"
      >
        <h2 className="text-lg font-bold">
          {wallet
            ? primary
              ? 'Carteira principal'
              : 'Carteira secundária'
            : 'Adicionar carteira'}
        </h2>
        <p className="mt-2 mb-7 text-xs leading-relaxed text-muted-foreground">
          Estas carteiras ficam disponíveis no pagamento e para receber NFTs
          comprados.
        </p>
        <div className="grid gap-x-7 gap-y-6 md:grid-cols-2">
          {detail('displayName', 'Nome de exibição', true)}
          {text('name', 'Apelido da carteira')}
          <label htmlFor="wallet-network" className="text-sm">
            Rede <span className="text-highlight">*</span>
            <select
              id="wallet-network"
              value={draft.network}
              onChange={(event) => {
                setDraft({ ...draft, network: event.target.value as Network })
                setMessage('')
              }}
              className={`${fieldClass} mt-3 bg-background`}
            >
              {Object.entries(networkLabels).map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          {detail('profileName', 'Nome do perfil', true)}
          {text(
            'address',
            'Endereço da carteira',
            draft.network === 'solana'
              ? 'Endereço Solana'
              : 'Endereço 0x da carteira',
          )}
          {detail(
            'secondaryAddress',
            'ENS ou carteira secundária (opcional)',
            false,
            'Endereço ou seunome.eth',
          )}
          <label htmlFor="wallet-kind" className="text-sm">
            Tipo de carteira <span className="text-highlight">*</span>
            <select
              id="wallet-kind"
              value={draft.kind}
              onChange={(event) => {
                setDraft({ ...draft, kind: event.target.value as Provider })
                setMessage('')
              }}
              className={`${fieldClass} mt-3 bg-background`}
            >
              {Object.entries(providerLabels).map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          {detail('referral', 'Código de indicação (opcional)')}
          {detail('email', 'E-mail', true)}
          <label htmlFor="wallet-ens" className="text-sm">
            Nome ENS (opcional)
            <div className="mt-3 flex gap-2">
              <span className="flex h-11 items-center rounded-sm border border-border px-3 text-muted-foreground">
                .eth
              </span>
              <input
                id="wallet-ens"
                maxLength={96}
                placeholder="seunome"
                value={draft.ens.replace(/\.eth$/i, '')}
                onChange={(event) => {
                  setDraft({
                    ...draft,
                    ens: event.target.value
                      ? `${event.target.value.replace(/\.eth$/i, '')}.eth`
                      : '',
                  })
                  setMessage('')
                }}
                className={fieldClass}
              />
            </div>
          </label>
        </div>
      </fieldset>
      {mutation.isError && (
        <p role="alert" className="mt-4 text-sm text-highlight">
          {apiErrorMessage(mutation.error)}
        </p>
      )}
      <p role="status" className="mt-4 text-sm text-primary">
        {message}
      </p>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 px-6 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur lg:static lg:mt-5 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
        <button
          type="submit"
          disabled={mutation.isPending}
          className="min-h-12 w-full rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground disabled:opacity-50 lg:min-h-10 lg:w-auto lg:rounded-sm"
        >
          {mutation.isPending ? 'Salvando…' : 'Salvar carteira'}
        </button>
      </div>
    </form>
  )
}
