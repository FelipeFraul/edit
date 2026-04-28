import React, { useEffect, useRef, useState } from "react"
import type { AdminContent, SectionCard } from "../admin/types"

const ABOUT_TEXT =
  "A Edit Group é um hub criativo especializado em vozes nacionais e internacionais e produção de áudio premium, entregando interpretação autêntica, excelência técnica e soluções sonoras estratégicas para publicidade, podcasts, trilhas e sound branding."

const FALLBACK_CARDS = [
  {
    key: "visao",
    title: "CRIATIVIDADE",
    iconSrc: "/assets/icon/bulb-2-svgrepo-com.svg",
    text: "Dando som a imagens. Dando voz a ideias. Criamos o que não se vê, mas se sente.",
    hoverText: ABOUT_TEXT,
  },
  {
    key: "processo",
    title: "PROCESSO",
    iconSrc: "/assets/icon/attach-svgrepo-com.svg",
    text: "Fluxo claro do briefing à entrega, com direção e acompanhamento.",
    hoverText: ABOUT_TEXT,
  },
  {
    key: "execucao",
    title: "TEMPO",
    iconSrc: "/assets/icon/time-svgrepo-com.svg",
    text: "Produção ágil com padrão de qualidade e previsibilidade de prazos.",
    hoverText: ABOUT_TEXT,
  },
] as const

type Section02Props = {
  content?: AdminContent["section02"]
}

const byOrder = (a: SectionCard, b: SectionCard) => a.order_index - b.order_index

