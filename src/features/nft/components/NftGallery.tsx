import { useState } from 'react'
import { Dialog } from 'radix-ui'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { NftDetail } from '../types'

export default function NftGallery({ nft }: { nft: NftDetail }) {
  const [selected, setSelected] = useState(0)
  const image = nft.gallery[selected]
  return (
    <div className="grid gap-7 lg:grid-cols-[100px_minmax(0,1fr)]">
      <div
        role="group"
        aria-label="Galeria do NFT"
        className="hidden flex-col gap-4 lg:flex"
      >
        {nft.gallery.map((item, index) => (
          <button
            key={item.id}
            type="button"
            aria-label={item.label}
            aria-pressed={index === selected}
            onClick={() => setSelected(index)}
            className={cn(
              'aspect-square overflow-hidden rounded-lg',
              index === selected &&
                'ring-1 ring-primary ring-offset-2 ring-offset-background',
            )}
          >
            <img
              src={item.src}
              alt=""
              width={100}
              height={100}
              style={{
                transform: `scale(${item.scale})`,
                transformOrigin: item.origin,
              }}
              className="size-full object-cover"
            />
          </button>
        ))}
      </div>
      <div className="relative rounded-md lg:bg-card lg:p-5">
        <div className="aspect-square overflow-hidden rounded-3xl">
          <img
            src={image.src}
            alt={`${nft.imageAlt} — ${image.label}`}
            width={450}
            height={450}
            draggable={false}
            style={{
              transform: `scale(${image.scale})`,
              transformOrigin: image.origin,
            }}
            className="size-full object-cover"
          />
        </div>
        <Dialog.Root>
          <Dialog.Trigger asChild>
            <button
              type="button"
              aria-label="Ampliar imagem do NFT"
              className="absolute top-3 right-3 flex size-9 items-center justify-center rounded-full bg-background/90 text-foreground lg:top-4 lg:right-4"
            >
              <Search size={23} aria-hidden="true" />
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-[90] bg-black/85" />
            <Dialog.Content className="fixed top-1/2 left-1/2 z-[100] w-[min(90vw,80dvh)] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-card p-3">
              <Dialog.Title className="sr-only">
                Imagem ampliada de {nft.name}
              </Dialog.Title>
              <Dialog.Description className="sr-only">
                {image.label}. Use Escape ou o botão de fechar para voltar.
              </Dialog.Description>
              <div className="aspect-square overflow-hidden rounded-xl">
                <img
                  src={image.src}
                  alt={nft.imageAlt}
                  width={900}
                  height={900}
                  style={{
                    transform: `scale(${image.scale})`,
                    transformOrigin: image.origin,
                  }}
                  className="size-full object-cover"
                />
              </div>
              <Dialog.Close asChild>
                <button
                  type="button"
                  aria-label="Fechar imagem ampliada"
                  className="absolute top-4 right-4 flex size-11 items-center justify-center rounded-full bg-background/90"
                >
                  <X size={22} aria-hidden="true" />
                </button>
              </Dialog.Close>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </div>
  )
}
