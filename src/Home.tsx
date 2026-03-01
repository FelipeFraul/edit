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
  getVariantMedia,
  heroVariants,
  type HeroVariant,
  type MediaItem,
} from "./heroVariants"

const SHARED_BG_VIDEO = "https://www.youtube.com/embed/ehEqJZ_7fpc?autoplay=1&mute=1&controls=0&loop=1&playlist=ehEqJZ_7fpc&start=80&playsinline=1&rel=0&modestbranding=1"

const clampPos = (value: number) =>
  Math.min(3, Math.max(-3, Math.round(value))) as -3 | -2 | -1 | 0 | 1 | 2 | 3

const MOBILE_HEADER_SHOW_SCROLL_PX = 12
const MOBILE_HEADER_HIDE_SCROLL_PX = 4

const Home: React.FC = () => {
  const [pos, setPos] = useState<-3 | -2 | -1 | 0 | 1 | 2 | 3>(0)
  const [mediaOpen, setMediaOpen] = useState(false)
  const [mediaItem, setMediaItem] = useState<MediaItem | null>(null)
  const [mediaIndex, setMediaIndex] = useState<number>(0)
  const [logoTintStartPx, setLogoTintStartPx] = useState<number>(9999)
  const [logoTintColor, setLogoTintColor] = useState<string>("#4c007d")
  const [headerIsLight, setHeaderIsLight] = useState(false)
  const [mobileHeaderBgVisible, setMobileHeaderBgVisible] = useState(false)
  const [mobileRolloverProgress, setMobileRolloverProgress] = useState(0)
  const [isMobileViewport, setIsMobileViewport] = useState(false)
  const mainRef = useRef<HTMLDivElement | null>(null)
  const logoRef = useRef<HTMLDivElement | null>(null)

  const variant = useMemo(() => getHeroVariant(pos), [pos])
  const mobileReveal = isMobileViewport ? Math.max(0, Math.min(1, mobileRolloverProgress * 3)) : 0

  useEffect(() => {
    const syncViewport = () => setIsMobileViewport(window.innerWidth < 640)
    syncViewport()
    window.addEventListener("resize", syncViewport)
    return () => window.removeEventListener("resize", syncViewport)
  }, [])

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
      const isMobile = window.innerWidth < 640
      const scrollTop = root.scrollTop
      if (isMobile) {
        setMobileHeaderBgVisible((prev) => {
          if (!prev) return scrollTop >= MOBILE_HEADER_SHOW_SCROLL_PX
          return scrollTop > MOBILE_HEADER_HIDE_SCROLL_PX
        })
      } else {
        setMobileHeaderBgVisible(false)
      }
      setMobileRolloverProgress(isMobile ? Math.min(1, Math.max(0, scrollTop / 200)) : 0)
      if (isMobile) {
        setHeaderIsLight(false)
        setLogoTintColor("#ffffff")
        setLogoTintStartPx(0)
        return
      }
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

    let rafId: number | null = null
    const scheduleSync = () => {
      if (rafId !== null) return
      rafId = window.requestAnimationFrame(() => {
        rafId = null
        syncLogoCut()
      })
    }

    syncLogoCut()
    root.addEventListener("scroll", scheduleSync, { passive: true })
    window.addEventListener("resize", scheduleSync)
    return () => {
      root.removeEventListener("scroll", scheduleSync)
      window.removeEventListener("resize", scheduleSync)
      if (rafId !== null) window.cancelAnimationFrame(rafId)
    }
  }, [])

  const handleChange = (value: number) => {
    setPos(clampPos(value))
  }

  const openMedia = (current: HeroVariant) => {
    const currentMedia = getVariantMedia(current, isMobileViewport)
    const idx = heroVariants.findIndex((entry) => entry.pos === current.pos)
    setMediaIndex(idx >= 0 ? idx : 0)
    const fallback: MediaItem = {
      who: "",
      when: "",
      category: "",
      title: "",
      subtitle: "",
      videoSrc: "",
      poster: "",
    }
    setMediaItem(currentMedia ?? fallback)
    setMediaOpen(true)
  }

  const goMedia = (direction: -1 | 1) => {
    const total = heroVariants.length
    if (total === 0) return
    const nextIndex = (mediaIndex + direction + total) % total
    const nextVariant = heroVariants[nextIndex]
    const fallback: MediaItem = {
      who: "",
      when: "",
      category: "",
      title: "",
      subtitle: "",
      videoSrc: "",
      poster: "",
    }
    const nextMedia = getVariantMedia(nextVariant, isMobileViewport)
    setMediaIndex(nextIndex)
    setMediaItem(nextMedia ?? fallback)
  }

  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-0 hidden overflow-hidden sm:block" aria-hidden="true">
        <iframe
          className="absolute left-1/2 top-1/2 h-[1080px] w-[1920px] -translate-x-1/2 -translate-y-1/2 border-0"
          src={SHARED_BG_VIDEO}
          title="Hero background video"
          allow="autoplay; encrypted-media; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
      <main className="relative h-[100svh] overflow-visible sm:h-screen">
        <div
          ref={mainRef}
          className="app-scroll h-[100svh] overflow-y-auto snap-none sm:h-screen sm:snap-y sm:snap-mandatory overscroll-y-contain"
        >
          <div className="pointer-events-none absolute left-0 top-0 z-[1100] w-full px-0 pt-0 sm:fixed sm:z-30 sm:px-12 sm:pt-8 lg:px-16">
            <div
              className="pointer-events-auto relative flex w-full items-center justify-between gap-6 overflow-hidden border-0 px-6 py-3 sm:w-auto sm:border sm:border-transparent sm:bg-transparent sm:px-0 sm:py-0 sm:transition-colors sm:duration-150"
            >
              <span
                aria-hidden="true"
                className="absolute -inset-px origin-top bg-black/90 sm:hidden"
                style={{
                  transform: `scaleY(${mobileReveal})`,
                  opacity: mobileHeaderBgVisible ? 1 : 0,
                  transformOrigin: "top",
                  transition: "transform 180ms linear, opacity 140ms linear",
                }}
              />
              <a className="inline-flex items-center" href="/" aria-label="Home">
                <div
                  ref={logoRef}
                  className="relative h-12 w-[120px] sm:h-16 sm:w-[160px] sm:transition-[width,height] sm:duration-200"
                >
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 block h-full w-full"
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
                    className="pointer-events-none absolute inset-0 hidden h-full w-full sm:block"
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
                    className="absolute inset-0 h-full w-full object-contain opacity-0"
                    draggable={false}
                  />
                </div>
              </a>
              <FullscreenMenu isLight={isMobileViewport ? false : headerIsLight} />
            </div>
          </div>

          <div id="hero" className="relative overflow-hidden sm:snap-start sm:snap-always">
            <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden sm:hidden" aria-hidden="true">
              <video
                className="absolute left-1/2 top-1/2 h-[1080px] w-[1920px] -translate-x-1/2 -translate-y-1/2 object-cover sm:hidden"
                src="/assets/video/Edit_Group_Hero.mp4"
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                disablePictureInPicture
              />
            </div>
            <FeaturedHero
              variant={variant}
              onOpenMedia={openMedia}
              dialValue={pos}
              onDialChange={handleChange}
              onDialPush={() => openMedia(variant)}
              showHeader={false}
              mobileScrolled={isMobileViewport}
              mobileRolloverProgress={mobileRolloverProgress}
              isMobileViewport={isMobileViewport}
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
      <div
        className="pointer-events-none fixed bottom-0 left-0 z-[10] h-[64px] w-full origin-bottom bg-black/90 sm:hidden"
        style={{
          transform: `scaleY(${mobileReveal})`,
          opacity: mobileHeaderBgVisible ? 1 : 0,
          transformOrigin: "bottom",
          transition: "transform 180ms linear, opacity 140ms linear",
        }}
        aria-hidden="true"
      />
      <SocialBar
        mobileRolloverProgress={mobileRolloverProgress}
        mobileDocked={isMobileViewport}
        mobileReverseMotion={pos !== 0}
      />
    </>
  )
}

export default Home
