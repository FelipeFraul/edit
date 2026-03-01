import React, { useEffect, useState } from "react"

const COLOR_SWAP_MS = 3200

function PlusCircleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.1" />
      <path d="M12 8V16" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M8 12H16" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

export default function RotatingAgencyButton() {
  const [isLight, setIsLight] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const syncViewport = () => setIsMobile(window.innerWidth < 640)
    syncViewport()
    window.addEventListener("resize", syncViewport)
    return () => window.removeEventListener("resize", syncViewport)
  }, [])

  useEffect(() => {
    if (isMobile) {
      setIsLight(true)
      return
    }
    const timer = window.setInterval(() => {
      setIsLight((prev) => !prev)
    }, COLOR_SWAP_MS)
    return () => window.clearInterval(timer)
  }, [isMobile])

  const goToSection04 = () => {
    const target = document.getElementById("secao-04")
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" })
      return
    }
    window.location.hash = "#secao-04"
  }

  return (
    <button
      type="button"
      aria-label="Ir para secao de vozes"
      onClick={goToSection04}
      className="btn-vozes font-secular relative w-full overflow-hidden !rounded-none !px-4 !text-[10px] !tracking-[0.22em] transition-colors duration-500"
      style={{
        background: isLight ? "rgba(255,255,255,0.98)" : "rgba(0,0,0,0.82)",
        border: isLight
          ? "1px solid rgba(0,0,0,0.14)"
          : "1px solid rgba(255,255,255,0.28)",
        color: isLight ? "rgba(0,0,0,0.92)" : "rgba(255,255,255,0.95)",
      }}
    >
      <span className="pointer-events-none relative z-10 flex h-full items-center justify-center gap-2">
        <span>AGENCIA DE VOZES</span>
        <PlusCircleIcon />
      </span>
    </button>
  )
}
