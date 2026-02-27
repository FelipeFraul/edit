import { useEffect, useRef, useState } from "react"

type Options = {
  words: string[]
  typeSpeed?: number
  deleteSpeed?: number
  holdMs?: number
  gapMs?: number
  onWordStart?: (word: string, index: number) => void
}

export function useTypewriterWord({
  words,
  typeSpeed = 70,
  deleteSpeed = 35,
  holdMs = 900,
  gapMs = 250,
  onWordStart,
}: Options) {
  const [wordIndex, setWordIndex] = useState(0)
  const [text, setText] = useState("")
  const [phase, setPhase] = useState<"typing" | "holding" | "deleting" | "gap">(
    "typing"
  )

  const startedRef = useRef(false)

  useEffect(() => {
    const w = words[wordIndex] ?? ""
    let t: number | undefined

    if (phase === "typing") {
      if (!startedRef.current) {
        startedRef.current = true
        onWordStart?.(w, wordIndex)
      }

      if (text.length < w.length) {
        t = window.setTimeout(() => {
          setText(w.slice(0, text.length + 1))
        }, typeSpeed)
      } else {
        t = window.setTimeout(() => setPhase("holding"), holdMs)
      }
    }

    if (phase === "holding") {
      t = window.setTimeout(() => setPhase("deleting"), holdMs)
    }

    if (phase === "deleting") {
      if (text.length > 0) {
        t = window.setTimeout(() => {
          setText(text.slice(0, -1))
        }, deleteSpeed)
      } else {
        startedRef.current = false
        t = window.setTimeout(() => setPhase("gap"), gapMs)
      }
    }

    if (phase === "gap") {
      t = window.setTimeout(() => {
        setWordIndex((i) => (i + 1) % words.length)
        setPhase("typing")
      }, gapMs)
    }

    return () => {
      if (t) window.clearTimeout(t)
    }
  }, [
    deleteSpeed,
    gapMs,
    holdMs,
    onWordStart,
    phase,
    text,
    typeSpeed,
    wordIndex,
    words,
  ])

  return { text, wordIndex, phase }
}
