import { useState } from 'react'
import { fieldClass } from './ProfileFields'

const options = [
  ['default', 'Pagamento aprovado'],
  ['payment-declined', 'Pagamento recusado'],
  ['order-timeout', 'Timeout após envio'],
  ['order-pending', 'Confirmação demorada'],
  ['wallet-rejected', 'Conexão de carteira recusada'],
  ['quote-changed', 'Taxa alterada antes de confirmar'],
  ['checkout-error', 'Falha temporária de serviço'],
  ['nft-updated', 'Preço e estoque atualizados em tempo real'],
] as const
export default function DemoScenarios() {
  const [value, setValue] = useState(
    () => localStorage.getItem('kurio.mock-scenario') ?? 'default',
  )
  if (import.meta.env.VITE_ENABLE_MOCKS === 'false') return null
  return (
    <details className="mt-4 text-xs text-muted-foreground">
      <summary className="min-h-8 cursor-pointer py-2">
        Modo demonstração
      </summary>
      <label className="block pb-3">
        Cenário de demonstração
        <select
          aria-label="Cenário de demonstração"
          value={value}
          onChange={(event) => {
            localStorage.setItem('kurio.mock-scenario', event.target.value)
            setValue(event.target.value)
          }}
          className={`${fieldClass} mt-2 bg-background text-xs`}
        >
          {options.map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <p className="pb-3 leading-relaxed">
        O cenário vale para a próxima tentativa. Nenhum pagamento real será
        realizado.
      </p>
    </details>
  )
}
