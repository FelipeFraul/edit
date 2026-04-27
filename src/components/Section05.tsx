import React, { useEffect, useMemo, useRef, useState } from "react"
import type { AdminContent } from "../admin/types"

type StatItem = {
  value: string
  title: string
  description: string
}

type BrandItem = {
  id: string
  name: string
  isotipoSrc?: string
  logoScale?: number
  secondaryIsotipoSrc?: string
  secondaryLogoScale?: number
}

type AudioItem = {
  title: string
  src: string
}

export const SAVED_BIG_NUMBERS_STATS: StatItem[] = [
  { value: "+150", title: "VOZES PROFISSIONAIS", description: "Locutores no Casting. Transmite robustez e variedade." },
  { value: "+20", title: "ESTADOS DO BRASIL", description: "Cobertura Regional. Mostra força regionalista real, não genérica." },
  { value: "+12", title: "IDIOMAS", description: "Idiomas Disponíveis. Eleva percepção internacional." },
  { value: "+3.000", title: "PRODUÇÕES", description: "Projetos Entregues. Prova social e experiência prática." },
]

const NAV_TILE_PREV: BrandItem = {
  id: "__brands-prev__",
  name: "Marcas anteriores",
  isotipoSrc: "/assets/icon/left-2-svgrepo-com.svg",
  logoScale: 1.25,
}

const NAV_TILE_NEXT: BrandItem = {
  id: "__brands-next__",
  name: "Próximas marcas",
  isotipoSrc: "/assets/icon/right-2-svgrepo-com.svg",
  logoScale: 1.25,
}

type Section05Props = {
  content?: AdminContent["section05"]
}

const withQueryParams = (rawUrl: string, params: Record<string, string>) => {
  try {
    const url = new URL(rawUrl)
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value))
    return url.toString()
  } catch {
    return rawUrl
  }
}

