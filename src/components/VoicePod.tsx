import React, { useEffect, useRef, useState } from "react"
import RotatingAgencyButton from "./RotatingAgencyButton"

const TALENTS = [
  "BRUNO ROCHEL",
  "ANA LIMA",
  "CARLA SOUZA",
  "RAFAEL COSTA",
  "MARIANA ALVES",
  "LUCAS ROCHA",
  "PATRICIA NUNES",
  "HENRIQUE MOTA",
  "JULIA PRADO",
  "FELIPE OLIVEIRA",
]

type VoicePodProps = {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export default function VoicePod({ open, onOpenChange }: VoicePodProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [items, setItems] = useState<string[]>(TALENTS.slice(0, 5))
  const podRef = useRef<HTMLDivElement | null>(null)
  const isControlled = typeof open === "boolean"
  const isOpen = isControlled ? Boolean(open) : internalOpen

  const setOpen = (next: boolean) => {
    if (!isControlled) setInternalOpen(next)
    onOpenChange?.(next)
  }

  const shuffleItems = () => {
    const next = [...TALENTS]
    for (let i = next.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1))
      const temp = next[i]
      next[i] = next[j]
      next[j] = temp
    }
    setItems(next.slice(0, 5))
  }

  const toggleOpen = () => {
    const next = !isOpen
    if (next) shuffleItems()
    setOpen(next)
  }

  const StaticHeaderIcon = () => (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.1" />
      <path d="M12 8V16" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M8 12H16" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (podRef.current && !podRef.current.contains(target)) setOpen(false)
    }

    window.addEventListener("keydown", onKeyDown)
    window.addEventListener("mousedown", onPointerDown)
    return () => {
      window.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("mousedown", onPointerDown)
    }
  }, [isControlled])

  return (
    <>
      <div
        ref={podRef}
        className={`fixed bottom-[30px] right-6 z-[80] max-w-[calc(100vw-1.5rem)] transition-[width] duration-200 sm:right-12 lg:right-16 ${
          isOpen ? "w-[320px]" : "w-[210px]"
        }`}
      >
        <div
          className={`px-3 text-white ${
            isOpen
              ? "rounded-[24px] border border-white/20 bg-black/35 pb-3 pt-2 shadow-[0_18px_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl"
              : "py-0"
          }`}
        >
          {isOpen ? (
            <button
              type="button"
              aria-label="Fechar agencia de vozes"
              onClick={toggleOpen}
              className="btn-vozes font-secular relative w-full overflow-hidden rounded-none !border-white/30 !bg-black/45 !px-4 !text-[10px] !tracking-[0.22em] !text-white/95 backdrop-blur-md"
            >
              <span className="pointer-events-none relative z-10 flex h-full items-center justify-center gap-2">
                <span>AGENCIA DE VOZES</span>
                <StaticHeaderIcon />
              </span>
            </button>
          ) : (
            <RotatingAgencyButton />
          )}

          {isOpen ? (
            <div className="mt-2 grid grid-cols-2 gap-3">
              {items.map((name) => (
                <button
                  key={name}
                  type="button"
                  className="inline-flex h-10 w-full items-center justify-start gap-1 rounded-none border border-white/25 bg-white/8 px-3 text-left text-[10px] uppercase tracking-[0.05em] text-white/90 transition hover:bg-white/16"
                >
                  <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center">
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
                      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.1" />
                      <path d="M10.2 8.8L15.2 12L10.2 15.2V8.8Z" fill="currentColor" />
                    </svg>
                  </span>
                  <span className="truncate">{name}</span>
                </button>
              ))}
              <button
                type="button"
                  className="inline-flex h-10 w-full items-center justify-start gap-1 rounded-none border border-white/25 bg-white/8 px-3 text-left text-[10px] uppercase tracking-[0.05em] text-white/90 transition hover:bg-white/16"
              >
                <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
                    <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.1" />
                    <path d="M12 8V16" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                    <path d="M8 12H16" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                </span>
                <span>Ver mais</span>
              </button>
            </div>
          ) : null}
        </div>
      </div>

    </>
  )
}
