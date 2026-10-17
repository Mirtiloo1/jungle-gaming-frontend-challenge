import { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel'
import { cn } from '@/lib/utils'

const slides = [
  {
    id: 1,
    eyebrow: 'Bem-vindo à Kurio',
    title: 'Seja dono do futuro da arte digital',
    mobileTitle: 'Seja dono da cultura digital',
    mobileDescription: 'Descubra NFTs selecionados de criadores do mundo todo.',
    description:
      'Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital rara, apoie artistas e tenha uma parte da cultura da internet.',
    cta: 'Explorar',
    image: '/assets/images/ape-glasses.png',
    alt: 'Macaco com óculos escuros e jaqueta verde',
  },
  {
    id: 2,
    eyebrow: 'Encontre sua próxima coleção',
    title: 'Histórias únicas para sua coleção',
    mobileTitle: 'Sua próxima coleção começa aqui',
    mobileDescription: 'Encontre personagens e estilos que combinam com você.',
    description:
      'Conheça personagens, estilos e novas perspectivas. Encontre a arte que combina com você e dê o próximo passo na sua coleção digital.',
    cta: 'Descobrir coleções',
    image: '/assets/images/ape-hoodie.png',
    alt: 'Macaco com chapéu verde e moletom roxo',
  },
  {
    id: 3,
    eyebrow: 'Arte digital selecionada',
    title: 'Novos artistas, novas possibilidades',
    mobileTitle: 'Um novo olhar para a arte',
    mobileDescription: 'Explore novos artistas e descubra edições especiais.',
    description:
      'Explore obras de criadores independentes e descubra edições especiais. Sua próxima descoberta começa com um olhar diferente.',
    cta: 'Conhecer os NFTs',
    image: '/assets/images/ape_suit.png',
    alt: 'Macaco com blazer claro',
  },
]

export default function HeroSection() {
  const [api, setApi] = useState<CarouselApi>()
  const [currentSlide, setCurrentSlide] = useState(0)

  // O mesmo evento é disparado ao arrastar, usar o teclado ou clicar nas bolinhas.
  useEffect(() => {
    if (!api) return

    const updateCurrentSlide = () => setCurrentSlide(api.selectedScrollSnap())

    updateCurrentSlide()
    api.on('select', updateCurrentSlide)
    api.on('reInit', updateCurrentSlide)

    return () => {
      api.off('select', updateCurrentSlide)
      api.off('reInit', updateCurrentSlide)
    }
  }, [api])

  return (
    <section aria-label="Coleções em destaque">
      <Carousel
        setApi={setApi}
        opts={{ loop: true, align: 'start' }}
        aria-label="Destaques da Kurio"
        className="overflow-hidden rounded-4xl bg-linear-to-br from-secondary to-background lg:mt-8 lg:rounded-none lg:bg-none"
      >
        <CarouselContent className="ml-0 cursor-grab select-none active:cursor-grabbing">
          {slides.map((slide, index) => (
            <CarouselItem
              key={slide.id}
              aria-label={`${index + 1} de ${slides.length}`}
              aria-hidden={index !== currentSlide}
              inert={index !== currentSlide}
              className="pl-0"
            >
              <div className="grid min-h-72 grid-cols-[1.15fr_1fr] items-center gap-3 px-4 pt-4 pb-12 lg:min-h-112.5 lg:grid-cols-[minmax(0,1fr)_450px] lg:gap-16 lg:py-0 lg:pr-0 lg:pl-10">
                <div className="min-w-0">
                  <p className="text-xs tracking-wide lg:text-sm lg:tracking-widest">
                    {slide.eyebrow}
                  </p>
                  <h2 className="mt-2 text-lg leading-relaxed font-bold uppercase lg:mt-4 lg:text-[44px] lg:leading-[1.6]">
                    <span className="lg:hidden">{slide.mobileTitle}</span>
                    <span className="hidden lg:inline">{slide.title}</span>
                  </h2>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground lg:text-sm lg:leading-6">
                    <span className="lg:hidden">{slide.mobileDescription}</span>
                    <span className="hidden lg:inline">
                      {slide.description}
                    </span>
                  </p>
                  <a
                    href="#catalogo"
                    className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-md text-xs font-bold text-highlight uppercase lg:mt-8 lg:bg-primary lg:px-7 lg:text-base lg:text-primary-foreground"
                  >
                    {slide.cta}
                    <ArrowRight
                      size={16}
                      className="lg:hidden"
                      aria-hidden="true"
                    />
                  </a>
                </div>

                <img
                  src={slide.image}
                  alt={slide.alt}
                  width={450}
                  height={450}
                  draggable={false}
                  loading={index === 0 ? 'eager' : 'lazy'}
                  className="aspect-square w-full self-start rounded-2xl object-cover lg:self-center lg:rounded-3xl"
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        <div
          role="group"
          aria-label="Escolher destaque"
          className="absolute inset-x-0 bottom-1 flex justify-center lg:bottom-6"
        >
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              aria-label={`Ir para o destaque ${index + 1}`}
              aria-current={currentSlide === index ? 'true' : undefined}
              onClick={() => api?.scrollTo(index)}
              className="flex min-h-11 w-6 items-center justify-center rounded-full"
            >
              <span
                aria-hidden="true"
                className={cn(
                  'size-2 rounded-full bg-primary/40',
                  currentSlide === index &&
                    'bg-primary ring-1 ring-primary ring-offset-2 ring-offset-background',
                )}
              />
            </button>
          ))}
        </div>
        <p className="sr-only" aria-live="polite" aria-atomic="true">
          Destaque {currentSlide + 1} de {slides.length}:{' '}
          {slides[currentSlide].title}
        </p>
      </Carousel>
    </section>
  )
}