const Section05: React.FC<Section05Props> = ({ content }) => {
  const ACTIVE_ICON_FILTER =
    "invert(10%) sepia(97%) saturate(4544%) hue-rotate(277deg) brightness(83%) contrast(123%)"
  const MEDIA_ACCENT = "#4c007d"
  const AUDIO_SLOT_COUNT = 6
  const PREV_BRANDS_ID = NAV_TILE_PREV.id
  const NEXT_BRANDS_ID = NAV_TILE_NEXT.id
  const BRANDS_PER_PAGE = 7
  const sectionRef = useRef<HTMLElement | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const pendingVideoSeekRef = useRef<number | null>(null)
  const shouldAutoplayNextTrackRef = useRef(false)
  const [isVisible, setIsVisible] = useState(false)
  const [selectedBrandId, setSelectedBrandId] = useState("")
  const [brandPageIndex, setBrandPageIndex] = useState(0)
  const [trackIndex, setTrackIndex] = useState(0)
  const [logoSwapTick, setLogoSwapTick] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [activeControl, setActiveControl] = useState<"prev" | "play" | "pause" | "stop" | "next" | null>("stop")

  useEffect(() => {
    const target = sectionRef.current
    if (!target) return

    const rootElement = target.closest("main") as HTMLElement | null
    const hasScrollableRoot =
      !!rootElement && (rootElement.scrollHeight > rootElement.clientHeight || rootElement.scrollWidth > rootElement.clientWidth)
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry?.isIntersecting && (entry?.intersectionRatio ?? 0) < 0.08) return
        setIsVisible(true)
        observer.unobserve(entry.target)
      },
      { threshold: [0.08, 0.2], root: hasScrollableRoot ? rootElement : null }
    )

    observer.observe(target)
    return () => observer.disconnect()
  }, [])

  const brands = useMemo(() => {
    return (content?.brands ?? [])
      .filter((brand) => brand.is_active && !brand.deleted_at)
      .sort((a, b) => a.order_index - b.order_index)
      .map((brand) => ({
        id: brand.id,
        name: brand.name || "SEM NOME",
        isotipoSrc: brand.logo || undefined,
        logoScale: brand.logoScale ?? 1,
        secondaryIsotipoSrc:
          brand.secondaryLogo && brand.secondaryLogo !== brand.logo ? brand.secondaryLogo : undefined,
        secondaryLogoScale: brand.secondaryLogoScale ?? brand.logoScale ?? 1,
      }))
  }, [content?.brands])

  const paginationBrands = brands
  const totalBrandPages = Math.max(1, Math.ceil(paginationBrands.length / BRANDS_PER_PAGE))
  const currentPageBrands = useMemo(() => {
    if (!paginationBrands.length) return []
    const start = brandPageIndex * BRANDS_PER_PAGE
    return paginationBrands.slice(start, start + BRANDS_PER_PAGE)
  }, [paginationBrands, brandPageIndex])

  const visibleBrands = useMemo(() => {
    const grid: BrandItem[] = []
    if (currentPageBrands[0]) grid.push(currentPageBrands[0])
    if (currentPageBrands[1]) grid.push(currentPageBrands[1])
    if (currentPageBrands[2]) grid.push(currentPageBrands[2])
    if (currentPageBrands[3]) {
      grid.push(NAV_TILE_PREV)
      grid.push(currentPageBrands[3])
      grid.push(NAV_TILE_NEXT)
    }
    if (currentPageBrands[4]) grid.push(currentPageBrands[4])
    if (currentPageBrands[5]) grid.push(currentPageBrands[5])
    if (currentPageBrands[6]) grid.push(currentPageBrands[6])
    return grid
  }, [currentPageBrands])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setLogoSwapTick((prev) => prev + 1)
    }, 2200)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (brandPageIndex < totalBrandPages) return
    setBrandPageIndex(Math.max(0, totalBrandPages - 1))
  }, [brandPageIndex, totalBrandPages])

  const selectedBrand = paginationBrands.find((brand) => brand.id === selectedBrandId) ?? null
  const selectedCmsPanel = (content?.panels ?? [])
    .filter((panel) => panel.is_active && !panel.deleted_at)
    .find((panel) => panel.brand_id === selectedBrand?.id)
  const panelVideoSrc = selectedCmsPanel?.videoSrc?.trim() ?? ""
  const panelVideoEmbedSrc = useMemo(() => {
    if (!panelVideoSrc) return ""
    if (panelVideoSrc.includes("player.vimeo.com")) {
      return withQueryParams(panelVideoSrc, {
        controls: "0",
        title: "0",
        byline: "0",
        portrait: "0",
        dnt: "1",
      })
    }
    if (panelVideoSrc.includes("youtube.com/embed/")) {
      return withQueryParams(panelVideoSrc, {
        controls: "0",
        rel: "0",
        modestbranding: "1",
        playsinline: "1",
        enablejsapi: "1",
      })
    }
    return panelVideoSrc
  }, [panelVideoSrc])
  const videoProvider: "vimeo" | "youtube" | null = useMemo(() => {
    if (!panelVideoEmbedSrc) return null
    if (panelVideoEmbedSrc.includes("player.vimeo.com")) return "vimeo"
    if (panelVideoEmbedSrc.includes("youtube.com/embed/")) return "youtube"
    return null
  }, [panelVideoEmbedSrc])
  const hasVideo = Boolean(panelVideoEmbedSrc)
  const panelCompanyText = selectedCmsPanel?.companyText?.trim() || selectedCmsPanel?.description?.trim() || content?.text || ""
  const tracks: AudioItem[] = (content?.audios ?? [])
    .filter((audio) => audio.is_active && !audio.deleted_at && audio.brand_id === selectedBrand?.id)
    .sort((a, b) => a.order_index - b.order_index)
    .map((audio) => ({
      title: audio.name,
      src: audio.file,
    }))
  const currentTrack = tracks[trackIndex] ?? null
  const hasTracks = tracks.length > 0
  const hasMediaControls = hasTracks || hasVideo
  const voiceType = selectedCmsPanel?.voiceType ?? ""

  const postVideoMessage = (payload: unknown) => {
    const frame = iframeRef.current?.contentWindow
    if (!frame) return
    frame.postMessage(payload, "*")
  }

  const requestVideoSeek = (seconds: number) => {
    if (!videoProvider) return
    if (videoProvider === "vimeo") {
      pendingVideoSeekRef.current = seconds
      postVideoMessage({ method: "getCurrentTime" })
      return
    }
    pendingVideoSeekRef.current = seconds
    postVideoMessage(JSON.stringify({ event: "command", func: "getCurrentTime", args: [] }))
  }

  const controlVideo = (action: "play" | "pause" | "stop" | "seekBack" | "seekForward") => {
    if (!videoProvider) return false
    if (videoProvider === "vimeo") {
      if (action === "play") postVideoMessage({ method: "play" })
      if (action === "pause") postVideoMessage({ method: "pause" })
      if (action === "stop") {
        postVideoMessage({ method: "pause" })
        postVideoMessage({ method: "setCurrentTime", value: 0 })
      }
      if (action === "seekBack") requestVideoSeek(-10)
      if (action === "seekForward") requestVideoSeek(10)
      return true
    }

    if (action === "play") postVideoMessage(JSON.stringify({ event: "command", func: "playVideo", args: [] }))
    if (action === "pause") postVideoMessage(JSON.stringify({ event: "command", func: "pauseVideo", args: [] }))
    if (action === "stop") {
      postVideoMessage(JSON.stringify({ event: "command", func: "pauseVideo", args: [] }))
      postVideoMessage(JSON.stringify({ event: "command", func: "seekTo", args: [0, true] }))
    }
    if (action === "seekBack") requestVideoSeek(-10)
    if (action === "seekForward") requestVideoSeek(10)
    return true
  }

  useEffect(() => {
    if (!videoProvider) return
    const onMessage = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) return
      let data: unknown = event.data
      if (typeof data === "string") {
        try {
          data = JSON.parse(data)
        } catch {
          return
        }
      }
      if (!data || typeof data !== "object") return

      if (videoProvider === "vimeo") {
        const payload = data as { method?: string; value?: number }
        if (payload.method === "getCurrentTime" && typeof payload.value === "number" && pendingVideoSeekRef.current !== null) {
          const nextTime = Math.max(0, payload.value + pendingVideoSeekRef.current)
          pendingVideoSeekRef.current = null
          postVideoMessage({ method: "setCurrentTime", value: nextTime })
        }
        return
      }

      const payload = data as { event?: string; info?: { currentTime?: number } }
      if (payload.event === "infoDelivery" && typeof payload.info?.currentTime === "number" && pendingVideoSeekRef.current !== null) {
        const nextTime = Math.max(0, payload.info.currentTime + pendingVideoSeekRef.current)
        pendingVideoSeekRef.current = null
        postVideoMessage(JSON.stringify({ event: "command", func: "seekTo", args: [nextTime, true] }))
      }
    }

    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [videoProvider])

  useEffect(() => {
    setTrackIndex(0)
    setIsPlaying(false)
    setActiveControl("stop")
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
  }, [selectedBrandId])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    if (!currentTrack) {
      audio.removeAttribute("src")
      audio.load()
      return
    }
    audio.src = currentTrack.src
    audio.load()
    if (isPlaying || shouldAutoplayNextTrackRef.current) {
      shouldAutoplayNextTrackRef.current = false
      void audio.play().catch(() => setIsPlaying(false))
    } else {
      audio.pause()
    }
  }, [currentTrack, isPlaying])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onPlaying = () => {
      setIsPlaying(true)
      setActiveControl("play")
    }

    const onPause = () => {
      setIsPlaying(false)
    }

    const onEnded = () => {
      if (!tracks.length) return
      setTrackIndex((prev) => (prev + 1) % tracks.length)
      setIsPlaying(true)
      shouldAutoplayNextTrackRef.current = true
    }

    audio.addEventListener("playing", onPlaying)
    audio.addEventListener("pause", onPause)
    audio.addEventListener("ended", onEnded)
    return () => {
      audio.removeEventListener("playing", onPlaying)
      audio.removeEventListener("pause", onPause)
      audio.removeEventListener("ended", onEnded)
    }
  }, [tracks])

  const handlePlay = () => {
    if (hasTracks) {
      setIsPlaying(true)
    } else if (hasVideo) {
      controlVideo("play")
      setIsPlaying(true)
    } else {
      return
    }
    setActiveControl("play")
  }

  const handlePause = () => {
    if (hasTracks) {
      setIsPlaying(false)
    } else if (hasVideo) {
      controlVideo("pause")
      setIsPlaying(false)
    } else {
      return
    }
    setActiveControl("pause")
  }

  const handleStop = () => {
    if (hasTracks) {
      setIsPlaying(false)
      setTrackIndex(0)
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }
    } else if (hasVideo) {
      controlVideo("stop")
      setIsPlaying(false)
    } else {
      return
    }
    setActiveControl("stop")
  }

  const handlePrev = () => {
    if (hasTracks) {
      setIsPlaying(false)
      setTrackIndex((prev) => (prev - 1 + tracks.length) % tracks.length)
      shouldAutoplayNextTrackRef.current = true
    } else if (hasVideo) {
      controlVideo("seekBack")
    } else {
      return
    }
    setActiveControl("prev")
  }

  const handleNext = () => {
    if (hasTracks) {
      setIsPlaying(false)
      setTrackIndex((prev) => (prev + 1) % tracks.length)
      shouldAutoplayNextTrackRef.current = true
    } else if (hasVideo) {
      controlVideo("seekForward")
    } else {
      return
    }
    setActiveControl("next")
  }

  const handleBrandSelect = (brand: BrandItem) => {
    if (brand.id === PREV_BRANDS_ID || brand.id === NEXT_BRANDS_ID) {
      const nextPageIndex =
        brand.id === NEXT_BRANDS_ID
          ? (brandPageIndex + 1) % totalBrandPages
          : (brandPageIndex - 1 + totalBrandPages) % totalBrandPages
      setBrandPageIndex(nextPageIndex)
      const firstBrandInPage = paginationBrands[nextPageIndex * BRANDS_PER_PAGE]
      if (firstBrandInPage) setSelectedBrandId(firstBrandInPage.id)
      return
    }
    setSelectedBrandId(brand.id)
  }

  return (
    <section
      ref={sectionRef}
      id="secao-05"
      data-header-theme="light"
      className={`relative isolate h-auto overflow-visible sm:h-[100svh] sm:snap-start sm:snap-always sm:overflow-hidden ${isVisible ? "s05-visible" : ""}`}
    >
      <div
        className="s05-fluid-bg absolute inset-0"
        aria-hidden="true"
        style={{
          backgroundColor: "#ffffff",
          backgroundImage: `
            radial-gradient(62% 56% at 12% 18%, rgba(23,26,74,0.32), transparent 66%),
            radial-gradient(56% 50% at 84% 20%, rgba(76,0,125,0.28), transparent 64%),
            radial-gradient(58% 54% at 24% 82%, rgba(23,26,74,0.26), transparent 68%),
            radial-gradient(54% 50% at 82% 84%, rgba(76,0,125,0.24), transparent 66%),
            linear-gradient(180deg, #ffffff 0%, #f8f8ff 48%, #f2f1fb 100%)
          `,
          mixBlendMode: "normal",
          animation: "sec02Fluid 3s ease-in-out infinite",
          opacity: 0.9,
          transformOrigin: "center",
          willChange: "transform, filter",
        }}
      />

      <div
        className="s05-grain-bg absolute inset-0"
        aria-hidden="true"
        style={{
          backgroundImage: "radial-gradient(rgba(0,0,0,0.08) 0.7px, transparent 0.7px)",
          backgroundSize: "3px 3px",
          opacity: 0.2,
          animation: "s05GrayGrain 5s steps(8, end) infinite",
          mixBlendMode: "soft-light",
          willChange: "transform",
        }}
      />

      <div className="relative z-10 m-0 grid h-auto grid-rows-[auto_1fr] rounded-none px-6 sm:m-4 sm:h-[calc(100svh-2rem)] sm:rounded-[28px] sm:px-12 lg:px-16">
        <div className="flex items-center justify-center px-6 pt-12 sm:px-12 sm:pt-28 lg:px-16">
          <span
            className="s05-enter inline-flex items-center rounded-none border border-black/30 px-4 py-2 text-xs font-thin tracking-[0.3em] text-black/80 font-barlow-thin"
            style={{ animationDelay: "80ms" }}
          >
            OS CLIENTES
          </span>
        </div>

        <div className="mx-auto mt-9 flex w-full max-w-[1800px] items-start px-0 pb-12 sm:mt-0 sm:items-center sm:pb-12 lg:pb-14">
          <div className="grid w-full grid-cols-1 items-start gap-8 xl:grid-cols-[minmax(0,450px)_minmax(0,1fr)] xl:gap-10">
            <div className="s05-enter flex max-w-[450px] flex-col justify-center self-center" style={{ animationDelay: "180ms" }}>
              <h2 className="font-secular mt-0 text-[72px] font-semibold uppercase leading-[0.92] tracking-[-0.02em] text-black">
                {selectedBrand?.name ?? content?.title ?? ""}
              </h2>
              <p className="font-barlow-thin mt-10 max-w-[450px] text-[18px] leading-[1.2] text-black/85 sm:text-[18px] lg:text-[18px]">
                {panelCompanyText}
              </p>
            </div>

            <div className="s05-enter xl:h-[400px]" style={{ animationDelay: "260ms" }}>
              <div className="grid h-full grid-cols-1 gap-4 xl:h-[400px] xl:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
                <div className="grid h-full grid-cols-3 grid-rows-3 gap-3">
                  {visibleBrands.map((brand) => {
                    const isSelected = selectedBrandId === brand.id
                    const isNavTile = brand.id === PREV_BRANDS_ID || brand.id === NEXT_BRANDS_ID
                    const isNavDisabled = isNavTile && totalBrandPages <= 1
                    const showSecondary = Boolean(brand.secondaryIsotipoSrc) && logoSwapTick % 2 === 1
                    return (
                      <button
                        key={brand.id}
                        type="button"
                        onClick={() => handleBrandSelect(brand)}
                        disabled={isNavDisabled}
                        className={`group flex min-h-[96px] cursor-pointer items-center justify-center border p-3 transition ${
                          isSelected
                            ? "border-[#4c007d] bg-[#4c007d]"
                            : "border-black/35 bg-transparent hover:border-[#171a4a] hover:bg-[#171a4a]"
                        } ${isNavDisabled ? "cursor-default opacity-45 hover:border-black/35 hover:bg-transparent" : ""}`}
                        aria-label={`Selecionar ${brand.name}`}
                      >
                        {brand.isotipoSrc ? (
                          <span className="relative block h-12 w-12">
                            <img
                              src={brand.isotipoSrc}
                              alt={brand.name}
                              className={`absolute inset-0 h-12 w-12 object-contain transition-all duration-500 ${
                                isSelected ? "brightness-0 invert" : "brightness-0 group-hover:brightness-0 group-hover:invert"
                              } ${showSecondary ? "opacity-0" : "opacity-100"}`}
                              style={{ transform: `scale(${brand.logoScale ?? 1})` }}
                              loading="lazy"
                              draggable={false}
                            />
                            {brand.secondaryIsotipoSrc ? (
                              <img
                                src={brand.secondaryIsotipoSrc}
                                alt={brand.name}
                                className={`absolute inset-0 h-12 w-12 object-contain transition-all duration-500 ${
                                  isSelected ? "brightness-0 invert" : "brightness-0 group-hover:brightness-0 group-hover:invert"
                                } ${showSecondary ? "opacity-100" : "opacity-0"}`}
                                style={{ transform: `scale(${brand.secondaryLogoScale ?? brand.logoScale ?? 1})` }}
                                loading="lazy"
                                draggable={false}
                              />
                            ) : null}
                          </span>
                        ) : (
                          <span
                            className={`font-barlow-thin text-[11px] uppercase tracking-[0.2em] ${
                              isSelected ? "text-white" : "text-black/60 group-hover:text-white"
                            }`}
                          >
                            isotipo
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>

                <div className="flex h-full min-h-0 flex-col gap-3 border border-black/35 bg-transparent p-3">
                  <div className="relative min-h-0 flex-1 overflow-hidden border border-black/25 bg-white/35">
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0"
                      style={{
                        background:
                          "radial-gradient(120% 90% at 85% -10%, rgba(122,78,173,0.16), transparent 55%), radial-gradient(120% 90% at 10% 110%, rgba(122,78,173,0.1), transparent 60%)",
                      }}
                    />
                    <div className="relative h-full w-full">
                      {panelVideoEmbedSrc ? (
                        <iframe
                          ref={iframeRef}
                          title={`Video ${selectedBrand?.name ?? "marca"}`}
                          src={panelVideoEmbedSrc}
                          className="absolute left-1/2 top-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2 scale-[1.04] border-0"
                          allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                          allowFullScreen
                          loading="lazy"
                          referrerPolicy="strict-origin-when-cross-origin"
                        />
                      ) : (
                        <div className="h-full w-full" />
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-2">
                    {Array.from({ length: AUDIO_SLOT_COUNT }).map((_, idx) => {
                      const isFilled = idx < tracks.length
                      const isActive = hasTracks && idx === trackIndex
                      return (
                        <span
                          key={`${selectedBrand?.id ?? "no-brand"}-audio-slot-${idx}`}
                          className="h-2.5 w-2.5"
                          style={{
                            backgroundColor: isActive ? MEDIA_ACCENT : "#000000",
                            opacity: isFilled ? (isActive ? 1 : 0.45) : 0.1,
                          }}
                          aria-hidden="true"
                        />
                      )
                    })}
                  </div>

                  <div className="border border-black/25 bg-transparent p-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={handlePrev}
                        disabled={!hasMediaControls}
                        className="inline-flex h-9 w-9 appearance-none items-center justify-center border-0 bg-transparent p-0 outline-none transition disabled:opacity-40"
                        aria-label="Voltar áudio"
                      >
                        <img
                          src="/assets/icon/left-2-svgrepo-com.svg"
                          alt=""
                          aria-hidden="true"
                          className="h-4 w-4"
                          style={activeControl === "prev" ? { filter: ACTIVE_ICON_FILTER } : undefined}
                        />
                      </button>
                      <button
                        type="button"
                        onClick={handlePlay}
                        disabled={!hasMediaControls || isPlaying}
                        className="inline-flex h-9 w-9 appearance-none items-center justify-center border-0 bg-transparent p-0 outline-none transition disabled:opacity-60"
                        aria-label="Play áudio"
                      >
                        <img
                          src="/assets/icon/play-svgrepo-com.svg"
                          alt=""
                          aria-hidden="true"
                          className="h-4 w-4"
                          style={activeControl === "play" ? { filter: ACTIVE_ICON_FILTER } : undefined}
                        />
                      </button>
                      <button
                        type="button"
                        onClick={handlePause}
                        disabled={!hasMediaControls || !isPlaying}
                        className="inline-flex h-9 w-9 appearance-none items-center justify-center border-0 bg-transparent p-0 outline-none transition disabled:opacity-60"
                        aria-label="Pausar áudio"
                      >
                        <img
                          src="/assets/icon/pause-svgrepo-com.svg"
                          alt=""
                          aria-hidden="true"
                          className="h-4 w-4"
                          style={activeControl === "pause" ? { filter: ACTIVE_ICON_FILTER } : undefined}
                        />
                      </button>
                      <button
                        type="button"
                        onClick={handleStop}
                        disabled={!hasMediaControls}
                        className="inline-flex h-9 w-9 appearance-none items-center justify-center border-0 bg-transparent p-0 outline-none transition disabled:opacity-40"
                        aria-label="Parar áudio"
                      >
                        <img
                          src="/assets/icon/stop-svgrepo-com.svg"
                          alt=""
                          aria-hidden="true"
                          className="h-4 w-4"
                          style={activeControl === "stop" ? { filter: ACTIVE_ICON_FILTER } : undefined}
                        />
                      </button>
                      <button
                        type="button"
                        onClick={handleNext}
                        disabled={!hasMediaControls}
                        className="inline-flex h-9 w-9 appearance-none items-center justify-center border-0 bg-transparent p-0 outline-none transition disabled:opacity-40"
                        aria-label="Próximo áudio"
                      >
                        <img
                          src="/assets/icon/right-2-svgrepo-com.svg"
                          alt=""
                          aria-hidden="true"
                          className="h-4 w-4"
                          style={activeControl === "next" ? { filter: ACTIVE_ICON_FILTER } : undefined}
                        />
                      </button>
                    </div>
                  </div>

                  <p className="font-barlow-thin text-center text-[11px] uppercase tracking-[0.16em] text-black/70">
                    {currentTrack ? currentTrack.title : voiceType}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <audio ref={audioRef} preload="metadata" />

      <style>{`
        @keyframes s05GrayGrain {
          0% { transform: translate3d(0, 0, 0); }
          25% { transform: translate3d(-1%, 0.6%, 0); }
          50% { transform: translate3d(0.7%, -0.8%, 0); }
          75% { transform: translate3d(-0.4%, 0.9%, 0); }
          100% { transform: translate3d(0, 0, 0); }
        }
        @keyframes s05BlurIn {
          0% { opacity: 0; transform: translateX(-26px); filter: blur(10px); }
          100% { opacity: 1; transform: translateX(0); filter: blur(0); }
        }
        .s05-enter {
          opacity: 0;
          transform: translateX(-26px);
          filter: blur(10px);
          pointer-events: none;
        }
        .s05-visible .s05-enter {
          animation: s05BlurIn 760ms cubic-bezier(0.22, 0.9, 0.22, 1) forwards;
          will-change: transform, opacity, filter;
          pointer-events: auto;
        }
        @media (max-width: 639px) {
          .s05-fluid-bg,
          .s05-grain-bg,
          .s05-visible .s05-enter {
            animation: none !important;
          }
          .s05-enter {
            opacity: 1;
            transform: none;
            filter: none;
            pointer-events: auto;
          }
        }
      `}</style>
    </section>
  )
}

export default Section05
