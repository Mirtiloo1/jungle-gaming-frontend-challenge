import { Link } from '@tanstack/react-router'

export default function NotFoundPage() {
  return (
    <main className="page-container py-24 text-center">
      <h1 className="text-2xl font-bold">Página não encontrada</h1>
      <p className="mt-4 text-muted-foreground">Este endereço não existe.</p>
      <Link
        to="/"
        className="mt-6 inline-flex min-h-11 items-center rounded-md bg-primary px-5 font-bold text-primary-foreground"
      >
        Voltar ao catálogo
      </Link>
    </main>
  )
}
