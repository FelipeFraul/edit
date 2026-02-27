import React, { useEffect, useMemo, useRef, useState } from "react"

type Pos = -3 | -2 | -1 | 0 | 1 | 2 | 3

type StageDialProps = {
  value: Pos
  onChange: (value: Pos) => void
  onPush?: () => void
  ariaLabel?: string
}

const positions: Pos[] = [-3, -2, -1, 0, 1, 2, 3]
const DEFAULT_PUSH_HALF_WIDTH_PX = 58
const PUSH_VISUAL_MARGIN_EDGE_PX = 8
const PUSH_HALO_BLEED_PX = 16
const PUSH_PSEUDO_INSET_PX = 14
const EDGE_EPSILON = 1e-4

const clampPos = (n: number): Pos => {
  if (n <= -3) return -3
  if (n === -2) return -2
  if (n === -1) return -1
  if (n === 0) return 0
  if (n === 1) return 1
  if (n === 2) return 2
  return 3
}

const posToIdx = (p: Pos) => {
  const i = positions.indexOf(p)
  return i < 0 ? 3 : i
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3)
}

type ArrowPillProps = {
  onLeft: () => void
  onRight: () => void
  onGrab?: () => void
  onPush?: () => void
  onDragStart?: (clientX: number) => void
  onDragMove?: (clientX: number) => void
  onDragEnd?: (clientX: number) => void
  onHoverChange?: (hovered: boolean) => void
  keepGlow?: boolean
}

function ArrowPill({
  onLeft,
  onRight,
  onGrab,
  onPush,
  onDragStart,
  onDragMove,
  onDragEnd,
  onHoverChange,
  keepGlow = false,
}: ArrowPillProps) {
  const dragThresholdPx = 6
  const pointerDownXRef = useRef<number | null>(null)
  const dragStartedRef = useRef(false)

  const triggerTapAction = (event: React.PointerEvent<HTMLButtonElement>) => {
    const r = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - r.left
    const leftZone = r.width * 0.33
    const rightZone = r.width * 0.67
    if (x <= leftZone) return onLeft()
    if (x >= rightZone) return onRight()
    onPush?.()
  }

  return (
    <button
      type="button"
      aria-label="PUSH"
      onPointerDown={(e) => {
        e.stopPropagation()
        pointerDownXRef.current = e.clientX
        dragStartedRef.current = false
        e.currentTarget.setPointerCapture(e.pointerId)
        onGrab?.()
      }}
      onPointerMove={(e) => {
        if (pointerDownXRef.current === null) return
        const moved = Math.abs(e.clientX - pointerDownXRef.current)
        if (!dragStartedRef.current && moved >= dragThresholdPx) {
          dragStartedRef.current = true
          onDragStart?.(pointerDownXRef.current)
        }
        if (dragStartedRef.current) onDragMove?.(e.clientX)
      }}
      onPointerUp={(e) => {
        e.stopPropagation()
        if (dragStartedRef.current) onDragEnd?.(e.clientX)
        else triggerTapAction(e)
        pointerDownXRef.current = null
        dragStartedRef.current = false
      }}
      onPointerCancel={(e) => {
        e.stopPropagation()
        if (dragStartedRef.current) onDragEnd?.(e.clientX)
        pointerDownXRef.current = null
        dragStartedRef.current = false
      }}
      onPointerEnter={() => onHoverChange?.(true)}
      onPointerLeave={() => onHoverChange?.(false)}
      onFocus={() => onHoverChange?.(true)}
      onBlur={() => onHoverChange?.(false)}
      onKeyDown={(e) => {
        if (e.key !== "Enter" && e.key !== " ") return
        e.preventDefault()
        onPush?.()
      }}
      className={[
      "group relative z-10 inline-flex h-9 w-[116px] select-none items-center justify-center rounded-none px-0",
        "touch-none push-ew-cursor",
        "border border-white/25 bg-white/5 text-white backdrop-blur-md",
        "transition-[box-shadow,border-color,transform,background-color] duration-200 ease-out",
        "hover:border-white/55 active:border-white/70",
        "hover:shadow-[0_0_18px_rgba(255,255,255,0.45)]",
        "active:shadow-[0_0_26px_rgba(255,255,255,0.65)]",
        "before:pointer-events-none before:absolute before:inset-[-14px] before:rounded-full before:opacity-0",
        "before:bg-[radial-gradient(closest-side,rgba(255,255,255,0.22),rgba(255,255,255,0)_70%)]",
        "before:blur-xl before:transition-opacity before:duration-200",
        "hover:before:opacity-100 active:before:opacity-100",
        keepGlow ? "!border-white/70" : "",
      ].join(" ")}
    >
      <span className="pointer-events-none relative inline-flex items-center justify-center gap-2 text-[10px] font-semibold tracking-[0.2em] text-white/60 transition-colors group-hover:text-white/90">
        <img
          src="/assets/icon/left-2-svgrepo-com.svg"
          alt=""
          aria-hidden="true"
          className="h-[18px] w-[18px] object-contain brightness-0 invert opacity-90 transition-opacity group-hover:opacity-100"
        />
        <span>PUSH</span>
        <img
          src="/assets/icon/right-2-svgrepo-com.svg"
          alt=""
          aria-hidden="true"
          className="h-[18px] w-[18px] object-contain brightness-0 invert opacity-90 transition-opacity group-hover:opacity-100"
        />
      </span>
    </button>
  )
}

