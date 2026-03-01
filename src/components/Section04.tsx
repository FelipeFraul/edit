import React, { useEffect, useRef, useState } from "react"

type PhoneSlideSwapProps = {
  offSrc?: string
  onSrc?: string
  className?: string
  firstSlideSrc?: string
  secondSlideSrc?: string
  thirdSlideSrc?: string
  fourthSlideSrc?: string
}

const PhoneSlideSwap: React.FC<PhoneSlideSwapProps> = ({
  offSrc = "/assets/celular_desligado.webp",
  onSrc = "/assets/celular_chroma.webp",
  className = "",
  firstSlideSrc = "/assets/celular_ios.webp",
  secondSlideSrc = "/assets/celular_visao_criativa.webp",
  thirdSlideSrc = "/assets/celular_processo.webp",
  fourthSlideSrc = "/assets/celular_bastidores.webp",
}) => {
  const ref = useRef<HTMLDivElement | null>(null)
  const wheelCooldownUntilRef = useRef(0)
  const [play, setPlay] = useState(false)
  const [frameSrc, setFrameSrc] = useState<string>("")
  const [screen1, setScreen1] = useState<string>("")
  const [screen2, setScreen2] = useState<string>("")
  const [screen3, setScreen3] = useState<string>("")
  const [screen4, setScreen4] = useState<string>("")
  const [showScreen, setShowScreen] = useState(false)
  const [topScreenSrc, setTopScreenSrc] = useState<string>("")
  const [showBottomScreen, setShowBottomScreen] = useState(false)
  const [iosExiting, setIosExiting] = useState(false)
  const [screenMaskSrc, setScreenMaskSrc] = useState<string>("")
  const [isPhoneHover, setIsPhoneHover] = useState(false)
  const [slideIndex, setSlideIndex] = useState(0)
  const [incomingSlideIndex, setIncomingSlideIndex] = useState<number | null>(null)
  const [scrollDir, setScrollDir] = useState<1 | -1>(1)

  const loadImage = (src: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = src
    })

  useEffect(() => {
    let cancelled = false

    const isGreenPixel = (r: number, g: number, b: number, a: number) => {
      if (a <= 0) return false
      const rf = r / 255
      const gf = g / 255
      const bf = b / 255
      const max = Math.max(rf, gf, bf)
      const min = Math.min(rf, gf, bf)
      const delta = max - min
      if (delta === 0) return false

      let hue = 0
      if (max === rf) {
        hue = ((gf - bf) / delta) % 6
      } else if (max === gf) {
        hue = (bf - rf) / delta + 2
      } else {
        hue = (rf - gf) / delta + 4
      }
      hue *= 60
      if (hue < 0) hue += 360

      const sat = max === 0 ? 0 : delta / max
      const val = max

      // Strict chroma-green gate to avoid spill in dark areas/reflections.
      return hue >= 78 && hue <= 165 && sat >= 0.32 && val >= 0.2
    }

    const buildComposite = async () => {
      try {
        const [frame, firstScreen, secondScreen, thirdScreen, fourthScreen] = await Promise.all([
          loadImage(onSrc),
          loadImage(firstSlideSrc),
          loadImage(secondSlideSrc),
          loadImage(thirdSlideSrc),
          loadImage(fourthSlideSrc),
        ])

        const w = frame.naturalWidth || frame.width
        const h = frame.naturalHeight || frame.height
        if (!w || !h) return
        const pxCount = w * h

        const frameCanvas = document.createElement("canvas")
        frameCanvas.width = w
        frameCanvas.height = h
        const frameCtx = frameCanvas.getContext("2d")
        if (!frameCtx) return
        frameCtx.drawImage(frame, 0, 0, w, h)
        const frameData = frameCtx.getImageData(0, 0, w, h)

        // Detect the chroma area and fit the screen content exactly into it.
        const srcFrame = frameData.data
        const greenMask = new Uint8Array(pxCount)
        let minX = w
        let minY = h
        let maxX = -1
        let maxY = -1

        for (let i = 0; i < srcFrame.length; i += 4) {
          const fr = srcFrame[i]
          const fg = srcFrame[i + 1]
          const fb = srcFrame[i + 2]
          const fa = srcFrame[i + 3]
          const isGreen = isGreenPixel(fr, fg, fb, fa)
          if (!isGreen) continue

          const px = (i / 4) % w
          const py = Math.floor(i / 4 / w)
          greenMask[py * w + px] = 1
          if (px < minX) minX = px
          if (px > maxX) maxX = px
          if (py < minY) minY = py
          if (py > maxY) maxY = py
        }

        if (maxX < 0 || maxY < 0) {
          minX = 0
          minY = 0
          maxX = w - 1
          maxY = h - 1
        }

        // Keep only the connected chroma region closest to screen center.
        const coreMask = new Uint8Array(pxCount)
        const cx = (w - 1) * 0.5
        const cy = (h - 1) * 0.5
        let seed = -1
        let bestD2 = Number.POSITIVE_INFINITY
        for (let p = 0; p < pxCount; p += 1) {
          if (!greenMask[p]) continue
          const x = p % w
          const y = Math.floor(p / w)
          const dx = x - cx
          const dy = y - cy
          const d2 = dx * dx + dy * dy
          if (d2 < bestD2) {
            bestD2 = d2
            seed = p
          }
        }

        if (seed >= 0) {
          const queue = new Int32Array(pxCount)
          let head = 0
          let tail = 0
          queue[tail++] = seed
          coreMask[seed] = 1

          while (head < tail) {
            const p = queue[head++]
            const x = p % w
            const y = Math.floor(p / w)

            const push = (nx: number, ny: number) => {
              if (nx < 0 || nx >= w || ny < 0 || ny >= h) return
              const np = ny * w + nx
              if (!greenMask[np] || coreMask[np]) return
              coreMask[np] = 1
              queue[tail++] = np
            }

            push(x - 1, y)
            push(x + 1, y)
            push(x, y - 1)
            push(x, y + 1)
            push(x - 1, y - 1)
            push(x + 1, y - 1)
            push(x - 1, y + 1)
            push(x + 1, y + 1)
          }
        } else {
          for (let p = 0; p < pxCount; p += 1) coreMask[p] = greenMask[p]
        }

        // Tighten mask edges so content never leaks outside the phone screen.
        const erodeRadius = 4
        const safeMask = new Uint8Array(pxCount)
        for (let y = 0; y < h; y += 1) {
          for (let x = 0; x < w; x += 1) {
            const idx = y * w + x
            if (!coreMask[idx]) continue
            let keep = 1
            for (let oy = -erodeRadius; oy <= erodeRadius && keep; oy += 1) {
              const ny = y + oy
              if (ny < 0 || ny >= h) {
                keep = 0
                break
              }
              for (let ox = -erodeRadius; ox <= erodeRadius; ox += 1) {
                const nx = x + ox
                if (nx < 0 || nx >= w || !coreMask[ny * w + nx]) {
                  keep = 0
                  break
                }
              }
            }
            if (keep) safeMask[idx] = 1
          }
        }

        // Recompute bounds from tightened mask.
        minX = w
        minY = h
        maxX = -1
        maxY = -1
        let safeCount = 0
        for (let y = 0; y < h; y += 1) {
          for (let x = 0; x < w; x += 1) {
            if (!safeMask[y * w + x]) continue
            safeCount += 1
            if (x < minX) minX = x
            if (x > maxX) maxX = x
            if (y < minY) minY = y
            if (y > maxY) maxY = y
          }
        }
        if (safeCount === 0) {
          // Never fallback to full image; fallback to detected chroma mask.
          for (let p = 0; p < pxCount; p += 1) {
            safeMask[p] = coreMask[p]
          }
          minX = w
          minY = h
          maxX = -1
          maxY = -1
          for (let y = 0; y < h; y += 1) {
            for (let x = 0; x < w; x += 1) {
              if (!safeMask[y * w + x]) continue
              if (x < minX) minX = x
              if (x > maxX) maxX = x
              if (y < minY) minY = y
              if (y > maxY) maxY = y
            }
          }
        }
        if (maxX < 0 || maxY < 0) {
          // Final safety: keep previous bounds instead of exposing full canvas.
          minX = Math.floor(w * 0.2)
          minY = Math.floor(h * 0.1)
          maxX = Math.floor(w * 0.8)
          maxY = Math.floor(h * 0.9)
        }

        const targetW = maxX - minX + 1
        const targetH = maxY - minY + 1

        const composeScreenLayer = (screen: HTMLImageElement) => {
          const outCanvas = document.createElement("canvas")
          outCanvas.width = w
          outCanvas.height = h
          const outCtx = outCanvas.getContext("2d")
          if (!outCtx) return ""

          const sW = screen.naturalWidth || screen.width
          const sH = screen.naturalHeight || screen.height

          // Use cover so no black gap appears between frame and inserted image.
          const scale = Math.max(targetW / sW, targetH / sH) * 1.01
          const drawW = sW * scale
          const drawH = sH * scale
          const dx = minX + (targetW - drawW) / 2
          const dy = minY + (targetH - drawH) / 2
          outCtx.drawImage(screen, dx, dy, drawW, drawH)

          // Pixel-accurate matte: keep screen only inside chroma area.
          const screenData = outCtx.getImageData(0, 0, w, h)
          const dst = screenData.data
          for (let p = 0; p < pxCount; p += 1) {
            if (safeMask[p]) continue
            dst[p * 4 + 3] = 0
          }
          outCtx.putImageData(screenData, 0, 0)

          return outCanvas.toDataURL("image/png")
        }

        const composeFrameLayer = () => {
          const outCanvas = document.createElement("canvas")
          outCanvas.width = w
          outCanvas.height = h
          const outCtx = outCanvas.getContext("2d")
          if (!outCtx) return ""

          const outData = outCtx.createImageData(w, h)
          const dst = outData.data

          for (let i = 0; i < srcFrame.length; i += 4) {
            const fr = srcFrame[i]
            const fg = srcFrame[i + 1]
            const fb = srcFrame[i + 2]
            const fa = srcFrame[i + 3]
            if (isGreenPixel(fr, fg, fb, fa)) continue
            dst[i] = fr
            dst[i + 1] = fg
            dst[i + 2] = fb
            dst[i + 3] = fa
          }

          outCtx.putImageData(outData, 0, 0)
          return outCanvas.toDataURL("image/png")
        }

        const composeScreenMask = () => {
          const maskCanvas = document.createElement("canvas")
          maskCanvas.width = w
          maskCanvas.height = h
          const maskCtx = maskCanvas.getContext("2d")
          if (!maskCtx) return ""

          const maskData = maskCtx.createImageData(w, h)
          const dst = maskData.data
          for (let p = 0; p < pxCount; p += 1) {
            const a = safeMask[p] ? 255 : 0
            const i = p * 4
            dst[i] = 255
            dst[i + 1] = 255
            dst[i + 2] = 255
            dst[i + 3] = a
          }
          maskCtx.putImageData(maskData, 0, 0)
          return maskCanvas.toDataURL("image/png")
        }

        const frameLayer = composeFrameLayer()
        const s1 = composeScreenLayer(firstScreen)
        const s2 = composeScreenLayer(secondScreen)
        const s3 = composeScreenLayer(thirdScreen)
        const s4 = composeScreenLayer(fourthScreen)
        const mask = composeScreenMask()

        if (!cancelled) {
          setFrameSrc(frameLayer)
          setScreen1(s1)
          setScreen2(s2)
          setScreen3(s3)
          setScreen4(s4)
          setScreenMaskSrc(mask)
          setSlideIndex(0)
          setIncomingSlideIndex(null)
        }
      } catch {
        if (!cancelled) {
          setFrameSrc("")
          setScreen1("")
          setScreen2("")
          setScreen3("")
          setScreen4("")
          setScreenMaskSrc("")
        }
      }
    }

    buildComposite()
    return () => {
      cancelled = true
    }
  }, [firstSlideSrc, secondSlideSrc, thirdSlideSrc, fourthSlideSrc, onSrc])

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const obs = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry?.isIntersecting) return
        setPlay(true)
        obs.unobserve(entry.target)
      },
      { threshold: 0.35 }
    )

    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!play) return
    if (!screen1 || !screen2 || !screen3 || !screen4 || !frameSrc) return

    const SWAP_AT_MS = 1120
    const IOS_HOLD_MS = 1000
    const IOS_EXIT_MS = 500

    const t1 = window.setTimeout(() => {
      setShowScreen(true)
      setTopScreenSrc(screen1)
      setShowBottomScreen(false)
    }, SWAP_AT_MS)

    const t2 = window.setTimeout(() => {
      setShowBottomScreen(true)
      setIosExiting(true)
    }, SWAP_AT_MS + IOS_HOLD_MS)

    const t3 = window.setTimeout(() => {
      setTopScreenSrc("")
      setIosExiting(false)
    }, SWAP_AT_MS + IOS_HOLD_MS + IOS_EXIT_MS)

    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
      window.clearTimeout(t3)
    }
  }, [play, screen1, screen2, screen3, screen4, frameSrc])

  useEffect(() => {
    const mainEl = document.querySelector("main") as HTMLElement | null
    const prevBodyOverflow = document.body.style.overflow
    const prevMainOverflow = mainEl?.style.overflow

    if (isPhoneHover) {
      document.body.style.overflow = "hidden"
      if (mainEl) mainEl.style.overflow = "hidden"
    }

    return () => {
      document.body.style.overflow = prevBodyOverflow
      if (mainEl && typeof prevMainOverflow === "string") {
        mainEl.style.overflow = prevMainOverflow
      }
    }
  }, [isPhoneHover])

  const slideSources = [screen2, screen3, screen4]
  const isScrolling = incomingSlideIndex !== null

  const triggerScroll = (dir: 1 | -1) => {
    if (!showBottomScreen || isScrolling) return
    const next = slideIndex + dir
    if (next < 0 || next >= slideSources.length) return
    setScrollDir(dir)
    setIncomingSlideIndex(next)
    window.setTimeout(() => {
      setSlideIndex(next)
      setIncomingSlideIndex(null)
    }, 420)
  }

  const goToSlide = (target: number) => {
    if (!showBottomScreen || isScrolling) return
    if (target < 0 || target >= slideSources.length) return
    if (target === slideIndex) return
    triggerScroll(target > slideIndex ? 1 : -1)
  }

  const onWheelScroll = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!showBottomScreen) return
    if (Math.abs(e.deltaY) < 8) return
    const now = performance.now()
    if (now < wheelCooldownUntilRef.current) return
    wheelCooldownUntilRef.current = now + 460
    e.preventDefault()
    triggerScroll(e.deltaY > 0 ? 1 : -1)
  }

  return (
    <div
      ref={ref}
      className={`s03-phone-stage ${isPhoneHover ? "is-phone-hover" : ""} ${className}`}
      aria-hidden="true"
      onPointerEnter={() => setIsPhoneHover(true)}
      onPointerLeave={() => setIsPhoneHover(false)}
      onWheel={onWheelScroll}
    >
      <div className={`s03-phone-anim ${play ? "is-play" : ""}`}>
        <img className="s03-phone s03-phone-off" src={offSrc} alt="" />
        {showScreen ? (
          <div
            className="s03-phone-screen-clip"
            style={
              screenMaskSrc
                ? {
                    WebkitMaskImage: `url(${screenMaskSrc})`,
                    maskImage: `url(${screenMaskSrc})`,
                    WebkitMaskRepeat: "no-repeat",
                    maskRepeat: "no-repeat",
                    WebkitMaskSize: "100% 100%",
                    maskSize: "100% 100%",
                  }
                : undefined
            }
          >
            {showBottomScreen ? (
              <>
                <img
                  className={`s03-phone-screen s03-phone-screen-bottom ${
                    incomingSlideIndex !== null ? (scrollDir === 1 ? "is-exit-up" : "is-exit-down") : ""
                  }`}
                  src={slideSources[slideIndex]}
                  alt=""
                />
                {incomingSlideIndex !== null ? (
                  <img
                    className={`s03-phone-screen s03-phone-screen-incoming ${
                      scrollDir === 1 ? "is-enter-from-down" : "is-enter-from-up"
                    }`}
                    src={slideSources[incomingSlideIndex]}
                    alt=""
                  />
                ) : null}
              </>
            ) : null}
            {topScreenSrc ? (
              <img className={`s03-phone-screen s03-phone-screen-top ${iosExiting ? "is-ios-exit" : ""}`} src={topScreenSrc} alt="" />
            ) : null}
          </div>
        ) : null}

        {showBottomScreen ? (
          <div className={`s03-phone-scroll-controls ${isPhoneHover ? "is-visible" : ""}`}>
            {slideSources.map((_, idx) => (
              <button
                key={`s03-dot-${idx}`}
                type="button"
                className={`s03-phone-scroll-btn ${slideIndex === idx ? "is-active" : ""}`}
                onClick={() => goToSlide(idx)}
                disabled={isScrolling}
                aria-label={`Ir para tela ${idx + 1}`}
              />
            ))}
          </div>
        ) : null}

        <img className="s03-phone s03-phone-frame" src={frameSrc || onSrc} alt="" />
      </div>
    </div>
  )
}