const Section02: React.FC<Section02Props> = ({ content }) => {
  const sectionRef = useRef<HTMLElement | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  const cmsCards = (content?.cards ?? [])
    .filter((entry) => entry.is_active && !entry.deleted_at)
    .sort(byOrder)
    .slice(0, 3)

  const cards = cmsCards.length
    ? cmsCards.map((entry) => ({
        key: entry.id,
        title: entry.title || "SEM TÍTULO",
        iconSrc: entry.icon || "/assets/icon/bulb-2-svgrepo-com.svg",
        text: entry.text || "",
        hoverText: entry.hoverText || entry.text || "",
      }))
    : FALLBACK_CARDS

  const aboutTitle = content?.title || "SOBRE NÓS"
  const aboutText = content?.text || ABOUT_TEXT

  useEffect(() => {
    const target = sectionRef.current
    if (!target) return

    const rootElement = target.closest("main") as HTMLElement | null
    const hasScrollableRoot =
      !!rootElement && (rootElement.scrollHeight > rootElement.clientHeight || rootElement.scrollWidth > rootElement.clientWidth)
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry?.isIntersecting && (entry?.intersectionRatio ?? 0) < 0.08) return
        setIsVisible(true)
        observer.unobserve(entry.target)
      },
      { threshold: [0.08, 0.2], root: hasScrollableRoot ? rootElement : null }
    )

    observer.observe(target)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={sectionRef}
      id="secao-01"
      data-header-theme="dark"
      className={`relative isolate h-auto sm:h-[100svh] overflow-visible sm:snap-start sm:snap-always sm:overflow-hidden bg-transparent ${
        isVisible ? "sec02-visible" : ""
      }`}
    >
      <style>{`
        @keyframes sec02Fluid {
          0% { transform: scale(1.06) translate3d(-1.2%, -1%, 0); filter: saturate(1.35) brightness(0.98); }
          50% { transform: scale(1.1) translate3d(1.6%, 2.2%, 0); filter: saturate(1.5) brightness(1.06); }
          100% { transform: scale(1.06) translate3d(-1.2%, -1%, 0); filter: saturate(1.35) brightness(0.98); }
        }
        @keyframes sec02Grain {
          0% { transform: translate3d(0, 0, 0); }
          25% { transform: translate3d(-1%, 0.5%, 0); }
          50% { transform: translate3d(0.6%, -0.8%, 0); }
          75% { transform: translate3d(-0.4%, 0.9%, 0); }
          100% { transform: translate3d(0, 0, 0); }
        }
        @keyframes sec02BlurIn {
          0% { opacity: 0; transform: translateX(-26px); filter: blur(10px); }
          100% { opacity: 1; transform: translateX(0); filter: blur(0); }
        }
        .sec02-enter { opacity: 0; transform: translateX(-26px); filter: blur(10px); pointer-events: none; }
        .sec02-visible .sec02-enter {
          animation: sec02BlurIn 760ms cubic-bezier(0.22, 0.9, 0.22, 1) forwards;
          will-change: transform, opacity, filter;
          pointer-events: auto;
        }
        @media (max-width: 639px) {
          .s02-fluid-bg,
          .s02-grain-bg {
            animation: none !important;
          }
          .sec02-enter { opacity: 1; transform: none; filter: none; pointer-events: auto; }
          .sec02-visible .sec02-enter { animation: none; will-change: auto; }
        }
      `}</style>

      <div
        className="s02-fluid-bg pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          backgroundColor: "#003FFF",
          backgroundImage: `
            radial-gradient(58% 50% at 10% 18%, rgba(14,26,55,0.92), transparent 68%),
            radial-gradient(52% 46% at 88% 16%, rgba(132,76,187,0.82), transparent 66%),
            radial-gradient(60% 55% at 20% 84%, rgba(17,24,105,0.9), transparent 70%),
            radial-gradient(56% 52% at 84% 82%, rgba(60,60,191,0.8), transparent 68%),
            linear-gradient(180deg, #0E1A37 0%, #111869 34%, #3C3CBF 66%, #6F52AD 100%)
          `,
          mixBlendMode: "normal",
          animation: "sec02Fluid 3s ease-in-out infinite",
          opacity: 0.9,
          transformOrigin: "center",
          willChange: "transform, filter",
        }}
      />
      <div
        className="s02-grain-bg pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.12) 0.7px, transparent 0.7px)",
          backgroundSize: "3px 3px",
          opacity: 0.3,
          animation: "sec02Grain 5s steps(8, end) infinite",
          mixBlendMode: "soft-light",
          willChange: "transform",
        }}
      />

      <div className="relative z-10 m-0 grid h-auto sm:m-4 sm:h-[calc(100svh-2rem)] grid-rows-[auto_1fr] rounded-none sm:rounded-[28px] px-6 sm:px-12 lg:px-16">
        <div className="flex items-center justify-center px-6 pt-12 sm:px-12 sm:pt-28 lg:px-16">
          <span
            className="sec02-enter inline-flex items-center rounded-none border border-white/30 px-4 py-2 text-xs font-thin tracking-[0.3em] text-white/80 font-barlow-thin"
            style={{ animationDelay: "80ms" }}
          >
            O ESTÚDIO
          </span>
        </div>

        <div className="mx-auto mt-9 flex w-full max-w-[1800px] items-start px-0 pb-10 sm:mt-0 sm:items-center sm:pb-12 lg:pb-14">
          <div className="grid w-full grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,450px)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] lg:gap-6">
            <div className="sec02-enter relative flex max-w-[450px] flex-col justify-center self-start sm:self-center" style={{ animationDelay: "180ms" }}>
              <h2 className="section-main-title font-secular mt-0 font-semibold uppercase leading-[0.92] tracking-[-0.02em] text-white">
                {aboutTitle}
              </h2>
              <p className="font-barlow-thin section-body-copy mt-10 max-w-[450px] text-white/88">
                {aboutText}
              </p>
            </div>

            {cards.map((card, index) => (
              <blockquote
                key={card.key}
                className="sec02-enter relative flex h-auto min-h-0 min-w-0 flex-col overflow-hidden border border-white/45 p-6 sm:h-[400px] sm:min-h-0 lg:p-5"
                style={{ animationDelay: `${320 + index * 140}ms` }}
              >
                <div className="flex items-center gap-3">
                  <img
                    src={card.iconSrc}
                    alt=""
                    className="h-8 w-8 object-contain brightness-0 invert sm:hidden"
                    loading="lazy"
                    aria-hidden="true"
                  />
                  <h3 className="font-secular text-[1.9rem] font-semibold leading-[1.05] tracking-[-0.02em] text-white sm:text-[62px] lg:text-[22px]">
                    {card.title}
                  </h3>
                </div>
                <div className="hidden flex-1 items-center justify-center sm:flex">
                  <img
                    src={card.iconSrc}
                    alt=""
                    className="h-[170px] w-[182px] object-contain brightness-0 invert"
                    loading="lazy"
                    aria-hidden="true"
                  />
                </div>
                <ul className="font-barlow-thin mt-0 space-y-3 text-[18px] leading-[1.45] text-white/90 sm:text-[18px] sm:leading-[1.4] lg:text-[18px]">
                  <li>{card.text}</li>
                </ul>
              </blockquote>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default Section02
