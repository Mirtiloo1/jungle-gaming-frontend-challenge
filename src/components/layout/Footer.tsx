import { Facebook, Instagram, Linkedin, Twitter, Youtube } from 'lucide-react'
import { DemoNoticeButton } from '@/components/ui/demo-notice-button'

const benefits = [
  {
    letter: 'W',
    title: 'Segurança da carteira',
    description:
      'Proteja sua carteira e colecione arte digital verificada com confiança.',
  },
  {
    letter: 'C',
    title: 'Criadores em destaque',
    description:
      'Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.',
  },
  {
    letter: 'D',
    title: 'Alertas de lançamentos',
    description:
      'Receba calendários de cunhagem, novidades e listas de acesso e análises do mercado.',
  },
]

const linkGroups = [
  {
    title: 'Meu perfil',
    links: [
      'Meu perfil',
      'Minha coleção',
      'Atividade',
      'Estúdio do criador',
      'Lista de interesse',
    ],
  },
  {
    title: 'Central de ajuda',
    links: [
      'Central de ajuda',
      'Como comprar NFTs',
      'Carteira e segurança',
      'Política do mercado',
      'Denunciar item',
    ],
  },
  {
    title: 'Coleções',
    links: ['Arte digital', 'Fotografia', 'Música', 'Arte 3D', 'Utilidade'],
  },
]

const socialLinks = [
  { label: 'Facebook', Icon: Facebook },
  { label: 'Instagram', Icon: Instagram },
  { label: 'Twitter', Icon: Twitter },
  { label: 'LinkedIn', Icon: Linkedin },
  { label: 'YouTube', Icon: Youtube },
]

export default function Footer() {
  return (
    <footer className="page-container mt-16 pb-28 lg:mt-24 lg:pb-0">
      <div className="bg-card">
        <div className="grid gap-8 px-6 py-8 md:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1.3fr] lg:gap-0 lg:px-8">
          {benefits.map((benefit) => (
            <div
              key={benefit.letter}
              className="lg:mr-4 lg:border-r lg:border-primary/60 lg:pr-4"
            >
              <span
                aria-hidden="true"
                className="flex size-16 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground"
              >
                {benefit.letter}
              </span>
              <h2 className="mt-3 text-base font-bold">{benefit.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {benefit.description}
              </p>
            </div>
          ))}

          <div>
            <h2
              id="newsletter-title"
              className="text-base leading-tight font-bold"
            >
              Antecipe-se ao próximo lançamento
            </h2>
            <form
              aria-labelledby="newsletter-title"
              onSubmit={(event) => event.preventDefault()}
              className="mt-3 flex rounded-md bg-secondary"
            >
              <input
                type="email"
                name="email"
                autoComplete="email"
                aria-label="E-mail para novidades"
                placeholder="digite seu e-mail..."
                required
                className="min-h-10 min-w-0 flex-1 rounded-l-md bg-transparent px-3 text-xs focus-visible:-outline-offset-2"
              />
              <button
                type="submit"
                className="min-h-10 shrink-0 cursor-pointer rounded-r-md bg-primary px-3 font-bold text-primary-foreground transition-colors hover:bg-primary/85 active:bg-primary/70"
              >
                Enviar
              </button>
            </form>
            <p className="mt-3 text-xs leading-5 text-muted-foreground">
              Receba lançamentos selecionados, histórias de criadores e
              novidades do mercado.
            </p>
          </div>
        </div>

        <div className="grid items-center gap-5 bg-secondary px-6 py-6 text-sm md:grid-cols-2 lg:grid-cols-4 lg:px-8">
          <a
            href="#"
            aria-label="Kurio — voltar ao topo"
            className="justify-self-start font-bold tracking-widest"
          >
            KURIO
          </a>
          <p className="leading-6">
            Feito para colecionadores,
            <br />
            criadores e cultura
          </p>
          <p className="break-all">contato@email.com</p>
          <p>+55 11 4002 8922</p>
        </div>

        <div className="grid gap-8 px-6 py-8 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
          {linkGroups.map((group) => (
            <div key={group.title}>
              <h2 className="text-lg font-bold">{group.title}</h2>
              <ul className="mt-2 space-y-1">
                {group.links.map((label) => (
                  <li key={label}>
                    <DemoNoticeButton
                      title={label}
                      description="Esta área ainda não está disponível nesta demonstração."
                      className="min-h-8 text-left text-sm hover:text-highlight"
                    >
                      {label}
                    </DemoNoticeButton>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h2 className="text-lg font-bold">Redes sociais</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {socialLinks.map(({ label, Icon }) => (
                <li key={label}>
                  <DemoNoticeButton
                    title={label}
                    aria-label={`Kurio no ${label}`}
                    description="Os perfis sociais da Kurio não estão disponíveis nesta demonstração."
                    className="flex size-8 items-center justify-center rounded-sm border border-primary text-primary hover:bg-secondary"
                  >
                    <Icon size={18} aria-hidden="true" />
                  </DemoNoticeButton>
                </li>
              ))}
            </ul>
            <h2 className="mt-6 text-lg font-bold">Carteiras compatíveis</h2>
            <p className="mt-2 inline-block rounded-md border border-border bg-secondary px-2 py-1.5 text-[9px] text-highlight">
              METAMASK · WALLETCONNECT · COINBASE
            </p>
          </div>
        </div>
      </div>

      <p className="py-4 text-center text-xs leading-5">
        © 2026 Kurio. Propriedade digital para todos.
      </p>
    </footer>
  )
}
