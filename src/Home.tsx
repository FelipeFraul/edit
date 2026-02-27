import React, { useEffect, useMemo, useRef, useState } from "react"
import FeaturedHero from "./components/FeaturedHero"
import FullscreenMenu from "./components/FullscreenMenu"
import MediaModal from "./components/MediaModal"
import Section02 from "./components/Section02"
import Section03 from "./components/Section03"
import Section04 from "./components/Section04"
import Section05 from "./components/Section05"
import Section06 from "./components/Section06"
import SocialBar from "./components/SocialBar"
import {
  getHeroVariant,
  heroVariants,
  type HeroVariant,
  type MediaItem,
} from "./heroVariants"

const SHARED_BG_VIDEO = "https://www.youtube.com/embed/ehEqJZ_7fpc?autoplay=1&mute=1&controls=0&loop=1&playlist=ehEqJZ_7fpc&start=80&playsinline=1&rel=0&modestbranding=1"

const clampPos = (value: number) =>
  Math.min(3, Math.max(-3, Math.round(value))) as -3 | -2 | -1 | 0 | 1 | 2 | 3

const Home: React.FC = () => {
  const [pos, setPos] = useState<-3 | -2 | -1 | 0 | 1 | 2 | 3>(0)
  const [mediaOpen, setMediaOpen] = useState(false)
  const [mediaItem, setMediaItem] = useState<MediaItem | null>(null)
  const [mediaIndex, setMediaIndex] = useState<number>(0)
  const [logoTintStartPx, setLogoTintStartPx] = useState<number>(9999)
  const [logoTintColor, setLogoTintColor] = useState<string>("#4c007d")
  const [headerIsLight, setHeaderIsLight] = useState(false)
  const mainRef = useRef<HTMLDivElement | null>(null)
  const logoRef = useRef<HTMLDivElement | null>(null)

  const variant = useMemo(() => getHeroVariant(pos), [pos])

  useEffect(() => {
    const root = mainRef.current
    const logoEl = logoRef.current
    if (!root) return
    if (!logoEl) return
    const hero = document.getElementById("hero")
    const secao01 = document.getElementById("secao-01")
    const secao02 = document.getElementById("secao-02")
    const secao04 = document.getElementById("secao-04")
    const secao05 = document.getElementById("secao-05")
    const secao06 = document.getElementById("secao-06")
    if (!hero && !secao01 && !secao02 && !secao04 && !secao05 && !secao06) return

    const syncLogoCut = () => {
      const logoRect = logoEl.getBoundingClientRect()
      const targets = [
        hero
          ? { top: hero.getBoundingClientRect().top, logoColor: "#ffffff", menuIsLight: false }
          : null,
        secao01
          ? { top: secao01.getBoundingClientRect().top, logoColor: "#ffffff", menuIsLight: false }
          : null,
        secao02
          ? { top: secao02.getBoundingClientRect().top, logoColor: "#4c007d", menuIsLight: true }
          : null,
        secao04
          ? { top: secao04.getBoundingClientRect().top, logoColor: "#ffffff", menuIsLight: false }
          : null,
        secao05
          ? { top: secao05.getBoundingClientRect().top, logoColor: "#4c007d", menuIsLight: true }
          : null,
        secao06
          ? { top: secao06.getBoundingClientRect().top, logoColor: "#ffffff", menuIsLight: false }
          : null,
      ].filter(
        (item): item is { top: number; logoColor: string; menuIsLight: boolean } => item !== null
      )
      if (!targets.length) return

      let active = targets[0]
      let bestDist = Math.abs(active.top - logoRect.top)
      for (let i = 1; i < targets.length; i += 1) {
        const dist = Math.abs(targets[i].top - logoRect.top)
        if (dist < bestDist) {
          bestDist = dist
          active = targets[i]
        }
      }

      const lineY = active.top
      setLogoTintColor(active.logoColor)
      setHeaderIsLight(active.menuIsLight)

      if (lineY <= logoRect.top) {
        setLogoTintStartPx(0)
        return
      }
      if (lineY >= logoRect.bottom) {
        setLogoTintStartPx(logoRect.height)
        return
      }
      setLogoTintStartPx(lineY - logoRect.top)
    }

    syncLogoCut()
    root.addEventListener("scroll", syncLogoCut, { passive: true })
    window.addEventListener("resize", syncLogoCut)
    return () => {
      root.removeEventListener("scroll", syncLogoCut)
      window.removeEventListener("resize", syncLogoCut)
    }
  }, [])

  const handleChange = (value: number) => {
    setPos(clampPos(value))
  }

  const openMedia = (current: HeroVariant) => {
    const idx = heroVariants.findIndex((entry) => entry.pos === current.pos)
    setMediaIndex(idx >= 0 ? idx : 0)
    const fallback: MediaItem = {
      who: current.client,
      when: current.year,
      category: current.category,
      title: current.title,
      subtitle: current.subtitle,
      videoSrc: "",
      poster: "",
    }
    setMediaItem(current.media ?? fallback)
    setMediaOpen(true)
  }

  const goMedia = (direction: -1 | 1) => {
    const total = heroVariants.length
    if (total === 0) return
    const nextIndex = (mediaIndex + direction + total) % total
    const nextVariant = heroVariants[nextIndex]
    const fallback: MediaItem = {
      who: nextVariant.client,
      when: nextVariant.year,
      category: nextVariant.category,
      title: nextVariant.title,
      subtitle: nextVariant.subtitle,
      videoSrc: "",
      poster: "",
    }
    setMediaIndex(nextIndex)
    setMediaItem(nextVariant.media ?? fallback)
  }

  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <iframe
          className="absolute left-1/2 top-1/2 h-[1080px] w-[1920px] -translate-x-1/2 -translate-y-1/2 border-0"
          src={SHARED_BG_VIDEO}
          title="Hero background video"
          allow="autoplay; encrypted-media; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
      <main className="relative z-10 h-screen overflow-visible">
        <div ref={mainRef} className="app-scroll h-screen overflow-y-auto snap-y snap-mandatory overscroll-y-contain">
          <div className="pointer-events-none fixed left-0 top-0 z-30 w-full px-6 pt-6 sm:px-12 sm:pt-8 lg:px-16">
            <div className="pointer-events-auto flex items-center justify-between gap-6">
              <a className="inline-flex items-center" href="/" aria-label="Home">
                <div ref={logoRef} className="relative h-16 w-[160px]">
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 block h-16 w-[160px]"
                    style={{
                      backgroundColor: "#ffffff",
                      WebkitMaskImage: "url('/assets/logotipo/logo_edit_group.webp')",
                      maskImage: "url('/assets/logotipo/logo_edit_group.webp')",
                      WebkitMaskRepeat: "no-repeat",
                      maskRepeat: "no-repeat",
                      WebkitMaskPosition: "left top",
                      maskPosition: "left top",
                      WebkitMaskSize: "contain",
                      maskSize: "contain",
                    }}
                  />
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 block h-16 w-[160px]"
                    style={{
                      backgroundColor: logoTintColor,
                      clipPath: `inset(${logoTintStartPx}px 0 0 0)`,
                      WebkitMaskImage: "url('/assets/logotipo/logo_edit_group.webp')",
                      maskImage: "url('/assets/logotipo/logo_edit_group.webp')",
                      WebkitMaskRepeat: "no-repeat",
                      maskRepeat: "no-repeat",
                      WebkitMaskPosition: "left top",
                      maskPosition: "left top",
                      WebkitMaskSize: "contain",
                      maskSize: "contain",
                    }}
                  />
                  <img
                    src="/assets/logotipo/logo_edit_group.webp"
                    alt="Edit Group"
                    className="absolute inset-0 h-16 w-auto max-w-none opacity-0"
                    draggable={false}
                  />
                </div>
              </a>
              <FullscreenMenu isLight={headerIsLight} />
            </div>
          </div>

          <div id="hero" className="snap-start snap-always">
            <FeaturedHero
              variant={variant}
              onOpenMedia={openMedia}
              dialValue={pos}
              onDialChange={handleChange}
              onDialPush={() => openMedia(variant)}
              showHeader={false}
            />
          </div>

          <Section02 />

          <Section03 />

          <Section04 />

          <Section05 />

          <Section06 />

          <MediaModal
            open={mediaOpen}
            item={mediaItem}
            onClose={() => setMediaOpen(false)}
            onPrev={() => goMedia(-1)}
            onNext={() => goMedia(1)}
          />
        </div>
      </main>
      <SocialBar />
    </>
  )
}

export default Home
