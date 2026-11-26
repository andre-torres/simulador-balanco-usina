import { useCallback, useEffect, useState } from 'react'

type Tema = 'claro' | 'escuro'
const CHAVE = 'balanco-usina:tema'

function temaInicial(): Tema {
  try {
    const salvo = localStorage.getItem(CHAVE)
    if (salvo === 'claro' || salvo === 'escuro') return salvo
  } catch {
    // sem armazenamento: segue a preferência do sistema
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'escuro' : 'claro'
}

export function useTema(): { tema: Tema; alternar: () => void } {
  const [tema, setTema] = useState<Tema>(temaInicial)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', tema === 'escuro')
  }, [tema])

  const alternar = useCallback(() => {
    setTema((atual) => {
      const novo = atual === 'escuro' ? 'claro' : 'escuro'
      try {
        localStorage.setItem(CHAVE, novo)
      } catch {
        // preferência vale só nesta sessão
      }
      return novo
    })
  }, [])

  return { tema, alternar }
}
