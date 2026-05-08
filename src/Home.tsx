import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import FeaturedHero from "./components/FeaturedHero"
import FullscreenMenu from "./components/FullscreenMenu"
import MediaModal from "./components/MediaModal"
import Section02 from "./components/Section02"
import Section03 from "./components/Section03"
import Section04 from "./components/Section04"
import Section05 from "./components/Section05"
import Section06 from "./components/Section06"
import SocialBar from "./components/SocialBar"
import RotatingAgencyButton from "./components/RotatingAgencyButton"
import {
  getVariantMedia,
  heroVariants,
  type HeroVariant,
  type MediaItem,
} from "./heroVariants"
import {
  getLatestPublished,
  loadDraftContent,
  loadDraftContentRemote,
  loadVersions,
  saveDraftContent,
} from "./admin/storage"
import type { AdminContent } from "./admin/types"

const SHARED_BG_VIDEO = "https://www.youtube.com/embed/ehEqJZ_7fpc?autoplay=1&mute=1&controls=0&loop=1&playlist=ehEqJZ_7fpc&start=80&playsinline=1&rel=0&modestbranding=1"

const clampPos = (value: number) =>
  Math.min(3, Math.max(-3, Math.round(value))) as -3 | -2 | -1 | 0 | 1 | 2 | 3

const HERO_POSITIONS: Array<-3 | -2 | -1 | 0 | 1 | 2 | 3> = [-3, -2, -1, 0, 1, 2, 3]

const MOBILE_HEADER_SHOW_SCROLL_PX = 12
const MOBILE_HEADER_HIDE_SCROLL_PX = 4
const REMOTE_HYDRATION_SYNC_INTERVAL_MS = 15000

type IdleWindow = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout?: number }) => number
  cancelIdleCallback?: (handle: number) => void
}

const resolveInitialContent = (): AdminContent => {
  return loadDraftContent()
}

const mergeContentVersions = (items: ReturnType<typeof loadVersions>) => {
  const byId = new Map<string, (typeof items)[number]>()
  for (const item of items) byId.set(item.id, item)
  return Array.from(byId.values()).sort((a, b) => a.version_number - b.version_number)
}

