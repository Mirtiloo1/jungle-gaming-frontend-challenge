import { useEffect, useState } from 'react'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel'
import type { CarouselApi } from '@/components/ui/carousel'
import NftCard from '@/features/catalog/components/NftCard'
import type { Nft } from '@/features/catalog/types'
import { cn } from '@/lib/utils'

type RelatedNftsProps = {
  items: Nft[]
  favorites: Set<string>
  onFavorite: (id: string) => void
  favoriteDisabled: boolean
  title?: string
}
export default function RelatedNfts({
  items,
  favorites,
  onFavorite,
  favoriteDisabled,
  title = 'Mais desta coleção',
}: RelatedNftsProps) {
  const [api, setApi] = useState<CarouselApi>()
  const [selected, setSelected] = useState(0)
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!api) return
    const sync = () => {
      setSelected(api.selectedScrollSnap())
      setCount(api.scrollSnapList().length)
    }
    sync()
    api.on('select', sync)
    api.on('reInit', sync)
    return () => {
      api.off('select', sync)
      api.off('reInit', sync)
    }
  }, [api])
  if (!items.length) return null
  return (
    <section
      aria-labelledby="related-nfts-title"
      className="mt-12 px-6 lg:mt-24 lg:px-0"
    >
      <h2
        id="related-nfts-title"
        className="border-b border-border pb-3 text-lg font-bold text-highlight"
      >
        {title}
      </h2>
      <Carousel
        setApi={setApi}
        opts={{ align: 'start', loop: true, slidesToScroll: 'auto' }}
        aria-label="NFTs relacionados"
        className="mt-8"
      >
        <CarouselContent className="cursor-grab select-none active:cursor-grabbing">
          {items.map((item) => (
            <CarouselItem
              key={item.id}
              className="basis-1/2 md:basis-1/3 lg:basis-1/5"
            >
              <NftCard
                {...item}
                isFavorite={favorites.has(item.id)}
                onToggleFavorite={() => onFavorite(item.id)}
                favoriteDisabled={favoriteDisabled}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        <div
          role="group"
          aria-label="Páginas de NFTs relacionados"
          className="mt-4 flex flex-wrap justify-center"
        >
          {Array.from({ length: count }, (_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Coleção: página ${index + 1}`}
              aria-current={selected === index ? 'true' : undefined}
              onClick={() => api?.scrollTo(index)}
              className="flex min-h-11 w-6 items-center justify-center rounded-full"
            >
              <span
                aria-hidden="true"
                className={cn(
                  'size-3 rounded-full border border-primary',
                  selected === index && 'bg-primary',
                )}
              />
            </button>
          ))}
        </div>
      </Carousel>
    </section>
  )
}
