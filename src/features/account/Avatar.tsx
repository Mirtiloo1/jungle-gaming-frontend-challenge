import { UserRound } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Avatar({
  src,
  name,
  className,
}: {
  src?: string | null
  name: string
  className?: string
}) {
  return (
    <span
      className={cn(
        'flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-secondary text-primary',
        className,
      )}
    >
      {src ? (
        <img
          src={src}
          alt={`Avatar de ${name}`}
          className="h-full w-full object-cover"
        />
      ) : (
        <UserRound size={24} aria-hidden="true" />
      )}
    </span>
  )
}
