import { useEffect, useId, useRef, useState } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { lerNumero, textoEdicao } from '@/lib/formato'
import { cn } from '@/lib/utils'

/**
 * Texto de um campo numérico: aceita vírgula ou ponto, só repassa valores
 * válidos e volta ao último valor bom ao sair do campo.
 */
function useTextoNumerico(
  valor: number | null,
  aoMudar: (valor: number | null) => void,
  permitirVazio: boolean,
) {
  const [texto, setTexto] = useState(valor === null ? '' : textoEdicao(valor))
  const focado = useRef(false)

  useEffect(() => {
    if (focado.current) return
    setTexto(valor === null ? '' : textoEdicao(valor))
  }, [valor])

  return {
    value: texto,
    onChange(evento: React.ChangeEvent<HTMLInputElement>) {
      const novo = evento.target.value
      setTexto(novo)
      const lido = lerNumero(novo)
      if (lido !== null) aoMudar(lido)
      else if (permitirVazio && novo.trim() === '') aoMudar(null)
    },
    onFocus(evento: React.FocusEvent<HTMLInputElement>) {
      focado.current = true
      evento.target.select()
    },
    onBlur() {
      focado.current = false
      setTexto(valor === null ? '' : textoEdicao(valor))
    },
    invalido: texto.trim() !== '' ? lerNumero(texto) === null : !permitirVazio,
  }
}

const classeDigitacao = 'num bg-campo text-right dark:bg-campo'

interface CampoNumeroProps {
  rotulo: string
  unidade?: string
  valor: number
  aoMudar: (valor: number) => void
  dica?: string
  className?: string
}

/** Campo de digitação com rótulo e unidade. */
export function CampoNumero({ rotulo, unidade, valor, aoMudar, dica, className }: CampoNumeroProps) {
  const id = useId()
  const { invalido, ...campo } = useTextoNumerico(valor, (v) => v !== null && aoMudar(v), false)
  return (
    <div className={cn('grid content-start gap-1.5', className)}>
      <Label htmlFor={id} className="text-xs font-normal text-muted-foreground">
        {rotulo}
      </Label>
      <div className="relative">
        <Input
          id={id}
          inputMode="decimal"
          autoComplete="off"
          aria-invalid={invalido}
          aria-describedby={dica ? `${id}-dica` : undefined}
          className={classeDigitacao}
          style={unidade ? { paddingRight: `${unidade.length * 0.42 + 1.25}rem` } : undefined}
          {...campo}
        />
        {unidade && (
          <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-xs text-muted-foreground">
            {unidade}
          </span>
        )}
      </div>
      {dica && (
        <p id={`${id}-dica`} className="text-xs leading-snug text-muted-foreground">
          {dica}
        </p>
      )}
    </div>
  )
}

interface NumeroCelulaProps {
  rotulo: string
  valor: number | null
  aoMudar: (valor: number | null) => void
  /** Texto exibido com o campo vazio; habilita o valor vazio (`null`). */
  vazio?: string
  className?: string
  disabled?: boolean
}

/** Campo compacto para células de tabela. */
export function NumeroCelula({ rotulo, valor, aoMudar, vazio, className, disabled }: NumeroCelulaProps) {
  const { invalido, ...campo } = useTextoNumerico(valor, aoMudar, vazio !== undefined)
  return (
    <Input
      aria-label={rotulo}
      inputMode="decimal"
      autoComplete="off"
      aria-invalid={invalido}
      placeholder={vazio}
      disabled={disabled}
      className={cn(classeDigitacao, 'h-8 w-24 px-2 placeholder:text-[11px] placeholder:font-sans', className)}
      {...campo}
    />
  )
}
