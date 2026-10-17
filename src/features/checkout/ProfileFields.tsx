import type { CollectorProfile, Network, Provider, Wallet } from './types'
import { networkLabels, providerLabels } from './types'

export const fieldClass =
  'h-11 w-full min-w-0 rounded-sm border border-border bg-transparent px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-highlight focus-visible:outline-none'
const fields = [
  { name: 'displayName', label: 'Nome de exibição', max: 60 },
  { name: 'username', label: 'Nome de usuário', max: 24 },
  { name: 'profileName', label: 'Nome do perfil', max: 60 },
  { name: 'email', label: 'E-mail', max: 254 },
  { name: 'referral', label: 'Código de indicação (opcional)', max: 40 },
  {
    name: 'ens',
    label: 'Nome ENS (opcional)',
    placeholder: 'seunome.eth',
    max: 100,
  },
] as const

export default function ProfileFields({
  profile,
  onChange,
  wallet,
  wallets,
  selectWallet,
  provider,
  setProvider,
  errors,
  changeWallet,
}: {
  profile: CollectorProfile
  onChange: (value: CollectorProfile) => void
  wallet: Wallet
  wallets: Wallet[]
  selectWallet: (id: string) => void
  provider: Provider
  setProvider: (provider: Provider) => void
  errors: Record<string, string>
  changeWallet: () => void
}) {
  const input = (field: (typeof fields)[number]) => (
    <label className="block text-sm" htmlFor={field.name}>
      {field.label}
      {['displayName', 'username', 'profileName', 'email'].includes(
        field.name,
      ) && <span className="text-highlight"> *</span>}
      <input
        id={field.name}
        name={field.name}
        aria-label={field.label}
        type={field.name === 'email' ? 'email' : 'text'}
        value={profile[field.name]}
        required={['displayName', 'username', 'profileName', 'email'].includes(
          field.name,
        )}
        placeholder={'placeholder' in field ? field.placeholder : undefined}
        maxLength={field.max}
        onChange={(event) =>
          onChange({ ...profile, [field.name]: event.target.value })
        }
        className={`${fieldClass} mt-1`}
        aria-invalid={!!errors[field.name]}
        aria-describedby={
          errors[field.name] ? `${field.name}-error` : undefined
        }
      />
      {errors[field.name] && (
        <span
          id={`${field.name}-error`}
          className="mt-1 block text-xs text-highlight"
        >
          {errors[field.name]}
        </span>
      )}
    </label>
  )
  return (
    <section aria-labelledby="collector-profile-title">
      <h2 id="collector-profile-title" className="mb-4 text-lg font-bold">
        Perfil do colecionador
      </h2>
      <div className="grid gap-4 md:grid-cols-2">
        {input(fields[0])}
        {input(fields[1])}
        <label htmlFor="checkout-network" className="text-sm">
          Rede <span className="text-highlight">*</span>
          <select
            id="checkout-network"
            value={wallet.network}
            onChange={(event) => {
              const found = wallets.find(
                (item) => item.network === event.target.value,
              )
              if (found) selectWallet(found.id)
              else changeWallet()
            }}
            className={`${fieldClass} mt-1 bg-background`}
          >
            {Object.entries(networkLabels).map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </label>
        {input(fields[2])}
        <label htmlFor="checkout-address" className="text-sm md:col-start-1">
          Endereço da carteira <span className="text-highlight">*</span>
          <input
            id="checkout-address"
            value={wallet.address}
            readOnly
            className={`${fieldClass} mt-1 text-xs text-muted-foreground`}
          />
        </label>
        <label htmlFor="checkout-wallet" className="text-sm">
          Carteira cadastrada
          <select
            id="checkout-wallet"
            aria-label="Carteira cadastrada"
            value={wallet.id}
            onChange={(event) => selectWallet(event.target.value)}
            className={`${fieldClass} mt-1 bg-background`}
          >
            {wallets.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} · {networkLabels[item.network]}
              </option>
            ))}
          </select>
        </label>
        <label htmlFor="checkout-provider" className="text-sm">
          Tipo de carteira <span className="text-highlight">*</span>
          <select
            id="checkout-provider"
            value={provider}
            onChange={(event) => setProvider(event.target.value as Provider)}
            className={`${fieldClass} mt-1 bg-background`}
          >
            {Object.entries(providerLabels).map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </label>
        {input(fields[4])}
        {input(fields[3])}
        {input(fields[5])}
      </div>
      <button
        type="button"
        onClick={changeWallet}
        className="mt-3 min-h-11 text-sm text-primary hover:underline"
      >
        Usar outra carteira?
      </button>
      <label
        htmlFor="collector-notes"
        className="mt-3 block text-sm md:max-w-[calc(50%_-_.5rem)]"
      >
        Observação do colecionador (opcional)
        <textarea
          id="collector-notes"
          maxLength={1000}
          value={profile.notes}
          onChange={(event) =>
            onChange({ ...profile, notes: event.target.value })
          }
          className={`${fieldClass} mt-2 h-40 py-3`}
          aria-invalid={!!errors.notes}
        />
        {errors.notes && (
          <span className="text-xs text-highlight">{errors.notes}</span>
        )}
      </label>
    </section>
  )
}

export type WalletDraft = {
  name: string
  address: string
  ens: string
  network: Network
}
