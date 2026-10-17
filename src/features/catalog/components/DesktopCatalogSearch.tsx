import { useEffect, useId, useRef, useState } from 'react'
import { Search } from 'lucide-react'
import CatalogSearchInput from './CatalogSearchInput'

export default function DesktopCatalogSearch() {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const panelId = useId()

  function closeSearch() {
    setOpen(false)
    requestAnimationFrame(() => trigger.current?.focus())
  }

  useEffect(() => {
    if (!open) return
    root.current?.querySelector('input')?.focus()
    const dismiss = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target))
        setOpen(false)
    }
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      setOpen(false)
      requestAnimationFrame(() => trigger.current?.focus())
    }
    document.addEventListener('pointerdown', dismiss)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('pointerdown', dismiss)
      document.removeEventListener('keydown', escape)
    }
  }, [open])

  return (
    <div
      ref={root}
      data-open={open}
      className="relative h-12 w-11 shrink-0 transition-[width] duration-300 ease-[cubic-bezier(.22,1,.36,1)] data-[open=true]:w-[clamp(15rem,23vw,20rem)] motion-reduce:transition-none"
      onBlurCapture={(event) => {
        if (
          event.relatedTarget instanceof Node &&
          !event.currentTarget.contains(event.relatedTarget)
        )
          setOpen(false)
      }}
    >
      <button
        ref={trigger}
        type="button"
        aria-label="Abrir busca"
        aria-expanded={open}
        aria-controls={panelId}
        tabIndex={open ? -1 : 0}
        onClick={() => setOpen(true)}
        className={`absolute top-0 right-0 z-10 flex h-12 w-11 cursor-pointer items-center justify-center rounded-full transition-[opacity,color,background-color] duration-150 hover:bg-card hover:text-primary ${open ? 'pointer-events-none invisible opacity-0' : 'visible opacity-100'}`}
      >
        <Search size={24} aria-hidden="true" />
      </button>
      <div
        id={panelId}
        inert={!open}
        aria-hidden={!open}
        className={`absolute inset-y-0 right-0 w-full overflow-hidden rounded-full transition-opacity duration-200 ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      >
        <CatalogSearchInput
          onSubmit={closeSearch}
          onClose={closeSearch}
          className="w-full gap-1 rounded-full border border-primary/40 px-2 focus-within:border-primary focus-within:ring-0"
        />
      </div>
    </div>
  )
}