const Section04: React.FC = () => {
  const FILTER_VISIBLE_ROWS = 5
  const [openFilter, setOpenFilter] = useState<string | null>(null)
  const [selectedSecondItem, setSelectedSecondItem] = useState<string | null>(null)
  const [selectedThirdItem, setSelectedThirdItem] = useState<string | null>(null)
  const [selectedAccentItem, setSelectedAccentItem] = useState<string | null>(null)
  const [selectedVoiceName, setSelectedVoiceName] = useState<string | null>(null)
  const [hasExplicitAccentClick, setHasExplicitAccentClick] = useState(false)
  const [middleColumnOffset, setMiddleColumnOffset] = useState(0)
  const [rightColumnOffset, setRightColumnOffset] = useState(0)
  const [detailColumnOffset, setDetailColumnOffset] = useState(0)
  const [rowHeightPx, setRowHeightPx] = useState(1)
  const gridTrapRef = useRef<HTMLDivElement | null>(null)
  const wheelCooldownUntilRef = useRef(0)
  const rightScrollProxyRef = useRef<HTMLDivElement | null>(null)

 const regionCapitals: Record<string, string[]> = {
  NORTE: ["MANAUS", "BELÉM", "PALMAS", "RIO BRANCO", "MACAPÁ", "PORTO VELHO", "BOA VISTA"],
  NORDESTE: ["SALVADOR", "FORTALEZA", "RECIFE", "SÃO LUÍS", "JOÃO PESSOA", "TERESINA", "NATAL", "ARACAJU", "MACEIÓ"],
  SUDESTE: ["SÃO PAULO", "RIO DE JANEIRO", "BELO HORIZONTE", "VITÓRIA"],
  SUL: ["CURITIBA", "PORTO ALEGRE", "FLORIANÓPOLIS"],
  "CENTRO-OESTE": ["BRASÍLIA", "GOIÂNIA", "CUIABÁ", "CAMPO GRANDE"],
}

const capitalAccents: Record<string, string[]> = {
  MANAUS: ["AMAZONENSE LEVE", "AMAZONENSE MARCANTE", "NEUTRO COM NORTISTA"],
  BELÉM: ["PARAENSE LEVE", "PARAENSE MARCANTE", "NORTISTA COMERCIAL"],
  PALMAS: ["TOCANTINENSE LEVE", "TRANSIÇÃO NORTE-CO"],
  "RIO BRANCO": ["ACREANO LEVE", "NORTE INTERIOR"],
  MACAPÁ: ["AMAPAENSE LEVE", "AMAZÔNICO SUAVE"],
  "PORTO VELHO": ["RONDONIENSE LEVE", "MISTO NORTE-CO"],
  "BOA VISTA": ["RORAIMENSE LEVE", "NORTISTA SUAVE"],

  SALVADOR: ["BAIANO LEVE", "BAIANO MARCANTE", "BAIANO COMERCIAL"],
  FORTALEZA: ["CEARENSE LEVE", "CEARENSE FORTE"],
  RECIFE: ["PERNAMBUCANO LEVE", "PERNAMBUCANO FORTE"],
  "SÃO LUÍS": ["MARANHENSE LEVE", "MISTO NORTE-NE"],
  "JOÃO PESSOA": ["PARAIBANO LEVE", "PARAIBANO MARCADO"],
  TERESINA: ["PIAUIENSE LEVE", "PIAUIENSE TRADICIONAL"],
  NATAL: ["POTIGUAR LEVE", "POTIGUAR MARCADO"],
  ARACAJU: ["SERGIPANO LEVE", "SERGIPANO SUAVE"],
  MACEIÓ: ["ALAGOANO LEVE", "ALAGOANO FORTE"],

  "SÃO PAULO": ["PAULISTANO", "INTERIOR PAULISTA", "CAIPIRA LEVE", "NEUTRO NACIONAL"],
  "RIO DE JANEIRO": ["CARIOCA LEVE", "CARIOCA MARCADO", "FLUMINENSE INTERIOR"],
  "BELO HORIZONTE": ["MINEIRO SUAVE", "MINEIRO RAIZ"],
  VITÓRIA: ["CAPIXABA LEVE", "SUDESTE NEUTRO"],

  CURITIBA: ["PARANAENSE LEVE", "SUL COMERCIAL"],
  "PORTO ALEGRE": ["GAÚCHO LEVE", "GAÚCHO TRADICIONAL"],
  FLORIANÓPOLIS: ["CATARINENSE LEVE", "SUL SUAVE"],

  BRASÍLIA: ["NEUTRO INSTITUCIONAL", "CENTRO-OESTE LEVE"],
  GOIÂNIA: ["GOIANO LEVE", "SERTANEJO LEVE"],
  CUIABÁ: ["CUIABANO LEVE", "CENTRO-OESTE MARCADO"],
  "CAMPO GRANDE": ["SUL-MATO-GROSSENSE LEVE", "CENTRO-OESTE TRADICIONAL"],
}

const idiomaFamilies: Record<string, string[]> = {
  INGLÊS: ["AMERICANO", "BRITÂNICO", "AUSTRALIANO", "CANADENSE", "IRLANDÊS", "ESCOCÊS"],
  ESPANHOL: ["ESPANHA", "LATINO", "RIOPLATENSE", "CARIBENHO", "MEXICANO", "ANDINO", "CHILENO", "COLOMBIANO"],
  FRANCÊS: ["FRANÇA", "CANADÁ (QUEBEC)", "BÉLGICA", "SUÍÇA"],
  ALEMÃO: ["ALEMANHA", "ÁUSTRIA", "SUÍÇA"],
  ITALIANO: ["ITÁLIA (PADRÃO)", "NORTE", "SUL"],
  ÁRABE: ["PADRÃO (MSA)", "EGÍPCIO", "LEVANTINO", "GOLFO", "MAGREBINO"],
  MANDARIM: ["PUTONGHUA (PADRÃO)", "TAIWAN", "SINGAPURA"],
  JAPONÊS: ["TOKYO (PADRÃO)", "KANSAI"],
}

const timbreAgeRanges: Record<string, string[]> = {
  GRAVE: ["2 A 5 ANOS", "6 A 12 ANOS", "13 A 17 ANOS", "18 A 25 ANOS", "26 A 35 ANOS", "36 A 50 ANOS", "50+"],
  MÉDIO: ["2 A 5 ANOS", "6 A 12 ANOS", "13 A 17 ANOS", "18 A 25 ANOS", "26 A 35 ANOS", "36 A 50 ANOS", "50+"],
  AGUDO: ["2 A 5 ANOS", "6 A 12 ANOS", "13 A 17 ANOS", "18 A 25 ANOS", "26 A 35 ANOS", "36 A 50 ANOS", "50+"],
  ROUCO: ["18 A 25 ANOS", "26 A 35 ANOS", "36 A 50 ANOS", "50+"],
  SUAVE: ["2 A 5 ANOS", "6 A 12 ANOS", "13 A 17 ANOS", "18 A 25 ANOS", "26 A 35 ANOS", "36 A 50 ANOS", "50+"],
  CORPORATIVO: ["18 A 25 ANOS", "26 A 35 ANOS", "36 A 50 ANOS", "50+"],
}

const estiloIntensity: Record<string, string[]> = {
  IMPACTANTE: ["CONTIDO", "MODERADO", "ALTO", "EXPLOSIVO"],
  CONVERSADO: ["CONTIDO", "MODERADO", "ALTO", "EXPLOSIVO"],
  DRAMÁTICO: ["CONTIDO", "MODERADO", "ALTO", "EXPLOSIVO"],
  "JOVEM DINÂMICO": ["CONTIDO", "MODERADO", "ALTO", "EXPLOSIVO"],
  INSTITUCIONAL: ["CONTIDO", "MODERADO", "ALTO", "EXPLOSIVO"],
}

type VoiceFilter = {
  title: string
  iconSrc?: string
  iconGlyph?: string
  subtitle: string
  items: string[]
  hint: string
}

const voiceFilters: VoiceFilter[] = [
  {
    title: "REGIÃO",
    iconSrc: "/assets/icon/pin-svgrepo-com.svg",
    subtitle: "FILTRO ESTRUTURAL",
    items: ["NORTE", "NORDESTE", "SUDESTE", "SUL", "CENTRO-OESTE"],
    hint: "AQUI VOCÊ ATIVA SEU DIFERENCIAL REGIONALISTA.",
  },
  {
    title: "IDIOMA",
    iconSrc: "/assets/icon/search-globe-svgrepo-com.svg",
    subtitle: "FILTRO ESTRUTURAL",
    items: ["INGLÊS", "ESPANHOL", "FRANCÊS", "ALEMÃO", "ITALIANO", "ÁRABE", "MANDARIM", "JAPONÊS"],
    hint: "AMPLIA O ALCANCE NACIONAL E INTERNACIONAL.",
  },
  {
    title: "TIMBRE",
    iconSrc: "/assets/icon/microphone-svgrepo-com.svg",
    subtitle: "FILTRO TÉCNICO",
    items: ["GRAVE", "MÉDIO", "AGUDO", "ROUCO", "CORPORATIVO", "SUAVE"],
    hint: "ISSO MOSTRA CURADORIA PROFISSIONAL REAL.",
  },
  {
    title: "ESTILO",
    iconSrc: "/assets/icon/play-svgrepo-com.svg",
    subtitle: "FILTRO EMOCIONAL",
    items: ["IMPACTANTE", "CONVERSADO", "DRAMÁTICO", "JOVEM DINÂMICO", "INSTITUCIONAL"],
    hint: "DEFINE A SENSAÇÃO DA VOZ.",
  },
  {
    title: "OBJETIVO",
    iconSrc: "/assets/icon/tag-2-svgrepo-com.svg",
    subtitle: "FILTRO ESTRATÉGICO",
    items: ["VENDER / PERFORMANCE", "INSTITUCIONAL / AUTORIDADE", "BRANDING / IDENTIDADE", "CONTEÚDO DIGITAL", "EXPLICATIVO / EDUCACIONAL"],
    hint: "VOCÊ VENDE RESULTADO, NÃO VOZ.",
  },
]

  const normalizeFilterKey = (label: string) =>
    label
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^A-Za-z]/g, "")
      .toUpperCase()

  const selectedFilter = voiceFilters.find((filter) => filter.title === openFilter) ?? null
  const selectedFilterKey = selectedFilter ? normalizeFilterKey(selectedFilter.title) : ""
  const activeItems = selectedFilter ? selectedFilter.items : []

  const secondaryItemsByFilter: Record<string, Record<string, string[]>> = {
    REGIAO: regionCapitals,
    IDIOMA: idiomaFamilies,
    TIMBRE: timbreAgeRanges,
    ESTILO: estiloIntensity,
  }

  const tertiaryItemsByFilter: Record<string, Record<string, string[]>> = {
    REGIAO: capitalAccents,
  }

  const secondaryMap = selectedFilterKey ? secondaryItemsByFilter[selectedFilterKey] : undefined
  const tertiaryMap = selectedFilterKey ? tertiaryItemsByFilter[selectedFilterKey] : undefined

  const regionAbbrev: Record<string, string> = {
    NORTE: "N",
    NORDESTE: "NE",
    "CENTRO-OESTE": "CO",
    SUDESTE: "SE",
    SUL: "S",
  }

  const thirdColumnItems = selectedSecondItem && secondaryMap ? secondaryMap[selectedSecondItem] ?? [] : []

  const maxMiddleOffset = Math.max(0, activeItems.length - FILTER_VISIBLE_ROWS)
  const visibleMiddleItems = activeItems.slice(middleColumnOffset, middleColumnOffset + FILTER_VISIBLE_ROWS)

  const maxRightOffset = Math.max(0, thirdColumnItems.length - FILTER_VISIBLE_ROWS)
  const visibleThirdColumnItems = thirdColumnItems.slice(rightColumnOffset, rightColumnOffset + FILTER_VISIBLE_ROWS)

  const allFourthColumnItems = selectedThirdItem && tertiaryMap ? tertiaryMap[selectedThirdItem] ?? [] : []
  const fourthColumnItems = allFourthColumnItems

  const maxDetailOffset = Math.max(0, fourthColumnItems.length - FILTER_VISIBLE_ROWS)
  const visibleFourthColumnItems = fourthColumnItems.slice(detailColumnOffset, detailColumnOffset + FILTER_VISIBLE_ROWS)

  const voiceNamePool = [
    "ANA COSTA",
    "BRUNO LIMA",
    "CARLA MENDES",
    "DIEGO ALVES",
    "ELISA RIBEIRO",
    "FELIPE MARTINS",
    "GABRIELA SOUZA",
    "HEITOR NOGUEIRA",
    "ISADORA CAMPOS",
    "JOAO VIEIRA",
    "LARA FREITAS",
    "MATEUS PEREIRA",
    "NATALIA MONTEIRO",
    "OTAVIO SILVA",
    "PAULA DIAS",
  ]

  const getAccentVoiceNames = (accent: string) => {
    const hash = accent.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
    const count = FILTER_VISIBLE_ROWS
    return Array.from({ length: count }).map((_, i) => {
      const idx = (hash + i * 7) % voiceNamePool.length
      return voiceNamePool[idx]
    })
  }

  const compactStateLabel = (label: string) => {
    const uf = label.match(/\(([A-Z]{2})\)/)?.[1]
    if (uf) return uf
    return label
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase()
  }

  const compactAccentLabel = (label: string) => {
    if (label.includes("CAPITAL")) return "CAP"
    const stopWords = new Set(["COM", "DE", "DO", "DA", "E", "LEVE"])
    const initials = label
      .replace(/[()]/g, "")
      .split(/[\s/.-]+/)
      .filter(Boolean)
      .filter((word) => !stopWords.has(word))
      .slice(0, 3)
      .map((word) => word[0])
      .join("")
      .toUpperCase()
    return initials || label.slice(0, 3).toUpperCase()
  }

  const compactInitialsLabel = (label: string) =>
    label
      .replace(/[()]/g, "")
      .split(/[\s/.-]+/)
      .filter(Boolean)
      .map((word) => word[0])
      .join("")
      .toUpperCase()

  const isRegionFilter = selectedFilterKey === "REGIAO"
  const supportsSecondLevel = Boolean(secondaryMap)
  const showRightColumn = selectedSecondItem !== null && thirdColumnItems.length > 0
  const showDetailColumn = selectedThirdItem !== null && fourthColumnItems.length > 0
  const supportsDetailLevel = Boolean(tertiaryMap)

  const selectedLeafItem = supportsDetailLevel ? selectedAccentItem : supportsSecondLevel ? selectedThirdItem : selectedSecondItem
  const showVoiceColumn = hasExplicitAccentClick && selectedLeafItem !== null
  const voiceNames = selectedLeafItem ? getAccentVoiceNames(selectedLeafItem) : []
  const isFlatVoiceMode = showVoiceColumn && !showRightColumn && !showDetailColumn

  const activeSelectionColumn = selectedAccentItem ? 3 : selectedThirdItem ? 2 : selectedSecondItem ? 1 : 0

  const compactCol1 = activeSelectionColumn > 1
  const compactCol2 = activeSelectionColumn > 2
  const compactCol3 = activeSelectionColumn > 3

  const compactSquarePx = Math.max(64, Math.round(rowHeightPx))
  const squareCol = `minmax(${compactSquarePx}px, ${compactSquarePx}px)`
  const fluidCol = "minmax(0,1fr)"

  const rightGridTemplateColumns = isFlatVoiceMode
    ? `${fluidCol} ${fluidCol}`
    : showVoiceColumn
      ? supportsDetailLevel
        ? `${compactCol1 ? squareCol : fluidCol} ${compactCol2 ? squareCol : fluidCol} ${compactCol3 ? squareCol : fluidCol} ${fluidCol}`
        : `${compactCol1 ? squareCol : fluidCol} ${compactCol2 ? squareCol : fluidCol} ${fluidCol}`
      : showDetailColumn
        ? `${compactCol1 ? squareCol : fluidCol} ${compactCol2 ? squareCol : fluidCol} ${fluidCol} ${fluidCol}`
        : showRightColumn
          ? supportsDetailLevel
            ? `${compactCol1 ? squareCol : fluidCol} ${fluidCol} ${fluidCol}`
            : `${compactCol1 ? squareCol : fluidCol} ${fluidCol}`
          : `${fluidCol} ${fluidCol}`

  const activeScrollColumn =
    showDetailColumn && maxDetailOffset > 0 ? "detail" : showRightColumn && maxRightOffset > 0 ? "right" : maxMiddleOffset > 0 ? "middle" : null

  const activeMaxOffset =
    activeScrollColumn === "detail" ? maxDetailOffset : activeScrollColumn === "right" ? maxRightOffset : activeScrollColumn === "middle" ? maxMiddleOffset : 0

  const isLeftCollapsed = selectedSecondItem !== null

  const filterBtnBase = "flex h-full min-h-0 shrink-0 items-center border px-3 py-2 text-left transition-colors duration-200"
  const filterBtnIdle = "border-white/35 bg-transparent hover:border-white/35 hover:bg-transparent sm:hover:border-[#6F89FF] sm:hover:bg-[#1A245C]"
  const filterBtnSelected = "border-[#A987FF] bg-[#5A0A91]"

  const stepActiveColumn = (dir: 1 | -1) => {
    const proxy = rightScrollProxyRef.current
    if (!activeScrollColumn || activeMaxOffset <= 0) return

    const update = (prev: number) => {
      const next = Math.max(0, Math.min(activeMaxOffset, prev + dir))
      if (proxy) proxy.scrollTop = next * rowHeightPx
      return next
    }

    if (activeScrollColumn === "middle") {
      setMiddleColumnOffset(update)
      return
    }
    if (activeScrollColumn === "right") {
      setRightColumnOffset(update)
      return
    }
    setDetailColumnOffset(update)
  }

  useEffect(() => {
    setMiddleColumnOffset(0)
    setRightColumnOffset(0)
    setDetailColumnOffset(0)
    setSelectedThirdItem(null)
    setSelectedAccentItem(null)
    setHasExplicitAccentClick(false)
    setSelectedVoiceName(null)
    const proxy = rightScrollProxyRef.current
    if (proxy) proxy.scrollTop = 0
  }, [openFilter])

  useEffect(() => {
    if (!selectedSecondItem) {
      setSelectedThirdItem(null)
      setSelectedAccentItem(null)
      setHasExplicitAccentClick(false)
      setSelectedVoiceName(null)
      return
    }

    const secondLevelItems = secondaryMap?.[selectedSecondItem] ?? []
    if (!secondLevelItems.length) {
      setSelectedThirdItem(null)
      setSelectedAccentItem(null)
      setHasExplicitAccentClick(!supportsSecondLevel)
      setDetailColumnOffset(0)
      setSelectedVoiceName(null)
      return
    }

    setSelectedThirdItem((prev) => (prev && secondLevelItems.includes(prev) ? prev : null))
    setSelectedAccentItem(null)
    setHasExplicitAccentClick(false)
    setSelectedVoiceName(null)
    setDetailColumnOffset(0)
  }, [selectedSecondItem, selectedFilter?.title, supportsSecondLevel])

  useEffect(() => {
    if (!selectedThirdItem) {
      setSelectedAccentItem(null)
      setSelectedVoiceName(null)
      return
    }

    const thirdLevelItems = tertiaryMap?.[selectedThirdItem] ?? []
    if (thirdLevelItems.length) {
      setSelectedAccentItem((prev) => (prev && thirdLevelItems.includes(prev) ? prev : null))
    } else {
      setSelectedAccentItem(null)
    }

    setDetailColumnOffset(0)
    setSelectedVoiceName(null)
    const proxy = rightScrollProxyRef.current
    if (proxy) proxy.scrollTop = 0
  }, [selectedThirdItem, selectedFilter?.title])

  useEffect(() => {
    const el = gridTrapRef.current
    if (!el) return

    const onWheel = (ev: WheelEvent) => {
      ev.preventDefault()
      ev.stopPropagation()
      if (typeof (ev as any).stopImmediatePropagation === "function") {
        ;(ev as any).stopImmediatePropagation()
      }
      if (activeMaxOffset <= 0) return

      const now = performance.now()
      if (now < wheelCooldownUntilRef.current) return
      wheelCooldownUntilRef.current = now + 140
      if (Math.abs(ev.deltaY) < 6) return

      stepActiveColumn(ev.deltaY > 0 ? 1 : -1)
    }

    el.addEventListener("wheel", onWheel, { passive: false })
    return () => {
      el.removeEventListener("wheel", onWheel as EventListener)
    }
  }, [activeMaxOffset, activeScrollColumn, rowHeightPx])

  useEffect(() => {
    const el = gridTrapRef.current
    if (!el) return

    const sync = () => {
      const gridEl = el.firstElementChild as HTMLElement | null
      const gridHeight = (gridEl ?? el).getBoundingClientRect().height
      const gapSource = gridEl ? getComputedStyle(gridEl) : null
      const rowGap = Number.parseFloat(gapSource?.rowGap ?? "0") || 0
      const totalGap = Math.max(0, FILTER_VISIBLE_ROWS - 1) * rowGap
      const next = Math.max(1, (gridHeight - totalGap) / FILTER_VISIBLE_ROWS)
      setRowHeightPx((prev) => (Math.abs(prev - next) < 0.1 ? prev : next))
    }

    sync()
    const ro = new ResizeObserver(sync)
    ro.observe(el)
    window.addEventListener("resize", sync)
    return () => {
      ro.disconnect()
      window.removeEventListener("resize", sync)
    }
  }, [])

  useEffect(() => {
    const proxy = rightScrollProxyRef.current
    if (!proxy) return

    if (activeScrollColumn === "middle") {
      proxy.scrollTop = middleColumnOffset * rowHeightPx
      return
    }
    if (activeScrollColumn === "right") {
      proxy.scrollTop = rightColumnOffset * rowHeightPx
      return
    }
    if (activeScrollColumn === "detail") {
      proxy.scrollTop = detailColumnOffset * rowHeightPx
      return
    }
    proxy.scrollTop = 0
  }, [activeScrollColumn, middleColumnOffset, rightColumnOffset, detailColumnOffset, rowHeightPx])

  return (
    <section id="secao-04" data-header-theme="dark" className="relative isolate h-auto sm:h-[100svh] overflow-visible sm:snap-start sm:snap-always sm:overflow-hidden">
      <div
        className="s04-fluid-bg absolute inset-0"
        aria-hidden="true"
        style={{
          backgroundColor: "#6F52AD",
          backgroundImage: `
            radial-gradient(58% 50% at 10% 18%, rgba(132,76,187,0.92), transparent 68%),
            radial-gradient(52% 46% at 88% 16%, rgba(39, 32, 129, 0.82), transparent 66%),
            radial-gradient(60% 55% at 20% 84%, rgba(132,76,187,0.9), transparent 70%),
            radial-gradient(56% 52% at 84% 82%, rgba(132,76,187,0.8), transparent 68%),
            linear-gradient(180deg, #6F52AD 0%, #6F52AD 34%, #6F52AD 66%, #0E1A37 100%)
          `,
          mixBlendMode: "normal",
          animation: "sec02Fluid 3s ease-in-out infinite",
          opacity: 0.9,
          filter: "invert(1) hue-rotate(180deg)",
          transformOrigin: "center",
          willChange: "transform, filter",
        }}
      />
      <div
        className="s04-grain-bg absolute inset-0 z-[2]"
        aria-hidden="true"
        style={{
          backgroundImage: "radial-gradient(rgba(0,0,0,0.1) 0.7px, transparent 0.7px)",
          backgroundSize: "3px 3px",
          opacity: 0.22,
          animation: "sec02Grain 5s steps(8, end) infinite",
          mixBlendMode: "soft-light",
          willChange: "transform",
        }}
      />

      <div className="relative z-10 m-0 grid h-auto sm:m-4 sm:h-[calc(100svh-2rem)] grid-rows-[auto_1fr] rounded-none sm:rounded-[28px] px-6 sm:px-12 lg:px-16">
        <div className="flex items-center justify-center px-6 pt-12 sm:px-12 sm:pt-28 lg:px-16">
          <span className='inline-flex items-center rounded-none border border-white/30 px-4 py-2 text-xs font-thin tracking-[0.3em] text-white/80 font-barlow-thin'>
            AS VOZES
          </span>
        </div>

        <div className="mx-auto mt-9 flex w-full max-w-[1800px] items-start px-0 pb-10 sm:mt-0 sm:items-center sm:pb-12 lg:pb-14">
          <div className="grid w-full grid-cols-1 items-start gap-8 xl:grid-cols-[minmax(0,450px)_minmax(0,1fr)] xl:gap-10">
            <div className="flex max-w-[450px] flex-col justify-center self-start sm:self-center">
              <h2 className="section-main-title font-secular mt-0 font-semibold uppercase leading-[0.92] tracking-[-0.02em] text-white">
                LOCUTORES
              </h2>
              <p className="font-barlow-thin section-body-copy mt-10 max-w-[450px] text-white/88">
                Voz humana. Sotaque nativo.
Representamos vozes do Brasil e do exterior, com múltiplos sotaques, idiomas e estilos. Fazemos a curadoria e a intermediação completa para que você encontre a voz certa sem ruído no caminho.

              </p>
            </div>

            <div
              className={`grid h-full grid-cols-1 gap-4 xl:h-[400px] ${
                isLeftCollapsed ? "xl:grid-cols-[minmax(0,96px)_minmax(0,1fr)]" : "xl:grid-cols-[minmax(0,320px)_minmax(0,1fr)]"
              }`}
            >
              <div className="grid grid-cols-1 gap-3 xl:hidden">
                {voiceFilters.map((filter) => {
                  const isOpen = openFilter === filter.title
                  return (
                    <div key={`mobile-filter-${filter.title}`} className="grid grid-cols-1 gap-0">
                      <button
                        type="button"
                        onClick={() => {
                          if (openFilter === filter.title) {
                            setOpenFilter(null)
                            setSelectedSecondItem(null)
                            setSelectedThirdItem(null)
                            setSelectedAccentItem(null)
                            setHasExplicitAccentClick(false)
                            return
                          }
                          setOpenFilter(filter.title)
                          setSelectedSecondItem(null)
                          setSelectedThirdItem(null)
                          setSelectedAccentItem(null)
                          setHasExplicitAccentClick(false)
                        }}
                        className={`flex h-auto min-h-[2.8rem] cursor-pointer items-center border px-4 py-2.5 transition-colors duration-200 ${
                          isOpen ? filterBtnSelected : filterBtnIdle
                        }`}
                        aria-label={filter.title}
                      >
                        <span className="flex w-full items-center gap-3 justify-start">
                          {filter.iconSrc ? (
                            <img
                              src={filter.iconSrc}
                              alt=""
                              aria-hidden="true"
                              className="h-[20px] w-[20px] shrink-0 object-contain brightness-0 invert"
                              draggable={false}
                            />
                          ) : filter.iconGlyph ? (
                            <span className="inline-block w-[20px] text-center text-[18px] leading-none text-white">{filter.iconGlyph}</span>
                          ) : null}

                          <span className="font-secular text-[20px] leading-[1.02] tracking-[0.04em] text-white">
                            {filter.title}
                          </span>
                        </span>
                      </button>

                      <div
                        className={`overflow-hidden transition-[max-height,opacity,transform,margin] duration-300 ease-out ${
                          isOpen ? "mt-2 max-h-[1400px] opacity-100 translate-y-0" : "max-h-0 opacity-0 -translate-y-1 pointer-events-none"
                        }`}
                      >
                        <div className="grid grid-cols-1 gap-2">
                          {filter.items.map((item) => {
                            const isSelected = selectedSecondItem === item
                            const localFilterKey = normalizeFilterKey(filter.title)
                            const localSecondaryMap = secondaryItemsByFilter[localFilterKey]
                            const localTertiaryMap = tertiaryItemsByFilter[localFilterKey]
                            const secondLevelItems = localSecondaryMap?.[item] ?? []

                            return (
                              <React.Fragment key={`mobile-option-wrap-${filter.title}-${item}`}>
                                <button
                                  key={`mobile-option-${filter.title}-${item}`}
                                  type="button"
                                  onClick={() => {
                                    if (selectedSecondItem === item) {
                                      setSelectedSecondItem(null)
                                      setSelectedThirdItem(null)
                                      setSelectedAccentItem(null)
                                      setHasExplicitAccentClick(false)
                                      return
                                    }
                                    const hasSecondLevelForItem = secondLevelItems.length > 0
                                    setSelectedSecondItem(item)
                                    setSelectedThirdItem(null)
                                    setSelectedAccentItem(null)
                                    setHasExplicitAccentClick(!hasSecondLevelForItem)
                                  }}
                                  className={`${filterBtnBase} ${isSelected ? filterBtnSelected : filterBtnIdle}`}
                                >
                                  <span className="font-barlow-thin text-[12px] uppercase tracking-[0.18em] text-white/90">
                                    {item}
                                  </span>
                                </button>

                                {isSelected && secondLevelItems.length > 0 ? (
                                  <div className="grid grid-cols-1 gap-2 pl-4">
                                    {secondLevelItems.map((rightItem) => {
                                      const isRightSelected = selectedThirdItem === rightItem
                                      const thirdLevelItems = localTertiaryMap?.[rightItem] ?? []
                                      const hasFourthLevelForItem = thirdLevelItems.length > 0

                                      return (
                                        <React.Fragment key={`mobile-l2-wrap-${filter.title}-${item}-${rightItem}`}>
                                          <button
                                            key={`mobile-l2-${filter.title}-${rightItem}`}
                                            type="button"
                                            onClick={() => {
                                              if (selectedThirdItem === rightItem) {
                                                setSelectedThirdItem(null)
                                                setSelectedAccentItem(null)
                                                setHasExplicitAccentClick(false)
                                                return
                                              }
                                              setSelectedThirdItem(rightItem)
                                              setSelectedAccentItem(null)
                                              setHasExplicitAccentClick(!hasFourthLevelForItem)
                                            }}
                                            className={`${filterBtnBase} ${isRightSelected ? filterBtnSelected : filterBtnIdle}`}
                                          >
                                            <span className="font-barlow-thin text-[12px] uppercase tracking-[0.18em] text-white/90">
                                              {rightItem}
                                            </span>
                                          </button>

                                          {isRightSelected && thirdLevelItems.length > 0 ? (
                                            <div className="grid grid-cols-1 gap-2 pl-4">
                                              {thirdLevelItems.map((detailItem) => {
                                                const isDetailSelected = selectedAccentItem === detailItem
                                                return (
                                                  <React.Fragment key={`mobile-l3-wrap-${filter.title}-${item}-${rightItem}-${detailItem}`}>
                                                    <button
                                                      key={`mobile-l3-${filter.title}-${detailItem}`}
                                                      type="button"
                                                      onClick={() => {
                                                        if (selectedAccentItem === detailItem) {
                                                          setSelectedAccentItem(null)
                                                          setHasExplicitAccentClick(false)
                                                          return
                                                        }
                                                        setSelectedAccentItem(detailItem)
                                                        setHasExplicitAccentClick(true)
                                                      }}
                                                      className={`${filterBtnBase} ${isDetailSelected ? filterBtnSelected : filterBtnIdle}`}
                                                    >
                                                      <span className="font-barlow-thin text-[11px] uppercase tracking-[0.14em] text-white/90">
                                                        {detailItem}
                                                      </span>
                                                    </button>

                                                    {isDetailSelected && showVoiceColumn && voiceNames.length > 0 ? (
                                                      <div className="grid grid-cols-1 gap-2 pl-4">
                                                        {voiceNames.map((accentVoiceName) => (
                                                          <div
                                                            key={`mobile-voice-${filter.title}-${accentVoiceName}`}
                                                            className={`${filterBtnBase} w-full ${selectedVoiceName === accentVoiceName ? filterBtnSelected : filterBtnIdle}`}
                                                          >
                                                            <div className="flex w-full items-center justify-between gap-2">
                                                              <span className="font-barlow-thin text-[11px] uppercase tracking-[0.14em] text-white/90">{accentVoiceName}</span>
                                                              <button
                                                                type="button"
                                                                className={`inline-flex h-7 w-7 items-center justify-center rounded-none border text-[10px] text-white ${
                                                                  selectedVoiceName === accentVoiceName ? "border-[#A987FF] bg-[#5A0A91]" : "border-white/50"
                                                                }`}
                                                                aria-label={`Ouvir ${accentVoiceName}`}
                                                                onClick={() =>
                                                                  setSelectedVoiceName((prev) => (prev === accentVoiceName ? null : accentVoiceName))
                                                                }
                                                              >
                                                                <img
                                                                  src="/assets/icon/play-svgrepo-com.svg"
                                                                  alt=""
                                                                  aria-hidden="true"
                                                                  className="h-3.5 w-3.5 brightness-0 invert"
                                                                  draggable={false}
                                                                />
                                                              </button>
                                                            </div>
                                                          </div>
                                                        ))}
                                                      </div>
                                                    ) : null}
                                                  </React.Fragment>
                                                )
                                              })}
                                            </div>
                                          ) : null}

                                          {isRightSelected && thirdLevelItems.length === 0 && showVoiceColumn && voiceNames.length > 0 ? (
                                            <div className="grid grid-cols-1 gap-2 pl-4">
                                              {voiceNames.map((accentVoiceName) => (
                                                <div
                                                  key={`mobile-voice-${filter.title}-${accentVoiceName}`}
                                                  className={`${filterBtnBase} w-full ${selectedVoiceName === accentVoiceName ? filterBtnSelected : filterBtnIdle}`}
                                                >
                                                  <div className="flex w-full items-center justify-between gap-2">
                                                    <span className="font-barlow-thin text-[11px] uppercase tracking-[0.14em] text-white/90">{accentVoiceName}</span>
                                                    <button
                                                      type="button"
                                                      className={`inline-flex h-7 w-7 items-center justify-center rounded-none border text-[10px] text-white ${
                                                        selectedVoiceName === accentVoiceName ? "border-[#A987FF] bg-[#5A0A91]" : "border-white/50"
                                                      }`}
                                                      aria-label={`Ouvir ${accentVoiceName}`}
                                                      onClick={() =>
                                                        setSelectedVoiceName((prev) => (prev === accentVoiceName ? null : accentVoiceName))
                                                      }
                                                    >
                                                      <img
                                                        src="/assets/icon/play-svgrepo-com.svg"
                                                        alt=""
                                                        aria-hidden="true"
                                                        className="h-3.5 w-3.5 brightness-0 invert"
                                                        draggable={false}
                                                      />
                                                    </button>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          ) : null}
                                        </React.Fragment>
                                      )
                                    })}
                                  </div>
                                ) : null}
                              </React.Fragment>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="hidden h-full grid-cols-1 grid-rows-5 gap-3 xl:grid">
                {voiceFilters.map((filter) => (
                  <button
                    key={filter.title}
                    type="button"
                    onClick={() => {
                      setOpenFilter(filter.title)
                      setSelectedSecondItem(null)
                      setSelectedThirdItem(null)
                      setSelectedAccentItem(null)
                      setHasExplicitAccentClick(false)
                    }}
                    className={`flex h-auto min-h-[2.8rem] cursor-pointer items-center border px-4 py-2.5 transition-colors duration-200 sm:h-full sm:min-h-0 sm:py-0 ${
                      openFilter === filter.title ? filterBtnSelected : filterBtnIdle
                    }`}
                    aria-label={filter.title}
                  >
                    <span className={`flex w-full items-center gap-3 ${isLeftCollapsed ? "justify-center" : "justify-start"}`}>
                      {filter.iconSrc ? (
                        <img
                          src={filter.iconSrc}
                          alt=""
                          aria-hidden="true"
                          className="h-[20px] w-[20px] shrink-0 object-contain brightness-0 invert"
                          draggable={false}
                        />
                      ) : filter.iconGlyph ? (
                        <span className="inline-block w-[20px] text-center text-[18px] leading-none text-white">{filter.iconGlyph}</span>
                      ) : null}

                      <span
                        className={`font-secular text-[20px] leading-[1.02] tracking-[0.04em] text-white ${isLeftCollapsed ? "hidden" : ""}`}
                      >
                        {filter.title}
                      </span>
                    </span>
                  </button>
                ))}
              </div>

              <div ref={gridTrapRef} className="relative hidden h-full xl:block" style={{ overscrollBehavior: "contain" }}>
                <div className="grid h-full grid-rows-5 gap-3 pr-1" style={{ gridTemplateColumns: rightGridTemplateColumns }}>
                  {Array.from({ length: FILTER_VISIBLE_ROWS }).map((_, itemIndex) => {
                    const middleItem = visibleMiddleItems[itemIndex]
                    const rightItem = visibleThirdColumnItems[itemIndex]
                    const detailItem = visibleFourthColumnItems[itemIndex]
                    const accentVoiceName = voiceNames[itemIndex]

                    if (isFlatVoiceMode) {
                      return (
                        <React.Fragment key={`row-flat-${itemIndex}`}>
                          {middleItem ? (
                            <button
                              type="button"
                              onClick={() => {
                                const hasSecondLevelForItem = (secondaryMap?.[middleItem] ?? []).length > 0
                                setSelectedSecondItem(middleItem)
                                setSelectedThirdItem(null)
                                setSelectedAccentItem(null)
                                setHasExplicitAccentClick(!hasSecondLevelForItem)
                              }}
                              className={`${filterBtnBase} ${selectedSecondItem === middleItem ? filterBtnSelected : filterBtnIdle}`}
                            >
                              <span className="font-barlow-thin text-[12px] uppercase tracking-[0.18em] text-white/90">{middleItem}</span>
                            </button>
                          ) : (
                            <div className="relative flex h-full min-h-0 items-center overflow-hidden border border-white/25 bg-white/5 px-3 py-2" aria-hidden="true">
                              <div className="h-[10px] w-[72%] rounded bg-white/20" />
                              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[sec04-shimmer_1.2s_ease-in-out_infinite]" />
                            </div>
                          )}

                          {accentVoiceName ? (
                            <div className={`${filterBtnBase} w-full ${selectedVoiceName === accentVoiceName ? filterBtnSelected : filterBtnIdle}`}>
                              <div className="flex w-full items-center justify-between gap-2">
                                <span className="font-barlow-thin text-[11px] uppercase tracking-[0.14em] text-white/90">{accentVoiceName}</span>
                                <button
                                  type="button"
                                  className={`inline-flex h-7 w-7 items-center justify-center rounded-none border text-[10px] text-white ${
                                    selectedVoiceName === accentVoiceName ? "border-[#A987FF] bg-[#5A0A91]" : "border-white/50"
                                  }`}
                                  aria-label={`Ouvir ${accentVoiceName}`}
                                  onClick={() =>
                                    setSelectedVoiceName((prev) => (prev === accentVoiceName ? null : accentVoiceName))
                                  }
                                >
                                  <img
                                    src="/assets/icon/play-svgrepo-com.svg"
                                    alt=""
                                    aria-hidden="true"
                                    className="h-3.5 w-3.5 brightness-0 invert"
                                    draggable={false}
                                  />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="relative flex h-full min-h-0 items-center overflow-hidden border border-white/25 bg-white/5 px-3 py-2" aria-hidden="true">
                              <div className="h-[10px] w-[72%] rounded bg-white/20" />
                              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[sec04-shimmer_1.2s_ease-in-out_infinite]" />
                            </div>
                          )}
                        </React.Fragment>
                      )
                    }

                    const middleDisplayItem =
                      compactCol1 && middleItem ? (isRegionFilter ? regionAbbrev[middleItem] ?? middleItem : compactInitialsLabel(middleItem)) : middleItem
                    const rightDisplayItem =
                      compactCol2 && rightItem ? (isRegionFilter ? compactStateLabel(rightItem) : compactInitialsLabel(rightItem)) : rightItem
                    const detailDisplayItem =
                      compactCol3 && detailItem ? (isRegionFilter ? compactAccentLabel(detailItem) : compactInitialsLabel(detailItem)) : detailItem

                    return (
                      <React.Fragment key={`row-${itemIndex}`}>
                        {middleItem ? (
                          <button
                            type="button"
                            onClick={() => {
                              const hasSecondLevelForItem = (secondaryMap?.[middleItem] ?? []).length > 0
                              setSelectedSecondItem(middleItem)
                              setSelectedThirdItem(null)
                              setSelectedAccentItem(null)
                              setHasExplicitAccentClick(!hasSecondLevelForItem)
                            }}
                            className={`${filterBtnBase} ${selectedSecondItem === middleItem ? filterBtnSelected : filterBtnIdle} ${compactCol1 ? "justify-center px-0 text-center" : ""}`}
                          >
                            <span className={`font-barlow-thin text-[12px] uppercase tracking-[0.18em] text-white/90 ${compactCol1 ? "w-full text-center" : ""}`}>
                              {middleDisplayItem}
                            </span>
                          </button>
                        ) : (
                          <div className="relative flex h-full min-h-0 items-center overflow-hidden border border-white/25 bg-white/5 px-3 py-2" aria-hidden="true">
                            <div className="h-[10px] w-[72%] rounded bg-white/20" />
                            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[sec04-shimmer_1.2s_ease-in-out_infinite]" />
                          </div>
                        )}

                        {showRightColumn ? (
                          rightItem ? (
                            <button
                              type="button"
                              onClick={() => {
                                const hasFourthLevelForItem = (tertiaryMap?.[rightItem] ?? []).length > 0
                                setSelectedThirdItem(rightItem)
                                setSelectedAccentItem(null)
                                setHasExplicitAccentClick(!hasFourthLevelForItem)
                              }}
                              className={`${filterBtnBase} ${selectedThirdItem === rightItem ? filterBtnSelected : filterBtnIdle} ${compactCol2 ? "justify-center px-0 text-center" : ""}`}
                            >
                              <span className={`font-barlow-thin text-[12px] uppercase tracking-[0.18em] text-white/90 ${compactCol2 ? "w-full text-center" : ""}`}>
                                {rightDisplayItem}
                              </span>
                            </button>
                          ) : (
                            <div className="relative flex h-full min-h-0 items-center overflow-hidden border border-white/25 bg-white/5 px-3 py-2" aria-hidden="true">
                              <div className="h-[10px] w-[72%] rounded bg-white/20" />
                              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[sec04-shimmer_1.2s_ease-in-out_infinite]" />
                            </div>
                          )
                        ) : (
                          <div className="relative flex h-full min-h-0 items-center overflow-hidden border border-white/25 bg-white/5 px-3 py-2" aria-hidden="true">
                            <div className="h-[10px] w-[72%] rounded bg-white/20" />
                            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[sec04-shimmer_1.2s_ease-in-out_infinite]" />
                          </div>
                        )}

                        {showDetailColumn ? (
                          detailItem ? (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedAccentItem(detailItem)
                                setHasExplicitAccentClick(true)
                              }}
                              className={`${filterBtnBase} w-full ${selectedAccentItem === detailItem ? filterBtnSelected : filterBtnIdle} ${compactCol3 ? "justify-center px-0 text-center" : ""}`}
                            >
                              <span className={`font-barlow-thin text-[11px] uppercase tracking-[0.14em] text-white/90 ${compactCol3 ? "w-full text-center" : ""}`}>
                                {detailDisplayItem}
                              </span>
                            </button>
                          ) : (
                            <div className="relative flex h-full min-h-0 items-center overflow-hidden border border-white/25 bg-white/5 px-3 py-2" aria-hidden="true">
                              <div className="h-[10px] w-[72%] rounded bg-white/20" />
                              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[sec04-shimmer_1.2s_ease-in-out_infinite]" />
                            </div>
                          )
                        ) : showRightColumn && supportsDetailLevel ? (
                          <div className="relative flex h-full min-h-0 items-center overflow-hidden border border-white/25 bg-white/5 px-3 py-2" aria-hidden="true">
                            <div className="h-[10px] w-[72%] rounded bg-white/20" />
                            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[sec04-shimmer_1.2s_ease-in-out_infinite]" />
                          </div>
                        ) : null}

                        {showVoiceColumn ? (
                          accentVoiceName ? (
                            <div className={`${filterBtnBase} w-full ${selectedVoiceName === accentVoiceName ? filterBtnSelected : filterBtnIdle}`}>
                              <div className="flex w-full items-center justify-between gap-2">
                                <span className="font-barlow-thin text-[11px] uppercase tracking-[0.14em] text-white/90">{accentVoiceName}</span>
                                <button
                                  type="button"
                                  className={`inline-flex h-7 w-7 items-center justify-center rounded-none border text-[10px] text-white ${
                                    selectedVoiceName === accentVoiceName ? "border-[#A987FF] bg-[#5A0A91]" : "border-white/50"
                                  }`}
                                  aria-label={`Ouvir ${accentVoiceName}`}
                                  onClick={() =>
                                    setSelectedVoiceName((prev) => (prev === accentVoiceName ? null : accentVoiceName))
                                  }
                                >
                                  <img
                                    src="/assets/icon/play-svgrepo-com.svg"
                                    alt=""
                                    aria-hidden="true"
                                    className="h-3.5 w-3.5 brightness-0 invert"
                                    draggable={false}
                                  />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="relative flex h-full min-h-0 items-center overflow-hidden border border-white/25 bg-white/5 px-3 py-2" aria-hidden="true">
                              <div className="h-[10px] w-[72%] rounded bg-white/20" />
                              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[sec04-shimmer_1.2s_ease-in-out_infinite]" />
                            </div>
                          )
                        ) : showDetailColumn ? (
                          <div className="relative flex h-full min-h-0 items-center overflow-hidden border border-white/25 bg-white/5 px-3 py-2" aria-hidden="true">
                            <div className="h-[10px] w-[72%] rounded bg-white/20" />
                            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[sec04-shimmer_1.2s_ease-in-out_infinite]" />
                          </div>
                        ) : null}
                      </React.Fragment>
                    )
                  })}
                </div>

                <div
                  ref={rightScrollProxyRef}
                  className={`absolute -right-2 top-0 z-20 h-full w-3 overflow-y-scroll ${activeMaxOffset > 0 ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                  style={{ scrollbarWidth: "thin", overscrollBehavior: "contain" }}
                  onWheelCapture={(e) => e.stopPropagation()}
                  onScroll={(e) => {
                    const target = e.currentTarget
                    const nextOffset = Math.min(activeMaxOffset, Math.max(0, Math.round(target.scrollTop / rowHeightPx)))
                    if (activeScrollColumn === "middle") {
                      setMiddleColumnOffset(nextOffset)
                      return
                    }
                    if (activeScrollColumn === "right") {
                      setRightColumnOffset(nextOffset)
                      return
                    }
                    if (activeScrollColumn === "detail") {
                      setDetailColumnOffset(nextOffset)
                    }
                  }}
                  aria-hidden="true"
                >
                  <div style={{ height: `${Math.max(FILTER_VISIBLE_ROWS + 1, activeMaxOffset + FILTER_VISIBLE_ROWS) * rowHeightPx}px` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes sec04-shimmer {
          100% { transform: translateX(200%); }
        }
        @media (max-width: 639px) {
          .s04-fluid-bg,
          .s04-grain-bg {
            animation: none !important;
          }
          div[aria-hidden="true"][class*="bg-white/5"] {
            background-color: transparent !important;
          }
          div[aria-hidden="true"] > div[class*="bg-white/20"],
          div[aria-hidden="true"] > div[class*="animate-[sec04-shimmer"] {
            display: none !important;
          }
        }
      `}</style>
    </section>
  )
}

export default Section04

