import React, { useEffect, useMemo, useRef, useState } from "react"

type Props = {
  beforeSrc: string
  afterSrc: string
  value: number
  onChange?: (v: number) => void
  animate?: boolean
  className?: string
  imageClassName?: string
}

export default function BeforeAfterSlider({
  beforeSrc,
  afterSrc,
  value,
  onChange,
  animate = true,
  className = "",
  imageClassName = "",
}: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const [dragging, setDragging] = useState(false)

  const v = useMemo(() => Math.min(1, Math.max(0, value)), [value])
  const pct = v * 100

  const setFromClientX = (clientX: number) => {
    const el = rootRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const x = Math.min(Math.max(clientX - r.left, 0), r.width)
    const next = r.width === 0 ? 0.5 : x / r.width
    onChange?.(next)
  }

  useEffect(() => {
    const up = () => setDragging(false)
    window.addEventListener("pointerup", up)
    window.addEventListener("pointercancel", up)
    return () => {
      window.removeEventListener("pointerup", up)
      window.removeEventListener("pointercancel", up)
    }
  }, [])

  const afterClip = `inset(0 ${100 - pct}% 0 0)`

  return (
    <div
      ref={rootRef}
      className={[
        "relative w-full overflow-hidden rounded-[24px]",
        "bg-black select-none",
        className,
      ].join(" ")}
      onPointerDown={(e) => {
        ;(e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId)
        setDragging(true)
        setFromClientX(e.clientX)
      }}
      onPointerMove={(e) => {
        if (!dragging) return
        setFromClientX(e.clientX)
      }}
      aria-label="Before and After Image Slider"
      role="group"
    >
      <img
        src={beforeSrc}
        alt=""
        className={[
          "absolute inset-0 h-full w-full object-cover",
          imageClassName,
        ].join(" ")}
        draggable={false}
      />

      <img
        src={afterSrc}
        alt=""
        draggable={false}
        className={[
          "absolute inset-0 h-full w-full object-cover",
          imageClassName,
          animate && !dragging ? "transition-[clip-path] duration-700 ease-out" : "",
        ].join(" ")}
        style={{
          clipPath: afterClip,
          WebkitClipPath: afterClip,
        }}
      />

      <div
        className={[
          "pointer-events-none absolute inset-y-0",
          animate && !dragging ? "transition-[left] duration-700 ease-out" : "",
        ].join(" ")}
        style={{ left: `${pct}%` }}
      >
        <div className="absolute inset-y-0 left-0 w-px bg-white/35" />
      </div>
    </div>
  )
}
