import React, { useEffect, useState } from "react"
import { getVariantMedia, type HeroVariant } from "../heroVariants"
import FullscreenMenu from "./FullscreenMenu"
import StageDial from "./StageDial"
import VoicePod from "./VoicePod"
import { useTypewriterWord } from "../hooks/useTypewriterWord"

type FeaturedHeroProps = {
  variant: HeroVariant
  onOpenMedia?: (variant: HeroVariant) => void
  dialValue?: HeroVariant["pos"]
  onDialChange?: (value: number) => void
  onDialPush?: () => void
  showHeader?: boolean
  mobileScrolled?: boolean
  mobileRolloverProgress?: number
  isMobileViewport?: boolean
}

const HERO_HEADLINE_SIZE = {
  mobile: "text-[1.9rem]",
  tablet: "sm:text-8xl md:text-[62px]",
  desktopLocked: "lg:text-7xl",
} as const

const FeaturedHero: React.FC<FeaturedHeroProps> = ({
  variant,
  onOpenMedia,
  dialValue,
  onDialChange,
  onDialPush,
  showHeader = true,
  mobileScrolled = false,
  mobileRolloverProgress = 0,
  isMobileViewport = false,
}) => {
  const [prevVariant, setPrevVariant] = useState(variant)
  const [nextVariant, setNextVariant] = useState(variant)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [transitionToken, setTransitionToken] = useState(0)
  const [voicePodOpen, setVoicePodOpen] = useState(false)
  const [isHeroInView, setIsHeroInView] = useState(true)
  const activeVariant = isTransitioning ? nextVariant : prevVariant
  const showVideo = activeVariant.pos === 0

  const tw = useTypewriterWord({
    words: variant.animatedWords?.length ? variant.animatedWords : [""],
    typeSpeed: 65,
    deleteSpeed: 32,
    holdMs: 900,
    gapMs: 220,
  })

  useEffect(() => {
    if (variant.pos === nextVariant.pos) return
    setPrevVariant(nextVariant)
    setNextVariant(variant)
    setIsTransitioning(true)
    setTransitionToken((n) => n + 1)
    const timeout = setTimeout(() => {
      setPrevVariant(variant)
      setIsTransitioning(false)
    }, 520)
    return () => clearTimeout(timeout)
  }, [variant.pos, nextVariant.pos, variant])

  useEffect(() => {
    if (!showVideo) setVoicePodOpen(false)
  }, [showVideo])

  useEffect(() => {
    const section = document.getElementById("split")
    if (!section) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        setIsHeroInView(entry.isIntersecting && entry.intersectionRatio > 0.35)
      },
      { threshold: [0.2, 0.35, 0.5] }
    )

    observer.observe(section)
    return () => observer.disconnect()
  }, [])

  const renderLayer = (
    layerVariant: HeroVariant,
    isActive: boolean,
    slot: "prev" | "next"
  ) => {
    const layerBgImage =
      isMobileViewport && layerVariant.mobileBgImage
        ? layerVariant.mobileBgImage
        : layerVariant.bgImage
    const layerMedia = getVariantMedia(layerVariant, isMobileViewport)
    const layerDisplayTitle =
      layerVariant.pos === 0 ? layerVariant.title ?? "" : layerMedia.title ?? layerVariant.title ?? ""
    const topLabel =
      layerVariant.topCtaLabel ??
      (layerVariant.pos === 0 ? "AGÊNCIA DE VOZES" : "VER MÍDIA")
    const topHref =
      layerVariant.topCtaHref ??
      (layerVariant.pos === 0 ? "#split" : layerVariant.ctaHref)
    const isMediaCta = topLabel.toUpperCase() === "VER MÍDIA"

    return (
      <div
        key={`${slot}-${layerVariant.pos}-${slot === "next" ? transitionToken : 0}`}
        className={`absolute inset-0 z-10 sm:transition-[opacity,transform,filter] sm:duration-500 sm:ease-out ${
          isActive
            ? "opacity-100 pointer-events-auto sm:translate-y-0 sm:scale-100 sm:blur-0"
            : "opacity-0 pointer-events-none sm:translate-y-1 sm:scale-[1.01] sm:blur-[2px]"
        } ${isActive && isTransitioning ? "hero-layer-enter" : ""}`}
      >
        <div
          className={[
            "absolute inset-0 overflow-hidden",
            layerVariant.pos === 0 ? "bg-transparent" : "bg-[#0b0b0b]",
          ].join(" ")}
          aria-hidden="true"
        >
          {layerVariant.pos !== 0 && layerBgImage ? (
            <img
              src={layerBgImage}
              alt=""
              className="hero-bg-shift h-full w-full object-cover"
              draggable={false}
            />
          ) : null}
        </div>

        <div
          className="absolute inset-0 bg-black/60"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-black/10" aria-hidden="true" />
        <div
          className="absolute inset-0 bg-[url('/assets/black-noise.png')] opacity-5 sm:mix-blend-overlay"
          aria-hidden="true"
        />
        <div className="relative z-1 grid min-h-[100svh] grid-rows-[auto_1fr_auto] px-6 pt-10 sm:min-h-[100svh] sm:px-12 lg:px-16 [--push-safe:88px] sm:[--push-safe:104px] lg:[--push-safe:120px]">
          <div className="grid grid-rows-[auto_auto] gap-6 sm:gap-8">
            {showHeader ? (
              <div className="flex items-center justify-between gap-6">
                <a className="inline-flex items-center" href="/" aria-label="Home">
                  <img
                    src="/assets/logotipo/logo_edit_group.webp"
                    alt="Edit Group"
                    className="h-16 w-auto"
                    draggable={false}
                  />
                </a>
                <FullscreenMenu />
              </div>
            ) : null}
          </div>

          <div className="flex items-center justify-center text-center">
            <div className="mx-auto max-w-6xl px-0 sm:px-6">
              <span className="inline-flex items-center rounded-none border border-white/30 px-4 py-2 text-xs font-thin tracking-[0.3em] text-[#F5F5F5] font-barlow-thin">
                {layerVariant.kicker}
              </span>

              <h1
                className={`mt-8 font-semibold tracking-[0.06em] text-center font-secular ${HERO_HEADLINE_SIZE.mobile} ${HERO_HEADLINE_SIZE.tablet} ${HERO_HEADLINE_SIZE.desktopLocked}`}
              >
                {layerVariant.pos === 0 ? (
                  <>
                    <span className="sm:hidden text-center">
                      {(layerVariant.mobileLines?.length
                        ? layerVariant.mobileLines
                        : []
                      ).map((line) => (
                        <span key={line} className="block">
                          {line}
                        </span>
                      ))}
                      <span className="-mt-1 block">
                        <span className="align-baseline">{layerVariant.animatedPrefix} </span>
                        <span className="relative inline-flex items-baseline">
                          <span className="align-baseline">{tw.text}</span>
                          <span
                            className="ml-1 inline-block h-[0.9em] w-[2px] translate-y-[2px] bg-[#F5F5F5]"
                            style={{ animation: "hero-blink 1s step-end infinite" }}
                          />
                        </span>
                      </span>
                    </span>
                    <span className="hidden sm:inline">
                      <span className="block whitespace-normal">
                        {layerVariant.animatedPrefix}{" "}
                        <span className="relative inline-flex items-baseline whitespace-nowrap">
                          <span className="align-baseline">{tw.text}</span>
                          <span
                            className="ml-1 inline-block h-[0.9em] w-[2px] translate-y-[2px] bg-[#F5F5F5]"
                            style={{ animation: "hero-blink 1s step-end infinite" }}
                          />
                        </span>
                      </span>
                    </span>
                  </>
                ) : (
                  layerDisplayTitle
                )}
              </h1>

              {layerVariant.pos === 0 ? null : (
                <p className="mx-auto mt-[18px] max-w-3xl text-center text-xs font-thin uppercase tracking-[0.3em] text-[#F5F5F5] font-barlow-thin">
                  {layerVariant.tagline}
                </p>
              )}
              {layerVariant.pos === 0 ? (
                <style>{`
                  @keyframes hero-blink {
                    50% { opacity: 0; }
                  }
                `}</style>
              ) : null}
            </div>
          </div>

          <div
            className={`flex flex-col gap-4 self-end mb-[var(--push-safe)] sm:flex-row sm:items-end sm:justify-between ${
              layerVariant.pos !== 0 ? "-translate-y-10 sm:translate-y-0" : ""
            }`}
          >
            {layerVariant.pos !== 0 ? (
              <div className="flex items-end justify-between gap-4 sm:flex sm:flex-1 sm:min-w-0 sm:flex-nowrap sm:items-end">
                <div className="w-full text-left uppercase tracking-[0.3em] text-[#F5F5F5] sm:max-w-[760px]">
                  <div className="grid grid-cols-1 gap-y-4 text-xs sm:hidden">
                    <div>
                      <div className="text-[10px] text-[#F5F5F5]">QUEM</div>
                      <div className="mt-1 text-sm tracking-[0.25em] text-[#F5F5F5] whitespace-nowrap">
                        {layerMedia.who}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#F5F5F5]">QUANDO</div>
                      <div className="mt-1 text-sm tracking-[0.25em] text-[#F5F5F5] whitespace-nowrap">
                        {layerMedia.when}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#F5F5F5]">CATEGORIA</div>
                      <div className="mt-1 text-sm tracking-[0.25em] text-[#F5F5F5] whitespace-nowrap">
                        {layerMedia.category}
                      </div>
                    </div>
                  </div>
                  <div className="hidden sm:grid sm:grid-cols-[minmax(220px,1fr)_minmax(140px,1fr)_minmax(200px,1fr)] sm:gap-x-14">
                    <div className="text-[10px] text-[#F5F5F5]">QUEM</div>
                    <div className="text-[10px] text-[#F5F5F5]">QUANDO</div>
                    <div className="text-[10px] text-[#F5F5F5]">CATEGORIA</div>
                    <div className="mt-1 text-sm tracking-[0.25em] text-[#F5F5F5] whitespace-nowrap">
                      {layerMedia.who}
                    </div>
                    <div className="mt-1 text-sm tracking-[0.25em] text-[#F5F5F5] whitespace-nowrap">
                      {layerMedia.when}
                    </div>
                    <div className="mt-1 text-sm tracking-[0.25em] text-[#F5F5F5] whitespace-nowrap">
                      {layerMedia.category}
                    </div>
                  </div>
                </div>
                {isMediaCta && onOpenMedia ? (
                  <button
                    type="button"
                    className="btn-vozes !rounded-none inline-flex w-fit items-center gap-3 self-end font-secular whitespace-nowrap sm:hidden"
                    onClick={() => onOpenMedia(layerVariant)}
                  >
                    {topLabel}
                  </button>
                ) : null}
              </div>
            ) : (
              <p className="sm:flex-1 max-w-3xl text-center text-xs font-thin uppercase tracking-[0.3em] text-[#F5F5F5] font-barlow-thin mx-auto -translate-y-[9rem] sm:-translate-y-[50px]">
                {layerVariant.tagline}
              </p>
            )}
            {isMediaCta && onOpenMedia ? (
              <button
                type="button"
                className="btn-vozes !rounded-none hidden items-center gap-3 self-start font-secular sm:inline-flex lg:inline-flex"
                onClick={() => onOpenMedia(layerVariant)}
              >
                {topLabel}
              </button>
            ) : layerVariant.pos === 0 ? null : (
              <a
                className="btn-vozes !rounded-none hidden items-center gap-3 self-start font-secular sm:inline-flex lg:inline-flex"
                href={topHref}
              >
                {topLabel}
              </a>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <section
      id="split"
      className="relative min-h-[100svh] w-full overflow-visible text-[#F5F5F5] sm:min-h-[100svh]"
      style={{ textShadow: "0 2px 12px rgba(0,0,0,0.35)" }}
    >
      <div
        className="absolute inset-0 z-0 bg-[#0b0b0b] transition-opacity duration-200 pointer-events-none"
        style={{ opacity: showVideo ? 0 : 1 }}
        aria-hidden="true"
      />
      {renderLayer(prevVariant, !isTransitioning, "prev")}
      {renderLayer(nextVariant, isTransitioning, "next")}
      {typeof dialValue !== "undefined" && onDialChange ? (
        <div className="pointer-events-none absolute bottom-6 left-1/2 z-[999] w-[115vw] min-w-[80vw] max-w-[115vw] sm:min-w-0 sm:max-w-none sm:w-[min(calc(100vw),1100px)] -translate-x-1/2 overflow-visible">
          <div className="pointer-events-auto overflow-visible">
            <StageDial value={dialValue} onChange={onDialChange} onPush={onDialPush} />
          </div>
        </div>
      ) : null}
      {(!isHeroInView || showVideo || (activeVariant.pos !== 0 && mobileRolloverProgress > 0.02)) ? (
        <VoicePod
          open={voicePodOpen}
          onOpenChange={setVoicePodOpen}
          mobileDocked={mobileScrolled}
          mobileRolloverProgress={mobileRolloverProgress}
          mobileReverseMotion={activeVariant.pos !== 0}
        />
      ) : null}
    </section>
  )
}

export default FeaturedHero


