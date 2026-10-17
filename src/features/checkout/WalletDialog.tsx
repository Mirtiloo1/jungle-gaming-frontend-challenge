import { useId, useRef, useState } from 'react'
import { isAxiosError } from 'axios'
import { Dialog } from 'radix-ui'
import { useMutation } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { http } from '@/lib/http'
import { apiErrorMessage } from '@/lib/api-error'
import { fieldClass } from './ProfileFields'
import type { WalletDraft } from './ProfileFields'
import type { Network, Wallet } from './types'
import { networkLabels } from './types'

export default function WalletDialog({
  open,
  onOpenChange,
  wallets,
  onSelect,
  onAdded,
  mode = 'select',
}: {
  open: boolean
  onOpenChange: (value: boolean) => void
  wallets: Wallet[]
  onSelect: (id: string) => void
  onAdded: (wallet: Wallet) => void
  mode?: 'select' | 'add'
}) {
  const errorId = useId()
  const form = useRef<HTMLFormElement>(null)
  const [fields, setFields] = useState<Record<string, string>>({})
  const [draft, setDraft] = useState<WalletDraft>({
    name: '',
    address: '',
    ens: '',
    network: 'ethereum',
  })
  const mutation = useMutation({
    mutationFn: async () =>
      (
        await http.post<Wallet>('/wallets', {
          ...draft,
          name: draft.name.trim(),
          address: draft.address.trim(),
          ens: draft.ens.trim(),
        })
      ).data,
    onSuccess: (wallet) => {
      onAdded(wallet)
      onOpenChange(false)
      setDraft({ name: '', address: '', ens: '', network: 'ethereum' })
      setFields({})
    },
    onError: (error) => {
      const errors = isAxiosError<{ fields?: Record<string, string> }>(error)
        ? (error.response?.data.fields ?? {})
        : {}
      setFields(errors)
      requestAnimationFrame(() => {
        const field = form.current?.elements.namedItem(
          Object.keys(errors)[0] ?? '',
        )
        if (field instanceof HTMLElement) field.focus()
      })
    },
    retry: false,
  })
  function change(field: keyof WalletDraft, value: string) {
    setDraft((previous) => ({ ...previous, [field]: value }))
    setFields((previous) => ({ ...previous, [field]: '' }))
  }
  function fieldError(field: keyof WalletDraft) {
    return fields[field] ? (
      <span
        role="alert"
        id={`${errorId}-${field}`}
        className="mt-1 block text-xs text-highlight"
      >
        {fields[field]}
      </span>
    ) : null
  }
  const hasFieldErrors =
    isAxiosError<{ fields?: Record<string, string> }>(mutation.error) &&
    Boolean(mutation.error.response?.data.fields)
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[90] bg-black/70" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-[100] max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border bg-card p-6">
          <Dialog.Title className="pr-8 text-xl font-bold">
            {mode === 'add' ? 'Adicionar carteira' : 'Trocar carteira'}
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-xs text-muted-foreground">
            {mode === 'add'
              ? 'Cadastre um endereço para usar nas próximas compras.'
              : 'Escolha uma carteira cadastrada ou adicione um endereço de demonstração.'}
          </Dialog.Description>
          <Dialog.Close asChild>
            <button
              type="button"
              aria-label="Fechar carteiras"
              className="absolute top-1 right-1 flex size-11 items-center justify-center"
            >
              <X size={20} />
            </button>
          </Dialog.Close>
          <div className="mt-4 space-y-2">
            {(mode === 'add' ? [] : wallets).map((wallet) => (
              <button
                type="button"
                key={wallet.id}
                onClick={() => {
                  onSelect(wallet.id)
                  onOpenChange(false)
                }}
                className="flex min-h-11 w-full flex-col rounded-md border border-border p-3 text-left hover:border-primary"
              >
                <span className="font-bold">{wallet.name}</span>
                <span className="mt-1 text-xs text-muted-foreground">
                  {networkLabels[wallet.network]} ·{' '}
                  {wallet.ens ||
                    `${wallet.address.slice(0, 8)}…${wallet.address.slice(-4)}`}
                </span>
              </button>
            ))}
          </div>
          <form
            ref={form}
            className="mt-6 space-y-3"
            onSubmit={(event) => {
              event.preventDefault()
              setFields({})
              mutation.mutate()
            }}
          >
            <fieldset
              disabled={mutation.isPending}
              className="space-y-3 [&_[aria-invalid=true]]:border-highlight"
            >
              {mode !== 'add' && (
                <h3 className="font-bold">Adicionar carteira</h3>
              )}
              <label className="block text-sm">
                Nome da carteira
                <input
                  required
                  name="name"
                  aria-label="Nome da carteira"
                  aria-invalid={Boolean(fields.name)}
                  aria-describedby={fields.name ? `${errorId}-name` : undefined}
                  minLength={2}
                  maxLength={40}
                  value={draft.name}
                  onChange={(event) => change('name', event.target.value)}
                  className={`${fieldClass} mt-1`}
                />
                {fieldError('name')}
              </label>
              <label className="block text-sm">
                Rede da nova carteira
                <select
                  name="network"
                  aria-label="Rede da nova carteira"
                  aria-invalid={Boolean(fields.network)}
                  aria-describedby={
                    fields.network ? `${errorId}-network` : undefined
                  }
                  value={draft.network}
                  onChange={(event) =>
                    change('network', event.target.value as Network)
                  }
                  className={`${fieldClass} mt-1 bg-card`}
                >
                  {Object.entries(networkLabels).map(([id, name]) => (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  ))}
                </select>
                {fieldError('network')}
              </label>
              <label className="block text-sm">
                Endereço da nova carteira
                <input
                  required
                  name="address"
                  aria-label="Endereço da nova carteira"
                  spellCheck={false}
                  autoCapitalize="none"
                  aria-invalid={Boolean(fields.address)}
                  aria-describedby={`${errorId}-address-hint${fields.address ? ` ${errorId}-address` : ''}`}
                  value={draft.address}
                  maxLength={50}
                  onChange={(event) => change('address', event.target.value)}
                  className={`${fieldClass} mt-1`}
                  placeholder={
                    draft.network === 'solana'
                      ? 'Endereço Solana'
                      : '0x… (40 caracteres hexadecimais)'
                  }
                />
                <span
                  id={`${errorId}-address-hint`}
                  className="mt-1 block text-xs leading-relaxed text-muted-foreground"
                >
                  {draft.network === 'solana'
                    ? 'Use o endereço completo da sua carteira Solana.'
                    : 'Cole o endereço completo: 0x + 40 caracteres. Endereços abreviados com “…” não são aceitos.'}
                </span>
                {fieldError('address')}
              </label>
              <label className="block text-sm">
                ENS (opcional)
                <input
                  name="ens"
                  aria-label="ENS (opcional)"
                  placeholder="seunome.eth"
                  spellCheck={false}
                  autoCapitalize="none"
                  aria-invalid={Boolean(fields.ens)}
                  aria-describedby={fields.ens ? `${errorId}-ens` : undefined}
                  value={draft.ens}
                  maxLength={100}
                  onChange={(event) => change('ens', event.target.value)}
                  className={`${fieldClass} mt-1`}
                />
                {fieldError('ens')}
              </label>
              {mutation.isError && !hasFieldErrors && (
                <p role="alert" className="text-xs text-highlight">
                  {apiErrorMessage(mutation.error)}
                </p>
              )}
              <button
                type="submit"
                disabled={mutation.isPending}
                className="min-h-11 w-full rounded-md bg-primary px-5 font-bold text-primary-foreground disabled:opacity-50"
              >
                {mutation.isPending ? 'Salvando…' : 'Salvar carteira'}
              </button>
            </fieldset>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
