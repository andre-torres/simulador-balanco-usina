import { cn } from '@/lib/utils'

export function Marca({ className }: { className?: string }) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <svg viewBox="0 0 32 32" className="size-7 shrink-0" aria-hidden="true">
        <rect width="32" height="32" rx="7" className="fill-primary" />
        <path d="M8 22V12l5 4v-4l5 4V9h5v13z" className="fill-primary-foreground" />
      </svg>
      <span className="grid leading-tight">
        <span className="text-sm font-semibold tracking-tight">Balanço de Usina</span>
        <span className="text-[11px] text-muted-foreground">Simulador de processo</span>
      </span>
    </span>
  )
}
