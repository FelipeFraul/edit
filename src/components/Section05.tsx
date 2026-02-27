import React, { useEffect, useRef, useState } from "react"

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

const BRANDS: BrandItem[] = [
  { id: "netshoes", name: "Netshoes", isotipoSrc: "/assets/logotipo/isotipo_netshoes.webp", logoScale: 1 },
  { id: "mcdonalds", name: "Mc Donald's", isotipoSrc: "/assets/logotipo/isotipo_mcdonalds.svg", logoScale: 1.1 },
  { id: "globo", name: "Globo", isotipoSrc: "/assets/logotipo/isotipo_globo.svg", logoScale: 1 },
  { id: "giraffas", name: "Giraffas", isotipoSrc: "/assets/logotipo/isotipo_giraffas.webp", logoScale: 1 },
  { id: "burger-king", name: "Burger King", isotipoSrc: "/assets/logotipo/isotipo_bk.svg", logoScale: 1 },
  { id: "ambev", name: "Ambev", isotipoSrc: "/assets/logotipo/isotipo_ambev.webp", logoScale: 1.35 },
  { id: "sportv", name: "Sportv", isotipoSrc: "/assets/logotipo/isotipo_sportv.webp", logoScale: 0.9 },
  { id: "casas-bahia", name: "Casas Bahia", isotipoSrc: "/assets/logotipo/isotipo_casasbahia.webp", logoScale: 1 },
  { id: "motorola", name: "Motorola", isotipoSrc: "/assets/logotipo/isotipo_motorola.webp", logoScale: 1.08 },
]

const AUDIO_LIBRARY: Record<string, AudioItem[]> = {
  "burger-king": [
    {
      title: "Jovem conversado animado",
      src: "/assets/audios/BURGER KING - JOVEM CONVERSADO ANIMADO (BRUNOROCHEL).mp3",
    },
    {
      title: "Jovem natural",
      src: "/assets/audios/BURGER KING - JOVEM, NATURAL (BRUNOROCHEL).mp3",
    },
  ],
  mcdonalds: [
    {
      title: "Drive jovem natural conversado",
      src: "/assets/audios/MC DONALDS - DRIVE JOVEM, NATURAL CONVERSADO (BRUNOROCHEL) .mp3",
    },
    {
      title: "Natural conversado",
      src: "/assets/audios/MC DONALDS - NATURAL CONVERSADO (BRUNOROCHEL).mp3",
    },
  ],
  netshoes: [
    {
      title: "Jovem conversado",
      src: "/assets/audios/NETSHOES - JOVEM CONVERSADO (BRUNOROCHEL).mp3",
    },
  ],
  "casas-bahia": [
    {
      title: "Varejo feliz hardsell",
      src: "/assets/audios/CASAS BAHIA - VAREJO FELIZ SORRISO HARDSELL.mp3",
    },
  ],
  motorola: [
    {
      title: "Jovem animado natural",
      src: "/assets/audios/MOTOROLA - JOVEM, ANIMADO, NATURAL (BRUNOROCHEL) .mp3",
    },
  ],
  sportv: [],
  globo: [],
  giraffas: [],
  ambev: [],
}

const VOICE_TYPE_BY_BRAND: Record<string, string> = {
  "burger-king": "JOVEM CONVERSADO / NATURAL",
  mcdonalds: "DRIVE JOVEM NATURAL CONVERSADO",
  netshoes: "JOVEM CONVERSADO",
  "casas-bahia": "VAREJO FELIZ / HARDSELL",
  motorola: "JOVEM ANIMADO NATURAL",
  sportv: "LOCUÇÃO ESPORTIVA",
  globo: "INSTITUCIONAL",
  giraffas: "VAREJO CONVERSADO",
  ambev: "PUBLICIDADE NACIONAL",
}

