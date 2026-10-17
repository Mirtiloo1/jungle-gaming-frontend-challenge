import { ArrowRight } from 'lucide-react'

const banners = [
  {
    title: 'Lançamentos gênesis de edição limitada',
    description:
      'Colecione edições escassas diretamente dos criadores antes da revelação pública.',
    image: '/assets/images/ape-glasses.png',
    alt: 'Macaco de óculos escuros e jaqueta verde',
  },
  {
    title: 'Arte digital selecionada e muito mais',
    description:
      'Explore novos artistas, coleções verificadas e obras digitais que definem a cultura.',
    image: '/assets/images/ape_suit.png',
    alt: 'Macaco com blazer claro e blusa verde',
  },
]

export default function PromotionalBanners() {
  return (
    <section
      id="criadores"
      aria-label="Explore as coleções"
      className="mt-16 grid gap-6 lg:mt-24 lg:grid-cols-2"
    >
      {banners.map((banner) => (
        <article
          key={banner.title}
          className="grid grid-cols-[1fr_1.05fr] items-stretch overflow-hidden rounded-xl bg-card"
        >
          <div className="relative min-w-0 overflow-hidden rounded-2xl">
            <img
              src={banner.image}
              alt={banner.alt}
              width={290}
              height={250}
              loading="lazy"
              className="h-full min-h-60 w-full object-cover"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-32 -left-44 size-72 rounded-full border-2 border-primary/80"
            />
          </div>
          <div className="flex min-w-0 flex-col items-end justify-center px-4 py-6 text-right lg:px-7">
            <h2 className="text-sm leading-snug font-bold lg:text-lg">
              {banner.title}
            </h2>
            <p className="mt-3 text-xs leading-5 text-muted-foreground lg:text-sm lg:leading-6">
              {banner.description}
            </p>
            <a
              href="#catalogo"
              className="mt-3 inline-flex min-h-10 items-center gap-1 rounded-md bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary/90"
            >
              Explorar <ArrowRight size={16} aria-hidden="true" />
            </a>
          </div>
        </article>
      ))}
    </section>
  )
}