const Home: React.FC = () => {
  const [cmsContent, setCmsContent] = useState<AdminContent>(() => resolveInitialContent())
  const [cmsHydrated, setCmsHydrated] = useState(true)
  const [pos, setPos] = useState<-3 | -2 | -1 | 0 | 1 | 2 | 3>(0)
  const [mediaOpen, setMediaOpen] = useState(false)
  const [mediaItem, setMediaItem] = useState<MediaItem | null>(null)
  const [mediaIndex, setMediaIndex] = useState<number>(0)
  const [logoTintStartPx, setLogoTintStartPx] = useState<number>(9999)
  const [logoBaseColor, setLogoBaseColor] = useState<string>("#ffffff")
  const [logoTintColor, setLogoTintColor] = useState<string>("#4c007d")
  const [headerIsLight, setHeaderIsLight] = useState(false)
  const [mobileHeaderBgVisible, setMobileHeaderBgVisible] = useState(false)
  const [mobileRolloverProgress, setMobileRolloverProgress] = useState(0)
  const [isMobileViewport, setIsMobileViewport] = useState(false)
  const [mobileViewportWidth, setMobileViewportWidth] = useState(0)
  const mainRef = useRef<HTMLDivElement | null>(null)
  const logoRef = useRef<HTMLDivElement | null>(null)
  const hydrationStartedRef = useRef(false)
  const hydrationInFlightRef = useRef(false)
  const lastRemoteHydrationAtRef = useRef(0)

  const hydrateCmsContent = useCallback(async () => {
    if (hydrationInFlightRef.current) return
    hydrationInFlightRef.current = true
    try {
      const remoteDraft = await loadDraftContentRemote()
      if (remoteDraft) {
        saveDraftContent(remoteDraft)
        setCmsContent(remoteDraft)
        return
      }

      const localVersions = loadVersions()
      const versions = mergeContentVersions(localVersions)
      const latest = getLatestPublished(versions)
      const localDraft = loadDraftContent()
      const nextContent = latest?.data_json ?? localDraft
      setCmsContent(nextContent)
    } catch (error) {
      console.error("Failed to hydrate CMS content", error)
    } finally {
      lastRemoteHydrationAtRef.current = Date.now()
      hydrationInFlightRef.current = false
      setCmsHydrated(true)
    }
  }, [])

  const heroCarouselVariants = useMemo<HeroVariant[]>(() => {
    const active = (cmsContent.hero?.variants ?? [])
      .filter((entry) => entry.is_active && !entry.deleted_at)
      .sort((a, b) => {
        if (a.pos !== b.pos) return a.pos - b.pos
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      })

    const byPos = new Map(active.map((entry) => [entry.pos, entry]))
    const fallbackByPos = new Map(heroVariants.map((entry) => [entry.pos, entry]))
    const fromCms: HeroVariant[] = []
    for (const position of HERO_POSITIONS) {
      const entry = byPos.get(position)
      if (!entry) continue
      const fallback = fallbackByPos.get(position)
      const fallbackMedia = fallback?.media
      const fallbackMobileMedia = fallback?.mobileMedia ?? fallback?.media
      fromCms.push({
        pos: position,
        mode: fallback?.mode ?? (position < 0 ? "ads" : position === 0 ? "split" : "entertainment"),
        kicker: entry.kicker || fallback?.kicker || "",
        title: entry.title || fallback?.title || undefined,
        animatedPrefix: entry.animatedPrefix || fallback?.animatedPrefix || undefined,
        animatedWords: entry.animatedWords?.length ? entry.animatedWords : fallback?.animatedWords,
        tagline: entry.tagline || fallback?.tagline || "",
        mobileLines: fallback?.mobileLines,
        ctaHref: fallback?.ctaHref || entry.topCtaHref || "#split",
        topCtaLabel: entry.topCtaLabel || (position === 0 ? "AGÊNCIA DE VOZES" : "VER MÍDIA"),
        topCtaHref: entry.topCtaHref || fallback?.topCtaHref || (position === 0 ? "#split" : "#midia"),
        media: {
          videoSrc: entry.videoSrc || fallbackMedia?.videoSrc || "",
          poster: entry.poster || fallbackMedia?.poster || "",
          who: entry.who || fallbackMedia?.who || "",
          when: entry.when || fallbackMedia?.when || "",
          category: entry.category || fallbackMedia?.category || "",
          title: entry.title || entry.modalTitle || fallbackMedia?.title || "",
          subtitle: entry.subtitle || fallbackMedia?.subtitle || "",
          modalBodyText: entry.modalBodyText || fallbackMedia?.modalBodyText || "",
          badgeResponsible: entry.badgeResponsible || fallbackMedia?.badgeResponsible || "",
          badgeAgency: entry.badgeAgency || fallbackMedia?.badgeAgency || "",
          badgeProdVideo: entry.badgeProdVideo || fallbackMedia?.badgeProdVideo || "",
          badgeProdAudio: entry.badgeProdAudio || fallbackMedia?.badgeProdAudio || "",
          badgeVoice: entry.badgeVoice || fallbackMedia?.badgeVoice || "",
          badgeOperator: entry.badgeOperator || fallbackMedia?.badgeOperator || "",
        },
        mobileMedia: {
          videoSrc: entry.videoSrc || fallbackMobileMedia?.videoSrc || fallbackMedia?.videoSrc || "",
          poster: entry.poster || entry.mobileBgImage || fallbackMobileMedia?.poster || fallback?.mobileBgImage || "",
          who: entry.who || fallbackMobileMedia?.who || fallbackMedia?.who || "",
          when: entry.when || fallbackMobileMedia?.when || fallbackMedia?.when || "",
          category: entry.category || fallbackMobileMedia?.category || fallbackMedia?.category || "",
          title: entry.title || entry.modalTitle || fallbackMobileMedia?.title || fallbackMedia?.title || "",
          subtitle: entry.subtitle || fallbackMobileMedia?.subtitle || fallbackMedia?.subtitle || "",
          modalBodyText: entry.modalBodyText || fallbackMobileMedia?.modalBodyText || fallbackMedia?.modalBodyText || "",
          badgeResponsible: entry.badgeResponsible || fallbackMobileMedia?.badgeResponsible || fallbackMedia?.badgeResponsible || "",
          badgeAgency: entry.badgeAgency || fallbackMobileMedia?.badgeAgency || fallbackMedia?.badgeAgency || "",
          badgeProdVideo: entry.badgeProdVideo || fallbackMobileMedia?.badgeProdVideo || fallbackMedia?.badgeProdVideo || "",
          badgeProdAudio: entry.badgeProdAudio || fallbackMobileMedia?.badgeProdAudio || fallbackMedia?.badgeProdAudio || "",
          badgeVoice: entry.badgeVoice || fallbackMobileMedia?.badgeVoice || fallbackMedia?.badgeVoice || "",
          badgeOperator: entry.badgeOperator || fallbackMobileMedia?.badgeOperator || fallbackMedia?.badgeOperator || "",
        },
        bgImage: entry.bgImage || fallback?.bgImage || "",
        mobileBgImage: entry.mobileBgImage || fallback?.mobileBgImage || entry.bgImage || fallback?.bgImage || "",
      })
    }

    if (!fromCms.length) return heroVariants

    const missingFallback = heroVariants.filter(
      (fallback) => !fromCms.some((entry) => entry.pos === fallback.pos)
    )

    return [...fromCms, ...missingFallback].sort((a, b) => a.pos - b.pos)
  }, [cmsContent.hero?.variants])

  const variant = useMemo(() => {
    const exact = heroCarouselVariants.find((entry) => entry.pos === pos)
    if (exact) return exact
    return heroCarouselVariants[0] ?? heroVariants[0]
  }, [pos, heroCarouselVariants])
  const mobileReveal = isMobileViewport ? Math.max(0, Math.min(1, mobileRolloverProgress * 3)) : 0

  useEffect(() => {
    let cancelled = false
    let idleId: number | null = null
    let timeoutId: number | null = null

    const hydrateIfMounted = () => {
      if (cancelled) return
      if (hydrationStartedRef.current) return
      hydrationStartedRef.current = true
      void hydrateCmsContent()
    }

    const idleWindow = window as IdleWindow
    if (idleWindow.requestIdleCallback) {
      idleId = idleWindow.requestIdleCallback(hydrateIfMounted, { timeout: 2500 })
    } else {
      timeoutId = window.setTimeout(hydrateIfMounted, 1200)
    }

    return () => {
      cancelled = true
      if (idleId !== null && idleWindow.cancelIdleCallback) idleWindow.cancelIdleCallback(idleId)
      if (timeoutId !== null) window.clearTimeout(timeoutId)
    }
  }, [hydrateCmsContent])

  useEffect(() => {
    const sync = () => {
      const nowMs = Date.now()
      if (hydrationInFlightRef.current) return
      if (nowMs - lastRemoteHydrationAtRef.current < REMOTE_HYDRATION_SYNC_INTERVAL_MS) return
      void hydrateCmsContent()
    }
    const syncWhenVisible = () => {
      if (document.visibilityState === "visible") sync()
    }
    window.addEventListener("focus", sync)
    window.addEventListener("storage", sync)
    document.addEventListener("visibilitychange", syncWhenVisible)
    return () => {
      window.removeEventListener("focus", sync)
      window.removeEventListener("storage", sync)
      document.removeEventListener("visibilitychange", syncWhenVisible)
    }
  }, [hydrateCmsContent])

  useEffect(() => {
    const syncViewport = () => {
      setIsMobileViewport(window.innerWidth < 640)
      setMobileViewportWidth(window.innerWidth)
    }
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
        setLogoBaseColor("#ffffff")
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

      let currentIndex = 0
      for (let i = 0; i < targets.length; i += 1) {
        if (targets[i].top <= logoRect.top) {
          currentIndex = i
        } else {
          break
        }
      }

      const crossingIndex = targets.findIndex(
        (target) => target.top > logoRect.top && target.top < logoRect.bottom
      )
      const active = targets[currentIndex]
      const crossing = crossingIndex >= 0 ? targets[crossingIndex] : null

      setLogoBaseColor(active.logoColor)
      setLogoTintColor(crossing?.logoColor ?? active.logoColor)
      setHeaderIsLight(active.menuIsLight)

      if (!crossing) {
        setLogoTintStartPx(0)
        return
      }
      setLogoTintStartPx(crossing.top - logoRect.top)
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
    if (current.pos === 0) return
    const currentMedia = getVariantMedia(current, isMobileViewport)
    const idx = heroCarouselVariants.findIndex((entry) => entry.pos === current.pos)
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
    const total = heroCarouselVariants.length
    if (total === 0) return
    let nextIndex = mediaIndex
    for (let step = 0; step < total; step += 1) {
      nextIndex = (nextIndex + direction + total) % total
      if (heroCarouselVariants[nextIndex]?.pos !== 0) break
    }
    const nextVariant = heroCarouselVariants[nextIndex]
    if (!nextVariant || nextVariant.pos === 0) return
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

  const agencyRollover = Math.max(0, Math.min(1, mobileRolloverProgress))
  const agencyWidthPx = 210
  const agencyDownEnd = 0.82
  const agencyLateralStart = 0.78
  const agencyDownProgress = Math.max(0, Math.min(1, agencyRollover / agencyDownEnd))
  const agencyRawRightProgress = Math.max(0, Math.min(1, (agencyRollover - agencyLateralStart) / (1 - agencyLateralStart)))
  const agencyRightProgress = agencyRawRightProgress * agencyRawRightProgress * (3 - 2 * agencyRawRightProgress)
  const agencyStartBottom = 112
  const agencyEndBottom = 12
  const agencyBottomPx = agencyStartBottom + (agencyEndBottom - agencyStartBottom) * agencyDownProgress
  const agencyStartCenterX = mobileViewportWidth / 2
  const agencyEndCenterX = mobileViewportWidth - 12 - agencyWidthPx / 2
  const agencyCenterXPx = agencyStartCenterX + (agencyEndCenterX - agencyStartCenterX) * agencyRightProgress
  const agencyDeltaX = agencyCenterXPx - agencyStartCenterX
  const agencyDeltaY = agencyBottomPx - agencyEndBottom
  const mobileAgencyStyle = isMobileViewport
    ? {
        left: "50%",
        right: "auto",
        bottom: `${agencyEndBottom}px`,
        transform: `translate3d(calc(-50% + ${agencyDeltaX}px), ${-agencyDeltaY}px, 0)`,
        willChange: "transform",
      }
    : undefined

  return (
    <>
      {!cmsHydrated ? (
        <div className="fixed inset-0 z-[3000] bg-[#0b0b0b]" aria-hidden="true" />
      ) : null}
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
                      backgroundColor: logoBaseColor,
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

          <Section02 content={cmsContent.section02} />

          <Section03 content={cmsContent.section03} />

          <Section04 content={cmsContent.section04} talents={cmsContent.section07.talents} />

          <Section05 content={cmsContent.section05} />

          <Section06 content={cmsContent.section06} footer={cmsContent.footer} />

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
        mobileShowAgencyInBar={isMobileViewport && pos !== 0}
      />
      {!isMobileViewport || pos === 0 ? (
        <div
          className="pointer-events-none fixed bottom-4 left-1/2 z-[1001] w-[210px] max-w-[calc(100vw-1.5rem)] -translate-x-1/2 sm:bottom-7 sm:left-auto sm:right-12 sm:w-auto sm:max-w-none sm:translate-x-0 lg:right-16"
          style={mobileAgencyStyle}
        >
          <div className="pointer-events-auto">
            <RotatingAgencyButton />
          </div>
        </div>
      ) : null}
    </>
  )
}

export default Home

