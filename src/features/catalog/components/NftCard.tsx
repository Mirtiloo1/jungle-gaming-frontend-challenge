import { Heart } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { normalizeCatalogSearch } from '../search'

type NftCardProps = {
  id: string
  name: string
  image: string
  imageAlt: string
  price: string
  previousPrice?: string
  isFavorite: boolean
  onToggleFavorite: () => void
  favoriteDisabled?: boolean
}

export default function NftCard({
  id,
  name,
  image,
  imageAlt,
  price,
  previousPrice,
  isFavorite,
  onToggleFavorite,
  favoriteDisabled,
}: NftCardProps) {
  return (
    <article className="min-w-0">
      <div className="relative rounded-3xl bg-card p-2">
        <Link
          to="/nfts/$nftId"
          params={{ nftId: id }}
          search={(previous) => normalizeCatalogSearch(previous)}
          aria-label={`Ver detalhes de ${name}`}
          className="block rounded-2xl"
        >
          <img
            src={image}
            alt={imageAlt}
            width={450}
            height={450}
            draggable={false}
            loading="lazy"
            className="aspect-square w-full rounded-2xl object-cover"
          />
        </Link>

        <button
          type="button"
          onClick={onToggleFavorite}
          disabled={favoriteDisabled}
          aria-label={
            isFavorite ? `Remover ${name} dos favoritos` : `Favoritar ${name}`
          }
          aria-pressed={isFavorite}
          className="absolute top-3 right-3 flex size-11 items-center justify-center rounded-full bg-background text-primary disabled:cursor-wait disabled:opacity-60"
        >
          <Heart
            size={20}
            fill={isFavorite ? 'currentColor' : 'none'}
            aria-hidden="true"
          />
        </button>
      </div>

      <div className="mt-3 px-1">
        <h3 className="text-sm lg:text-base">
          <Link
            to="/nfts/$nftId"
            params={{ nftId: id }}
            search={(previous) => normalizeCatalogSearch(previous)}
            className="rounded-sm hover:text-highlight"
          >
            {name}
          </Link>
        </h3>

        <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="font-bold text-highlight">{price} ETH</span>

          {previousPrice && (
            <del className="text-sm text-muted-foreground">
              <span className="sr-only">Preço anterior: </span>
              {previousPrice} ETH
            </del>
          )}
        </div>
      </div>
    </article>
  )
}
