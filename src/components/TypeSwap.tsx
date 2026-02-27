import React, { useEffect, useMemo, useRef, useState } from "react"

type TypeSwapProps = {
  prefix: string
  words: string[]
  className?: string
  wordClassName?: string
  caretClassName?: string
  typeMs?: number
  deleteMs?: number
  holdMs?: number
  betweenMs?: number
}

export default function TypeSwap({
  prefix,
  words,
  className,
  wordClassName,
  caretClassName,
  typeMs = 40,
  deleteMs = 28,
  holdMs = 1200,
  betweenMs = 220,
}: TypeSwapProps) {
  const safeWords = useMemo(() => (words.length ? words : [""]), [words])

  const [wordIndex, setWordIndex] = useState(0)
  const [typed, setTyped] = useState("")
  const [phase, setPhase] = useState<
    "typing" | "holding" | "deleting" | "between"
  >("typing")

  const timeoutRef = useRef<number | null>(null)

  useEffect(() => {
    const current = safeWords[wordIndex] ?? ""
    const clear = () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    clear()

    if (phase === "typing") {
      if (typed.length < current.length) {
        timeoutRef.current = window.setTimeout(() => {
          setTyped(current.slice(0, typed.length + 1))
        }, typeMs)
      } else {
        timeoutRef.current = window.setTimeout(() => setPhase("holding"), holdMs)
      }
    }

    if (phase === "holding") {
      timeoutRef.current = window.setTimeout(() => setPhase("deleting"), holdMs)
    }

    if (phase === "deleting") {
      if (typed.length > 0) {
        timeoutRef.current = window.setTimeout(() => {
          setTyped(current.slice(0, typed.length - 1))
        }, deleteMs)
      } else {
        timeoutRef.current = window.setTimeout(
          () => setPhase("between"),
          betweenMs
        )
      }
    }

    if (phase === "between") {
      timeoutRef.current = window.setTimeout(() => {
        setWordIndex((i) => (i + 1) % safeWords.length)
        setPhase("typing")
      }, betweenMs)
    }

    return clear
  }, [phase, typed, wordIndex, safeWords, typeMs, deleteMs, holdMs, betweenMs])

  return (
    <span className={className}>
      {prefix}{" "}
      <span className={wordClassName}>
        {typed}
        <span
          aria-hidden="true"
          className={
            caretClassName ??
            "inline-block w-[0.08em] translate-y-[0.08em] bg-white/70 ml-[0.06em]"
          }
          style={{
            height: "0.95em",
            animation: "typeswap-blink 1s step-end infinite",
          }}
        />
      </span>
      <style>{`
        @keyframes typeswap-blink {
          50% { opacity: 0; }
        }
      `}</style>
    </span>
  )
}