export default function StageDial({ value, onChange, onPush, ariaLabel = "Stage dial" }: StageDialProps) {
  const trackRef = useRef<HTMLDivElement | null>(null)
  const pushWrapRef = useRef<HTMLDivElement | null>(null)

  const [isDragging, setIsDragging] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isTrailOn, setIsTrailOn] = useState(false)
  const [isPushHovered, setIsPushHovered] = useState(false)
  const [pushHalfWidthPx, setPushHalfWidthPx] = useState(DEFAULT_PUSH_HALF_WIDTH_PX)
  const [trackWidthPx, setTrackWidthPx] = useState(1)

  const isDraggingRef = useRef(false)
  const isAnimatingRef = useRef(false)
  const isTrailOnRef = useRef(false)

  const [thumbPct, setThumbPct] = useState<number>((posToIdx(value) / 6) * 100)
  const [ghostPct, setGhostPct] = useState<number>((posToIdx(value) / 6) * 100)
  const thumbPctRef = useRef(thumbPct)
  const ghostPctRef = useRef(ghostPct)

  const rafRef = useRef<number | null>(null)
  const ghostRafRef = useRef<number | null>(null)

  const visualHalfPx =
    pushHalfWidthPx +
    PUSH_PSEUDO_INSET_PX +
    PUSH_VISUAL_MARGIN_EDGE_PX +
    PUSH_HALO_BLEED_PX
  const usablePx = Math.max(1, trackWidthPx - 2 * visualHalfPx)

  const pctToCenterPx = (pct: number) => (pct / 100) * usablePx + visualHalfPx
  const idxToCenterPx = (i: number) => (i / 6) * usablePx + visualHalfPx
  const centerPxToPct = (x: number) => ((x - visualHalfPx) / usablePx) * 100

  const idxToPct = (i: number) => (i / 6) * 100
  const pctToIdx = (pct: number) => {
    const normalized = pct / 100
    if (normalized <= EDGE_EPSILON) return 0
    if (normalized >= 1 - EDGE_EPSILON) return 6
    return Math.max(0, Math.min(6, Math.round(normalized * 6)))
  }

  const idx = useMemo(() => posToIdx(value), [value])
  const snappedPct = useMemo(() => idxToPct(idx), [idx])
  const trailVisible = isPushHovered

  const dist = Math.abs(thumbPct - ghostPct)
  const tt = Math.min(1, Math.max(0, (dist - 1.5) / 16))
  const squashY = 1 - 0.38 * easeOutCubic(tt)
  const stretchX = 1 + 0.28 * easeOutCubic(tt)
  const glowOpacity = 0.45 + 0.35 * tt

  const setThumb = (v: number) => {
    thumbPctRef.current = v
    setThumbPct(v)
  }

  const setGhost = (v: number) => {
    ghostPctRef.current = v
    setGhostPct(v)
  }

  function animateTo(targetPct: number, durationMs: number, onComplete?: () => void) {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    setIsAnimating(true)
    isAnimatingRef.current = true

    const from = thumbPctRef.current
    const to = targetPct
    const start = performance.now()

    const frame = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs)
      const e = easeOutCubic(t)
      setThumb(from + (to - from) * e)
      if (t < 1) {
        rafRef.current = requestAnimationFrame(frame)
      } else {
        setIsAnimating(false)
        isAnimatingRef.current = false
        onComplete?.()
      }
    }

    rafRef.current = requestAnimationFrame(frame)
  }

  function startTrail() {
    if (ghostRafRef.current) return
    const tick = () => {
      const target = thumbPctRef.current
      const current = ghostPctRef.current
      const next = current + (target - current) * 0.1
      setGhost(next)

      const stillNeeds = Math.abs(target - next) >= 0.15
      if (!isTrailOnRef.current && !stillNeeds) {
        ghostRafRef.current = null
        return
      }
      ghostRafRef.current = requestAnimationFrame(tick)
    }
    ghostRafRef.current = requestAnimationFrame(tick)
  }

  const getPctFromClientX = (clientX: number) => {
    const el = trackRef.current
    if (!el) return snappedPct
    const r = el.getBoundingClientRect()
    const x = clientX - r.left
    const cx = Math.min(Math.max(x, visualHalfPx), r.width - visualHalfPx)
    const pct = centerPxToPct(cx)
    return Math.min(100, Math.max(0, pct))
  }

  const applyMagnet = (rawPct: number) => {
    const nearestIdx = pctToIdx(rawPct)
    const nearestPct = idxToPct(nearestIdx)
    const magnetZone = 15
    const d = Math.abs(rawPct - nearestPct)
    if (d > magnetZone) return rawPct
    const t = 1 - d / magnetZone
    const strength = 0.25 + 0.55 * t
    return rawPct + (nearestPct - rawPct) * strength
  }

  useEffect(() => {
    if (isDraggingRef.current || isAnimatingRef.current) return
    animateTo(snappedPct, 180)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snappedPct])

  useEffect(() => {
    if (isDragging || isAnimating) startTrail()
  }, [isDragging, isAnimating])

  useEffect(() => {
    if (isTrailOn) startTrail()
  }, [isTrailOn])

  useEffect(() => {
    isTrailOnRef.current = isTrailOn
  }, [isTrailOn])

  useEffect(() => {
    const el = pushWrapRef.current
    if (!el) return
    const syncHalfWidth = () => {
      const next = Math.max(DEFAULT_PUSH_HALF_WIDTH_PX, el.getBoundingClientRect().width / 2)
      setPushHalfWidthPx((prev) => (Math.abs(prev - next) < 0.1 ? prev : next))
    }
    syncHalfWidth()
    const ro = new ResizeObserver(syncHalfWidth)
    ro.observe(el)
    window.addEventListener("resize", syncHalfWidth)
    return () => {
      ro.disconnect()
      window.removeEventListener("resize", syncHalfWidth)
    }
  }, [])

  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    const sync = () => {
      const next = Math.max(1, el.getBoundingClientRect().width)
      setTrackWidthPx((prev) => (Math.abs(prev - next) < 0.1 ? prev : next))
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
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (ghostRafRef.current) cancelAnimationFrame(ghostRafRef.current)
    }
  }, [])

  const stepTo = (next: Pos) => {
    if (next === value) return
    onChange(next)
    setIsTrailOn(true)
    startTrail()
    animateTo(idxToPct(posToIdx(next)), 180)
  }

  const stepDown = () => onChange(clampPos(value - 1))
  const stepUp = () => onChange(clampPos(value + 1))
  const stepDownAnimated = () => stepTo(clampPos(value - 1))
  const stepUpAnimated = () => stepTo(clampPos(value + 1))

  const beginDrag = (clientX: number) => {
    setIsDragging(true)
    isDraggingRef.current = true
    setIsTrailOn(true)
    startTrail()
    const magnet = applyMagnet(getPctFromClientX(clientX))
    setThumb(thumbPctRef.current + (magnet - thumbPctRef.current) * 0.16)
  }

  const continueDrag = (clientX: number) => {
    if (!isDraggingRef.current) return
    const magnet = applyMagnet(getPctFromClientX(clientX))
    setThumb(thumbPctRef.current + (magnet - thumbPctRef.current) * 0.16)
  }

  const endDrag = (clientX: number) => {
    if (!isDraggingRef.current) return
    setIsDragging(false)
    isDraggingRef.current = false
    const raw = getPctFromClientX(clientX)
    const targetIdx = pctToIdx(raw)
    const targetPos = positions[targetIdx]
    const targetPct = idxToPct(targetIdx)
    onChange(targetPos)
    setIsTrailOn(true)
    startTrail()
    animateTo(targetPct, 180, () => {
      setTimeout(() => {
        setIsTrailOn(false)
        startTrail()
      }, 80)
    })
  }

  const onPointerDown: React.PointerEventHandler<HTMLDivElement> = (e) => {
    const el = trackRef.current
    if (!el) return
    el.setPointerCapture(e.pointerId)
    beginDrag(e.clientX)
  }

  return (
    <div className="w-full select-none">
      <div className="flex items-center justify-center">
        <div className="w-full">
          <div
            ref={trackRef}
            role="slider"
            aria-label={ariaLabel}
            aria-valuemin={-3}
            aria-valuemax={3}
            aria-valuenow={value}
            tabIndex={0}
            onPointerDown={onPointerDown}
            onPointerMove={(e) => continueDrag(e.clientX)}
            onPointerUp={(e) => endDrag(e.clientX)}
            onPointerCancel={() => {
              setIsDragging(false)
              isDraggingRef.current = false
              setIsTrailOn(false)
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft") stepDown()
              if (e.key === "ArrowRight") stepUp()
              if (e.key === "Home") onChange(-3)
              if (e.key === "End") onChange(3)
            }}
            className="relative h-12 w-full cursor-pointer overflow-visible"
          >
            <div className="absolute left-0 right-0 top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-white/18" />

            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2">
              <div className="relative h-6">
                {positions.map((p, i) => (
                  <span
                    key={`tick-${p}`}
                    className="absolute top-1/2 h-3 w-[2px] -translate-y-1/2 -translate-x-1/2 rounded-full bg-white/25"
                    style={{ left: `${idxToCenterPx(i)}px` }}
                  />
                ))}
              </div>
            </div>

            <div
              className="pointer-events-none absolute left-1/2 top-1/2 h-8 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/5 blur-xl transition-opacity duration-200"
              style={{ opacity: isPushHovered ? 1 : 0 }}
            />
            <div
              className="pointer-events-none absolute left-1/2 top-1/2 h-4 w-[2px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/45 transition-opacity duration-200"
              style={{ opacity: isPushHovered ? 1 : 0 }}
            />

            <div
              className="pointer-events-none absolute top-1/2"
              style={{
                left: `${pctToCenterPx(ghostPct)}px`,
                transform: "translate(-50%, -50%)",
              }}
            >
              <div
                className={[
      "h-10 w-[75px] rounded-none",
                  "bg-white/35 blur-xl",
                  "shadow-[0_0_42px_rgba(255,255,255,0.28)]",
                  trailVisible ? "opacity-100" : "opacity-0",
                  "transition-opacity duration-200",
                  "origin-center",
                ].join(" ")}
                style={{
                  transform: `scaleX(${stretchX}) scaleY(${squashY})`,
                  opacity: trailVisible ? glowOpacity : 0,
                }}
              />
              <div
                className={[
                  "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
      "h-6 w-[140px] rounded-none",
                  "bg-white/18 blur-2xl",
                  "transition-opacity duration-200",
                ].join(" ")}
                style={{
                  transform: `translate(-50%, -50%) scaleY(${1 + 0.35 * tt})`,
                  opacity: trailVisible ? 0.25 + 0.25 * tt : 0,
                }}
              />
            </div>

            <div
              className="absolute top-1/2"
              style={{
                left: `${pctToCenterPx(thumbPct)}px`,
                transform: "translate(-50%, -50%)",
              }}
            >
              <div ref={pushWrapRef} className="pointer-events-auto">
                <ArrowPill
                  onLeft={stepDownAnimated}
                  onRight={stepUpAnimated}
                  onPush={onPush}
                  onDragStart={beginDrag}
                  onDragMove={continueDrag}
                  onDragEnd={endDrag}
                  onHoverChange={setIsPushHovered}
                  keepGlow={isDragging || isAnimating}
                  onGrab={() => {
                    setIsTrailOn(true)
                    startTrail()
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
