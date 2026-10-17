import { useState } from 'react'
import { Tabs } from 'radix-ui'
import { Star } from 'lucide-react'
import type { NftDetail } from '../types'

export default function NftDetailsTabs({ nft }: { nft: NftDetail }) {
  const [visibleReviews, setVisibleReviews] = useState(4)
  const tabClass =
    'min-h-12 shrink-0 border-b-2 border-transparent px-1 text-left text-sm data-[state=active]:border-primary data-[state=active]:font-bold data-[state=active]:text-highlight lg:text-base'
  return (
    <Tabs.Root defaultValue="details" className="mt-10 px-6 lg:mt-20 lg:px-0">
      <Tabs.List
        aria-label="Informações do NFT"
        className="flex gap-6 overflow-x-auto border-b border-border"
      >
        <Tabs.Trigger value="details" className={tabClass}>
          Detalhes do NFT
        </Tabs.Trigger>
        <Tabs.Trigger value="reviews" className={tabClass}>
          Avaliações de colecionadores ({nft.reviewCount})
        </Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content
        value="details"
        className="pt-4 text-sm leading-6 text-muted-foreground"
      >
        {nft.paragraphs.map((paragraph) => (
          <p key={paragraph} className="mb-6">
            {paragraph}
          </p>
        ))}
        <dl className="space-y-4">
          <div>
            <dt className="font-bold text-foreground">Rede:</dt>
            <dd>
              Cunhado na {nft.networkLabel} com procedência imutável e metadados
              armazenados no IPFS.
            </dd>
          </div>
          <div>
            <dt className="font-bold text-foreground">Contrato:</dt>
            <dd className="break-words">
              {nft.contract} · Contrato inteligente de demonstração.
            </dd>
          </div>
          <div>
            <dt className="font-bold text-foreground">Direitos autorais:</dt>
            <dd>
              {nft.creator} recebe {nft.royalty} nas vendas secundárias pelos
              mercados compatíveis.
            </dd>
          </div>
        </dl>
      </Tabs.Content>
      <Tabs.Content value="reviews" className="pt-6">
        <p className="mb-6 text-sm text-muted-foreground">
          {nft.rating.toFixed(1)} de 5 · {nft.reviewCount} avaliações
        </p>
        <ul className="grid gap-4 lg:grid-cols-2">
          {nft.reviews.slice(0, visibleReviews).map((review) => (
            <li key={review.id} className="rounded-xl bg-card p-5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-bold">{review.author}</h3>
                <time
                  dateTime={review.date}
                  className="text-xs text-muted-foreground"
                >
                  {new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(
                    new Date(review.date),
                  )}
                </time>
              </div>
              <p
                aria-label={`Nota ${review.rating} de 5`}
                className="mt-2 flex gap-1 text-highlight"
              >
                {Array.from({ length: 5 }, (_, index) => (
                  <Star
                    key={index}
                    size={14}
                    fill={index < review.rating ? 'currentColor' : 'none'}
                    aria-hidden="true"
                  />
                ))}
              </p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {review.comment}
              </p>
            </li>
          ))}
        </ul>
        {visibleReviews < nft.reviews.length && (
          <button
            type="button"
            onClick={() => setVisibleReviews((count) => count + 5)}
            className="mt-6 min-h-11 rounded-md border border-primary px-5 text-primary hover:bg-card"
          >
            Ver mais avaliações
          </button>
        )}
      </Tabs.Content>
    </Tabs.Root>
  )
}
