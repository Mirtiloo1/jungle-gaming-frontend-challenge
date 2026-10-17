import { ArrowRight } from 'lucide-react'
import { DemoNoticeButton } from '@/components/ui/demo-notice-button'

const articles = [
  {
    title: 'Como funciona a propriedade de NFTs',
    description: 'Aprenda a colecionar, negociar e verificar ativos digitais.',
    image: '/assets/images/ape_suit.png',
    alt: 'Macaco com blazer claro',
    date: '12 de setembro',
    dateTime: '2026-09-12',
    minutes: 6,
  },
  {
    title: '10 artistas digitais para acompanhar',
    description: 'Conheça criadores que moldam a cultura digital.',
    image: '/assets/images/ape-glasses.png',
    alt: 'Macaco com óculos escuros e jaqueta verde',
    date: '13 de setembro',
    dateTime: '2026-09-13',
    minutes: 2,
  },
  {
    title: 'Raridade, atributos e procedência',
    description:
      'Entenda raridade, procedência, direitos autorais e utilidade.',
    image: '/assets/images/ape-hoodie.png',
    alt: 'Macaco com chapéu verde e moletom roxo',
    date: '15 de setembro',
    dateTime: '2026-09-15',
    minutes: 3,
  },
  {
    title: 'Como proteger sua carteira',
    description: 'Proteja sua carteira, seus ativos e sua identidade.',
    image: '/assets/images/ape-headset.png',
    alt: 'Macaco dourado usando fones de ouvido',
    date: '15 de setembro',
    dateTime: '2026-09-15',
    minutes: 2,
  },
]

export default function EditorialSection() {
  return (
    <section
      id="aprenda"
      aria-labelledby="editorial-title"
      className="mt-16 lg:mt-24"
    >
      <div className="text-center">
        <h2 id="editorial-title" className="text-2xl font-bold lg:text-3xl">
          Diário da Cunhagem
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Histórias, guias e insights para colecionadores sobre o universo da
          propriedade digital.
        </p>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:mt-10 lg:grid-cols-4">
        {articles.map((article) => (
          <article
            key={article.title}
            className="flex min-w-0 flex-col overflow-hidden rounded-lg bg-card"
          >
            <img
              src={article.image}
              alt={article.alt}
              width={300}
              height={220}
              loading="lazy"
              className="aspect-[1.35] w-full object-cover object-top"
            />
            <div className="flex flex-1 flex-col p-4">
              <p className="text-[11px] leading-4 text-muted-foreground">
                <time dateTime={article.dateTime}>{article.date}</time>
                {' | '}Leitura de {article.minutes} min
              </p>
              <h3 className="mt-2 text-sm leading-5 font-bold">
                {article.title}
              </h3>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                {article.description}
              </p>
              <DemoNoticeButton
                title={article.title}
                description="Os artigos do Diário da Cunhagem não estão disponíveis nesta demonstração."
                aria-label={`Ler mais: ${article.title}`}
                className="mt-auto inline-flex min-h-10 items-center gap-1 self-start pt-2 text-xs font-bold text-highlight hover:underline"
              >
                Ler mais <ArrowRight size={12} aria-hidden="true" />
              </DemoNoticeButton>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