const Section05: React.FC = () => {
  const ACTIVE_ICON_FILTER =
    "invert(10%) sepia(97%) saturate(4544%) hue-rotate(277deg) brightness(83%) contrast(123%)"
  const MEDIA_ACCENT = "#4c007d"
  const AUDIO_SLOT_COUNT = 6
  const sectionRef = useRef<HTMLElement | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const shouldAutoplayNextTrackRef = useRef(false)
  const [isVisible, setIsVisible] = useState(false)
  const [selectedBrandId, setSelectedBrandId] = useState(BRANDS[0].id)
  const [trackIndex, setTrackIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [activeControl, setActiveControl] = useState<"prev" | "play" | "pause" | "stop" | "next" | null>("stop")

  useEffect(() => {
    const target = sectionRef.current
    if (!target) return

    const rootElement = target.closest("main") as HTMLElement | null
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry?.isIntersecting) return
        setIsVisible(true)
        observer.unobserve(entry.target)
      },
      { threshold: 0.25, root: rootElement }
    )

    observer.observe(target)
    return () => observer.disconnect()
  }, [])

  const selectedBrand = BRANDS.find((brand) => brand.id === selectedBrandId) ?? BRANDS[0]
  const tracks = AUDIO_LIBRARY[selectedBrandId] ?? []
  const currentTrack = tracks[trackIndex] ?? null
  const hasTracks = tracks.length > 0
  const voiceType = VOICE_TYPE_BY_BRAND[selectedBrandId] ?? "TIPO DE LOCUÇÃO"

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
    if (!hasTracks) return
    setIsPlaying(true)
    setActiveControl("play")
  }

  const handlePause = () => {
    if (!hasTracks) return
    setIsPlaying(false)
    setActiveControl("pause")
  }

  const handleStop = () => {
    if (!hasTracks) return
    setIsPlaying(false)
    setTrackIndex(0)
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    setActiveControl("stop")
  }

  const handlePrev = () => {
    if (!hasTracks) return
    setIsPlaying(false)
    setTrackIndex((prev) => (prev - 1 + tracks.length) % tracks.length)
    shouldAutoplayNextTrackRef.current = true
    setActiveControl("prev")
  }

  const handleNext = () => {
    if (!hasTracks) return
    setIsPlaying(false)
    setTrackIndex((prev) => (prev + 1) % tracks.length)
    shouldAutoplayNextTrackRef.current = true
    setActiveControl("next")
  }

  return (
    <section
      ref={sectionRef}
      id="secao-05"
      data-header-theme="light"
      className={`relative isolate h-[100svh] snap-start snap-always overflow-hidden ${isVisible ? "s05-visible" : ""}`}
    >
      <div
        className="absolute inset-0"
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
        className="absolute inset-0"
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

      <div className="relative z-10 m-4 grid h-[calc(100svh-2rem)] grid-rows-[auto_1fr] rounded-[28px] px-6 sm:px-12 lg:px-16">
        <div className="flex items-center justify-center px-6 pt-24 sm:px-12 sm:pt-28 lg:px-16">
          <span
            className="s05-enter inline-flex items-center rounded-none border border-black/30 px-4 py-2 text-xs font-thin tracking-[0.3em] text-black/80 font-barlow-thin"
            style={{ animationDelay: "80ms" }}
          >
            OS CLIENTES
          </span>
        </div>

        <div className="mx-auto flex w-full max-w-[1800px] items-center px-0 pb-10 sm:pb-12 lg:pb-14">
          <div className="grid w-full grid-cols-1 items-start gap-8 xl:grid-cols-[minmax(0,450px)_minmax(0,1fr)] xl:gap-10">
            <div className="s05-enter flex max-w-[450px] flex-col justify-center self-center" style={{ animationDelay: "180ms" }}>
              <h2 className="font-secular mt-0 text-[72px] font-semibold uppercase leading-[0.92] tracking-[-0.02em] text-black">
                PARCERIAS
              </h2>
              <p className="font-barlow-thin mt-10 max-w-[450px] text-[18px] leading-[1.2] text-black/85 sm:text-[18px] lg:text-[18px]">
                Trabalhamos com marcas que entendem o poder da voz como estratégia. Nosso casting atende grandes players
                nacionais e internacionais, conectando interpretação, direção criativa e excelência técnica para
                transformar áudio em posicionamento de marca.
              </p>
            </div>

            <div className="s05-enter xl:h-[400px]" style={{ animationDelay: "260ms" }}>
              <div className="grid h-full grid-cols-1 gap-4 xl:h-[400px] xl:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
                <div className="grid h-full grid-cols-3 grid-rows-3 gap-3">
                  {BRANDS.map((brand) => {
                    const isSelected = selectedBrandId === brand.id
                    return (
                      <button
                        key={brand.name}
                        type="button"
                        onClick={() => setSelectedBrandId(brand.id)}
                        className={`group flex min-h-[96px] cursor-pointer items-center justify-center border p-3 transition ${
                          isSelected
                            ? "border-[#4c007d] bg-[#4c007d]"
                            : "border-black/35 bg-transparent hover:border-[#171a4a] hover:bg-[#171a4a]"
                        }`}
                        aria-label={`Selecionar ${brand.name}`}
                      >
                        {brand.isotipoSrc ? (
                          <img
                            src={brand.isotipoSrc}
                            alt={brand.name}
                            className={`h-12 w-12 object-contain transition ${
                              isSelected ? "brightness-0 invert" : "brightness-0 group-hover:brightness-0 group-hover:invert"
                            }`}
                            style={{ transform: `scale(${brand.logoScale ?? 1})` }}
                            loading="lazy"
                            draggable={false}
                          />
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
                  <div className="flex min-h-0 flex-1 items-center justify-center border border-black/25 bg-transparent p-4">
                    <p className="font-secular text-center text-[40px] leading-none text-black">{selectedBrand.name}</p>
                  </div>

                  <div className="flex items-center justify-center gap-2">
                    {Array.from({ length: AUDIO_SLOT_COUNT }).map((_, idx) => {
                      const isFilled = idx < tracks.length
                      const isActive = hasTracks && idx === trackIndex
                      return (
                        <span
                          key={`${selectedBrand.id}-audio-slot-${idx}`}
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
                        disabled={!hasTracks}
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
                        disabled={!hasTracks || isPlaying}
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
                        disabled={!hasTracks || !isPlaying}
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
                        disabled={!hasTracks}
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
                        disabled={!hasTracks}
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
      `}</style>
    </section>
  )
}

export default Section05