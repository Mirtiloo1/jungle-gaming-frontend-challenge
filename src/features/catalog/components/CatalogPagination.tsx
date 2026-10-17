import { Link } from '@tanstack/react-router'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

type CatalogPaginationProps = {
  currentPage: number
  totalPages: number
}

export default function CatalogPagination({
  currentPage,
  totalPages,
}: CatalogPaginationProps) {
  const itemClass =
    'flex size-9 items-center justify-center rounded-sm border text-sm transition-colors'

  return (
    <nav
      aria-label="Paginação do catálogo"
      className="mt-12 flex justify-end lg:mt-20"
    >
      <ul className="flex items-center gap-2">
        {Array.from({ length: totalPages }, (_, index) => index + 1).map(
          (page) => (
            <li key={page}>
              <Link
                to="/"
                search={(previous) => ({ ...previous, page })}
                hash="catalogo"
                aria-label={`Página ${page}`}
                aria-current={page === currentPage ? 'page' : undefined}
                className={cn(
                  itemClass,
                  page === currentPage
                    ? 'border-primary bg-primary font-bold text-primary-foreground'
                    : 'border-border text-foreground hover:border-primary hover:text-highlight',
                )}
              >
                {page}
              </Link>
            </li>
          ),
        )}
        <li>
          {currentPage < totalPages ? (
            <Link
              to="/"
              search={(previous) => ({ ...previous, page: currentPage + 1 })}
              hash="catalogo"
              aria-label="Próxima página"
              className={cn(
                itemClass,
                'border-border text-foreground hover:border-primary hover:text-highlight',
              )}
            >
              <ChevronRight size={18} aria-hidden="true" />
            </Link>
          ) : (
            <button
              type="button"
              disabled
              aria-label="Próxima página"
              className={cn(
                itemClass,
                'cursor-not-allowed border-border text-muted-foreground opacity-40',
              )}
            >
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          )}
        </li>
      </ul>
    </nav>
  )
}
