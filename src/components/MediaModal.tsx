import React, { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { createPortal } from "react-dom"
import type { MediaItem } from "../heroVariants"

type MediaModalProps = {
  open: boolean
  item?: MediaItem | null
  onClose: () => void
  onPrev?: () => void
  onNext?: () => void
}

export default function MediaModal({
  open,
  item,
  onClose,
  onPrev,
  onNext,
}: MediaModalProps) {
  const [mounted, setMounted] = useState(false)
  const closeBtnRef = useRef<HTMLButtonElement | null>(null)
  const [hasScrolled, setHasScrolled] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [hasStarted, setHasStarted] = useState(false)

  const texto = `
Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. 
Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. 
`
  const compactText = texto.replace(/\s+/g, " ").trim()
  const sentences = compactText
    .split(".")
    .map((s) => s.trim())
    .filter(Boolean)
  const spaced = sentences.map((sentence, i) => (
    <React.Fragment key={`s-${i}`}>
      {sentence}.
      <br />
      <span className="block h-[16px]" aria-hidden="true" />
    </React.Fragment>
  ))

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth
    document.body.style.overflow = "hidden"
    document.body.style.paddingRight = scrollbarWidth
      ? `${scrollbarWidth}px`
      : ""
    const t = window.setTimeout(() => closeBtnRef.current?.focus(), 160)
    return () => window.clearTimeout(t)
  }, [open])

  useEffect(() => {
    if (!open) {
      document.body.style.overflow = ""
      document.body.style.paddingRight = ""
    }
  }, [open])

  useEffect(() => {
    return () => {
      document.body.style.overflow = ""
      document.body.style.paddingRight = ""
    }
  }, [])

  const isVimeo = Boolean(item?.videoSrc?.includes("vimeo.com"))
  const vimeoPlayerId = "media-modal-player"
  const normalizeVimeoUrl = (raw?: string, autoplay = 0, muted = 1) => {
    if (!raw) return ""
    try {
      const url = new URL(raw)
      url.searchParams.delete("autoplay")
      url.searchParams.set("autoplay", String(autoplay))
      url.searchParams.set("muted", String(muted))
      url.searchParams.set("controls", "0")
      url.searchParams.set("playsinline", "1")
      url.searchParams.set("api", "1")
      url.searchParams.set("player_id", vimeoPlayerId)
      url.searchParams.set("title", "0")
      url.searchParams.set("byline", "0")
      url.searchParams.set("portrait", "0")
      return url.toString()
    } catch {
      const sep = raw.includes("?") ? "&" : "?"
      return `${raw}${sep}autoplay=${autoplay}&muted=${muted}&controls=0&title=0&byline=0&portrait=0&playsinline=1&api=1&player_id=${vimeoPlayerId}`
    }
  }

  const vimeoSrcBase = normalizeVimeoUrl(item?.videoSrc, 1, 1)
  const [vimeoSrc, setVimeoSrc] = useState(vimeoSrcBase)
  const vimeoIframeRef = useRef<HTMLIFrameElement | null>(null)
  const [vimeoReady, setVimeoReady] = useState(false)
  const [vimeoPrewarmed, setVimeoPrewarmed] = useState(false)

  useEffect(() => {
    setIsPlaying(false)
    setVimeoSrc(vimeoSrcBase)
    setHasStarted(false)
    setVimeoReady(false)
    setVimeoPrewarmed(false)
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
    }
  }, [vimeoSrcBase, open])

  const postVimeo = (method: string, value?: unknown) => {
    const target = vimeoIframeRef.current?.contentWindow
    if (!target) return
    target.postMessage({ method, value }, "*")
  }

  useEffect(() => {
    if (!isVimeo || !vimeoReady || vimeoPrewarmed) return
    postVimeo("play")
    const t = window.setTimeout(() => {
      postVimeo("pause")
      postVimeo("setVolume", 0)
      postVimeo("setMuted", true)
      setVimeoPrewarmed(true)
    }, 220)
    return () => window.clearTimeout(t)
  }, [isVimeo, vimeoReady, vimeoPrewarmed])

  const handlePlay = async () => {
    if (isVimeo) {
      postVimeo("setMuted", false)
      postVimeo("setVolume", 1)
      postVimeo("play")
      setIsPlaying(true)
      setHasStarted(true)
      return
    }
    if (videoRef.current) {
      try {
        videoRef.current.muted = false
        await videoRef.current.play()
        setIsPlaying(true)
        setHasStarted(true)
      } catch {
        setIsPlaying(false)
      }
    }
  }

  const content = (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[2000] bg-black/70 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="relative h-full w-full overflow-y-auto px-6 py-10 sm:px-10"
            onClick={(event: React.MouseEvent<HTMLDivElement>) => event.stopPropagation()}
            onScroll={(event: React.UIEvent<HTMLDivElement>) => {
              const target = event.currentTarget
              setHasScrolled(target.scrollTop > 8)
            }}
          >
            <button
              ref={closeBtnRef}
              type="button"
              aria-label="Fechar modal"
              className="btn-vozes !rounded-none font-secular absolute right-6 top-6 sm:right-10 sm:top-8"
              onClick={onClose}
            >
              FECHAR
            </button>

            <div className="mx-auto mt-0 w-full max-w-6xl rounded-[32px] bg-black/60 px-6 pb-6 pt-0 backdrop-blur-xl sm:px-8 sm:pb-8 sm:pt-0">
              <div className="flex w-full flex-col items-center gap-6">
                <motion.div
                  className="w-full overflow-hidden rounded-2xl border border-white/10 bg-black/90 shadow-[0_30px_90px_rgba(0,0,0,0.75)]"
                  initial={{ opacity: 0, y: -40 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                >
                <div className="relative w-full overflow-hidden bg-black/80">
                    {item?.videoSrc ? (
                      isVimeo ? (
                        <iframe
                          ref={vimeoIframeRef}
                          id={vimeoPlayerId}
                          className="relative z-0 aspect-[21/9] h-auto w-full"
                          src={vimeoSrc}
                          title={item.title ?? "Video"}
                          allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                          allowFullScreen
                          onLoad={() => setVimeoReady(true)}
                        />
                      ) : hasStarted ? (
                        <video
                          ref={videoRef}
                          className="relative z-0 aspect-[21/9] h-auto w-full"
                          src={item.videoSrc}
                          poster={item.poster}
                          playsInline
                          preload="metadata"
                        />
                      ) : (
                        <div className="flex aspect-[21/9] items-center justify-center bg-black/90 text-xs font-semibold tracking-[0.3em] text-white/60" />
                      )
                    ) : (
                      <div className="flex aspect-[21/9] items-center justify-center bg-black/90 text-xs font-semibold tracking-[0.3em] text-white/60">
                        MIDIA EM BREVE
                      </div>
                    )}

                    {!isPlaying ? (
                      <div className="absolute inset-0 z-10 bg-black/90" />
                    ) : null}

                    {!isPlaying ? (
                      <div className="absolute inset-0 z-30 flex items-center justify-center">
                        <button
                          type="button"
                          className="btn-vozes font-secular"
                          onClick={handlePlay}
                        >
                          PLAY
                        </button>
                      </div>
                    ) : null}

                    {onPrev ? (
                      <button
                        type="button"
                        aria-label="Anterior"
                        onClick={onPrev}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-4xl text-white/20 transition hover:text-white/60"
                    >
                      〈
                    </button>
                  ) : null}
                  {onNext ? (
                    <button
                      type="button"
                      aria-label="Próximo"
                      onClick={onNext}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-4xl text-white/20 transition hover:text-white/60"
                    >
                      〉
                    </button>
                  ) : null}
                  </div>
                </motion.div>

                <div className="w-full max-w-6xl pb-6">
                  <div className="mt-10 flex w-full flex-col gap-8 text-left sm:flex-row sm:gap-12">
                    <div className="w-full sm:w-[40%]">
                      <div className="text-[40px] leading-tight font-thin tracking-[0.06em] text-white font-secular">
                        {item?.title ?? ""}
                      </div>
                      <div className="mt-6 grid grid-cols-1 gap-6 text-left text-[11px] uppercase tracking-[0.3em] text-white/70">
                        <div>
                          <div className="text-[9px] text-white/40">QUEM</div>
                          <div className="mt-2 text-[12px] tracking-[0.25em] text-white uppercase">
                            {item?.who ?? ""}
                          </div>
                        </div>
                        <div>
                          <div className="text-[9px] text-white/40">QUANDO</div>
                          <div className="mt-2 text-[12px] tracking-[0.25em] text-white uppercase">
                            {item?.when ?? ""}
                          </div>
                        </div>
                        <div>
                          <div className="text-[9px] text-white/40">CATEGORIA</div>
                          <div className="mt-2 text-[12px] tracking-[0.25em] text-white uppercase">
                            {item?.category ?? ""}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="w-full sm:w-[60%]">
                      <blockquote className="font-barlow-thin border-l border-white/40 pl-6 text-[1rem] leading-7 tracking-[0.1em] text-white/70">
                        {spaced}
                      </blockquote>
                    </div>
                  </div>
                  <div className="mt-10 flex flex-wrap gap-3">
                    {[
                      { title: "RESPONSÁVEL", value: "Felipe Fraul" },
                      { title: "AGÊNCIA", value: "Thruster" },
                      { title: "PROD. VÍDEO", value: "O2 filmes" },
                      { title: "PROD. ÁUDIO", value: "Edit Group" },
                      { title: "LOCUTOR", value: "Bruno Rochel" },
                      { title: "OPERADOR", value: "Felipe Fraul" },
                    ].map((badge) => (
                      <div
                        key={badge.title}
                          className="relative inline-flex items-center rounded-none border border-white/40 bg-transparent px-4 py-2 text-[9px] font-semibold tracking-[0.4em] text-white/70 backdrop-blur-sm whitespace-nowrap"
                      >
                            <span className="absolute -top-2 left-4 rounded-none bg-black/70 px-2 text-[7px] font-semibold tracking-[0.3em] text-white/40 whitespace-nowrap">
                          {badge.title}
                        </span>
                        <span className="pt-[1px] pr-[10px] uppercase whitespace-nowrap">
                          {badge.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )

  if (!mounted) return null
  return createPortal(content, document.body)
}
