import React, { useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { createPortal } from "react-dom"

type MenuItem = {
  label: string
  href: string
}

type FullscreenMenuProps = {
  items?: MenuItem[]
  isLight?: boolean
}

const DEFAULT_ITEMS: MenuItem[] = [
  { label: "INÍCIO", href: "#hero" },
  { label: "ESTÚDIO", href: "#secao-01" },
  { label: "PRODUÇÕES", href: "#secao-02" },
  { label: "VOZES", href: "#secao-04" },
  { label: "CLIENTES", href: "#secao-05" },
  { label: "NÚMEROS", href: "#secao-06" },
]

export default function FullscreenMenu({ items, isLight = false }: FullscreenMenuProps) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isMobileViewport, setIsMobileViewport] = useState(false)
  const menuBtnRef = useRef<HTMLButtonElement | null>(null)
  const firstLinkRef = useRef<HTMLAnchorElement | null>(null)
  const menuItems = useMemo(() => items ?? DEFAULT_ITEMS, [items])
  const buttonPillClass = [
    "group relative z-10 inline-flex items-center justify-center overflow-hidden",
    "btn-vozes font-secular h-10 w-10 px-0 py-0 sm:h-auto sm:w-auto sm:min-w-[128px] sm:px-6 sm:py-3",
    "sm:backdrop-blur-md",
    "!rounded-none",
    "menu-cursor touch-none",
    "focus:!shadow-none focus-visible:!shadow-none",
  ].join(" ")

  const overlayButtonLabelClass =
    'pointer-events-none relative inline-flex items-center justify-center text-[10px] font-semibold tracking-[0.2em] text-white/55 transition-colors group-hover:text-white/85 [font-family:"Space_Grotesk","Neue_Haas_Grotesk","Helvetica_Neue",Arial,sans-serif]'

  const menuButtonThemeClass = isLight
    ? "!border-[#4c007d]/50 !bg-[#4c007d]/30 hover:!border-[#5a0a91]/30 hover:!bg-[#5a0a91]/10"
    : "!border-white/30 !bg-white/10 hover:!border-white/45 hover:!bg-white/15"

  const menuLabelThemeClass = isLight
    ? 'pointer-events-none relative inline-flex items-center justify-center text-[10px] font-semibold tracking-[0.2em] text-white transition-colors group-hover:text-white [font-family:"Space_Grotesk","Neue_Haas_Grotesk","Helvetica_Neue",Arial,sans-serif]'
    : 'pointer-events-none relative inline-flex items-center justify-center text-[10px] font-semibold tracking-[0.2em] text-white/55 transition-colors group-hover:text-white/85 [font-family:"Space_Grotesk","Neue_Haas_Grotesk","Helvetica_Neue",Arial,sans-serif]'
  const menuIconThemeClass = isLight
    ? 'pointer-events-none relative inline-flex items-center justify-center text-white transition-colors group-hover:text-white'
    : 'pointer-events-none relative inline-flex items-center justify-center text-white/70 transition-colors group-hover:text-white/90'
  const closeButtonClass = [
    "group relative z-10 inline-flex h-10 w-10 items-center justify-center overflow-hidden",
    "btn-vozes px-0 py-0 !rounded-none",
    "menu-cursor touch-none",
    "focus:!shadow-none focus-visible:!shadow-none",
  ].join(" ")

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [open])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const syncViewport = () => setIsMobileViewport(window.innerWidth < 640)
    syncViewport()
    window.addEventListener("resize", syncViewport)
    return () => window.removeEventListener("resize", syncViewport)
  }, [])

  useEffect(() => {
    if (open) {
      const scrollY = window.scrollY
      document.body.style.position = "fixed"
      document.body.style.top = `-${scrollY}px`
      document.body.style.left = "0"
      document.body.style.right = "0"
      document.body.style.width = "100%"
      document.body.style.overflowX = "hidden"
      document.documentElement.style.overflowX = "hidden"
      return
    }

    const y = Math.abs(parseInt(document.body.style.top || "0", 10))
    document.body.style.position = ""
    document.body.style.top = ""
    document.body.style.left = ""
    document.body.style.right = ""
    document.body.style.width = ""
    document.body.style.overflowX = ""
    document.documentElement.style.overflowX = ""
    window.scrollTo(0, y)
    menuBtnRef.current?.focus()
  }, [open])

  useEffect(() => {
    return () => {
      document.body.style.position = ""
      document.body.style.top = ""
      document.body.style.left = ""
      document.body.style.right = ""
      document.body.style.width = ""
      document.body.style.overflowX = ""
      document.documentElement.style.overflowX = ""
    }
  }, [])

  const handleOpen = () => {
    setOpen(true)
  }

  const handleNavigate = (href: string) => {
    const isHash = href.startsWith("#")
    if (!isHash) {
      window.location.href = href
      return
    }

    const id = href.slice(1)
    setOpen(false)

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const target = document.getElementById(id)
        if (!target) return
        target.scrollIntoView({ behavior: "smooth", block: "start" })
        if (window.location.hash !== href) {
          window.history.replaceState(null, "", href)
        }
      })
    })
  }

  const overlayVariants = {
    open: () =>
      isMobileViewport
        ? {
            x: ["100%", "0%"],
            y: 0,
            scaleX: [1, 1],
            opacity: [0, 1],
            transition: {
              duration: 0.42,
              ease: [0.22, 1, 0.36, 1],
            },
          }
        : {
            x: ["100%", "-3%", "2%", "0%"],
            y: 0,
            scaleX: [0.995, 1.01, 0.998, 1],
            opacity: [0, 1, 1, 1],
            filter: ["blur(6px)", "blur(2px)", "blur(1px)", "blur(0px)"],
            transition: {
              duration: 0.9,
              ease: [0.22, 1, 0.36, 1],
            },
          },
    closed: () =>
      isMobileViewport
        ? {
            x: "100%",
            y: 0,
            scaleX: 1,
            opacity: 0,
            transition: {
              duration: 0.28,
              ease: [0.4, 0, 0.2, 1],
            },
          }
        : {
            x: "100%",
            y: 0,
            scaleX: 0.995,
            opacity: 0,
            filter: "blur(6px)",
            transition: {
              duration: 0.38,
              ease: [0.4, 0, 0.2, 1],
            },
          },
  }

  const itemVariants = {
    open: { opacity: 1, x: 0, scale: 1 },
    closed: { opacity: 1, x: 0, scale: 1 },
  }

  const getDescriptor = (label: string) => {
    if (label === "ESTÚDIO") return "SOBRE NÓS / VISÃO CRIATIVA / PROCESSO / BASTIDORES"
    if (label === "PRODUÇÕES") return "CRIAÇÃO / EDIÇÃO / MIXAGEM / FINALIZAÇÃO"
    if (label === "VOZES") return "LOCUTORES / CASTING"
    if (label === "CLIENTES") return "NACIONAIS E INTERNACIONAIS"
    if (label === "NÚMEROS") return "RESULTADOS / WHATSAPP / TELEFONE / E-MAIL"
    return ""
  }

  const getIconSrc = (label: string) => {
    if (label === "INÍCIO") return "/assets/icon/home-svgrepo-com.svg"
    if (label === "ESTÚDIO") return "/assets/icon/speaker-svgrepo-com.svg"
    if (label === "PRODUÇÕES") return "/assets/icon/play-svgrepo-com.svg"
    if (label === "VOZES") return "/assets/icon/microphone-svgrepo-com.svg"
    if (label === "CLIENTES") return "/assets/icon/portfolio-svgrepo-com.svg"
    if (label === "NÚMEROS") return "/assets/icon/file-2-svgrepo-com.svg"
    return null
  }

  useEffect(() => {
    if (!isMobileViewport) return
    const iconSources = DEFAULT_ITEMS.map((entry) => getIconSrc(entry.label)).filter(Boolean) as string[]
    iconSources.forEach((src) => {
      const img = new Image()
      img.src = src
    })
  }, [isMobileViewport])

  return (
    <div className="relative">
      <button
        ref={menuBtnRef}
        type="button"
        className={`${buttonPillClass} ${menuButtonThemeClass}`}
        aria-expanded={open}
        aria-controls="liquid-menu"
        onClick={handleOpen}
      >
        <span className={`${menuIconThemeClass} text-[18px] leading-none sm:hidden`}>☰</span>
        <span className={`${menuLabelThemeClass} hidden sm:inline-flex`}>MENU</span>
      </button>

      {mounted
        ? createPortal(
            <AnimatePresence>
              {open ? (
                <motion.div
                  key="overlay"
                  id="liquid-menu"
                  className="fixed inset-0 z-[3000] h-[100svh] w-[100svw] overflow-hidden origin-right will-change-transform"
                  onClick={() => setOpen(false)}
                  initial="closed"
                  animate="open"
                  exit="closed"
                  variants={overlayVariants}
                  style={{ transformOrigin: "100% 0%" }}
                >
                  <div className="absolute inset-0 bg-black/95" />

                  <div
                    className="relative h-full w-full px-8 pt-8 pb-0 sm:px-12 sm:pt-10 sm:pb-0"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <div className="absolute right-8 top-8 z-20 sm:right-12 sm:top-10">
                      <button
                        type="button"
                        className={isMobileViewport ? closeButtonClass : `${buttonPillClass} mb-1 shrink-0`}
                        onClick={() => setOpen(false)}
                        aria-label="Fechar menu"
                      >
                        {isMobileViewport ? (
                          <span className={`${overlayButtonLabelClass} text-[16px] !tracking-[0.08em] text-white/90`}>X</span>
                        ) : (
                          <span className={overlayButtonLabelClass}>FECHAR</span>
                        )}
                      </button>
                    </div>
                    <motion.nav
                      className="flex h-full w-full items-stretch justify-center overflow-y-auto overflow-x-hidden pt-12 sm:pt-0 pb-[max(24px,env(safe-area-inset-bottom))]"
                      aria-label="Menu principal"
                      initial="closed"
                      animate="open"
                      exit="closed"
                    >
                      <div className="flex min-h-0 w-full flex-col justify-start">
                        <motion.ul className="flex h-full w-full flex-col">
                          <div className="-mx-8 h-px w-[calc(100%+4rem)] bg-white/15 sm:-mx-12 sm:w-[calc(100%+6rem)]" />

                          {menuItems.map((item, index) => (
                            <motion.li key={item.href} variants={itemVariants} className="flex min-h-0 flex-1 flex-col justify-center">
                              <div className="flex items-center gap-4">
                                <a
                                  ref={index === 0 ? firstLinkRef : null}
                                  href={item.href}
                                  className="flex-1 select-none py-0 text-left text-[33px] font-semibold tracking-[0.06em] text-white/95 transition hover:translate-x-1 hover:text-white focus:outline-none focus-visible:ring-0 sm:pt-3 sm:pb-2 sm:text-[45px] lg:text-[56px] font-secular"
                                  onClick={(event) => {
                                    event.preventDefault()
                                    handleNavigate(item.href)
                                  }}
                                >
                                  <span className={isMobileViewport ? "flex items-center gap-4 text-left whitespace-nowrap" : "flex flex-wrap items-baseline gap-4 text-left"}>
                                    {getIconSrc(item.label) ? (
                                      <span className="inline-flex w-[0.95em] items-center justify-start">
                                        <img
                                          src={getIconSrc(item.label) || ""}
                                          alt=""
                                          aria-hidden="true"
                                          className={`object-contain brightness-0 invert ${
                                            item.label === "INÍCIO" ? "h-[0.65em] w-[0.65em]" : "h-[0.8em] w-[0.8em]"
                                          }`}
                                          draggable={false}
                                        />
                                      </span>
                                    ) : null}
                                    <span>{item.label}</span>
                                    {!isMobileViewport && getDescriptor(item.label) ? (
                                      <>
                                        <span className="font-semibold text-white/70">/</span>
                                        <span className="text-[calc(0.47em)] font-semibold tracking-[0.18em] text-white/70">
                                          {getDescriptor(item.label)}
                                        </span>
                                      </>
                                    ) : null}
                                  </span>
                                </a>
                              </div>

                              <div className="-mx-8 h-px w-[calc(100%+4rem)] bg-white/15 sm:-mx-12 sm:w-[calc(100%+6rem)]" />
                            </motion.li>
                          ))}
                        </motion.ul>
                      </div>
                    </motion.nav>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>,
            document.body
          )
        : null}
    </div>
  )
}
