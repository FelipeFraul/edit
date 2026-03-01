import React, { useEffect, useRef, useState } from "react"

const SECTION03_CARDS = [
  {
    id: 1,
    label: "",
    title: "EDIÇÃO",
    iconSrc: "/assets/icon/settings-2-svgrepo-com.svg",
    iconClass: "h-[58%]",
  },
  {
    id: 2,
    label: "",
    title: "MIXAGEM",
    iconSrc: "/assets/icon/settings-svgrepo-com.svg",
    iconClass: "h-[66%]",
  },
  {
    id: 3,
    label: "",
    title: "FINALIZAÇÃO",
    iconSrc: "/assets/icon/send-1-svgrepo-com.svg",
    iconClass: "h-[58%] w-[58%]",
  },
]

const Section03: React.FC = () => {
  const sectionRef = useRef<HTMLElement | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [activeCard, setActiveCard] = useState<number | null>(null)
  const [shiftedCard, setShiftedCard] = useState<number | null>(null)
  const [slideTextCard, setSlideTextCard] = useState<number | null>(null)
  const hideTextTimerRef = useRef<number | null>(null)

  const clearHideTextTimer = () => {
    if (hideTextTimerRef.current !== null) {
      window.clearTimeout(hideTextTimerRef.current)
      hideTextTimerRef.current = null
    }
  }

  useEffect(() => {
    if (activeCard === null) {
      setShiftedCard(null)
      return
    }

    clearHideTextTimer()
    setShiftedCard(null)
    setSlideTextCard(null)
    const timer = window.setTimeout(() => {
      setShiftedCard(activeCard)
      setSlideTextCard(activeCard)
    }, 500)

    return () => window.clearTimeout(timer)
  }, [activeCard])

  useEffect(() => {
    const target = sectionRef.current
    if (!target) return

    const rootElement = target.closest("main") as HTMLElement | null
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry?.isIntersecting) return
        setIsVisible(true)
        observer.unobserve(entry.target)
      },
      { threshold: 0.25, root: rootElement }
    )

    observer.observe(target)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    return () => clearHideTextTimer()
  }, [])

  const getDesktopImageWrapClass = (index: number) => {
    const isActive = activeCard === index
    if (!isActive) return "justify-center"
    return "justify-start"
  }

  const getDesktopImageClass = (index: number) => {
    const isActive = activeCard === index
    if (!isActive) return "h-[220px] w-[260px] max-w-full object-cover object-center"
    return "h-[220px] w-[100%] max-w-full object-cover object-left"
  }

  const getDesktopImageShiftClass = (index: number) => {
    const shouldShift = activeCard === index && shiftedCard === index
    if (!shouldShift) return ""
    return "s03-img-shift-right"
  }

  const getDesktopFillTextClass = (index: number) => {
    const shouldShowText = activeCard === index && slideTextCard === index
    return `s03-filltext-base s03-filltext-left from-left${shouldShowText ? " s03-filltext-animate is-in" : ""}`
  }

  const getFlexGrow = (index: number) => {
    if (activeCard === null) return 1
    if (index === activeCard) return 1.8
    return 0.8
  }

  return (
    <section
      ref={sectionRef}
      id="secao-02"
      data-header-theme="light"
      className={`relative isolate h-auto sm:h-[100svh] overflow-visible sm:snap-start sm:snap-always sm:overflow-hidden ${
        isVisible ? "s03-visible" : ""
      }`}
    >
      <div
        className="s03-fluid-bg absolute inset-0"
        aria-hidden="true"
        style={{
          backgroundColor: "#ffffff",
          backgroundImage: `
            radial-gradient(62% 56% at 12% 18%, rgba(23,26,74,0.32), transparent 66%),
            radial-gradient(56% 50% at 84% 20%, rgba(76,0,125,0.28), transparent 64%),
            radial-gradient(58% 54% at 24% 82%, rgba(23,26,74,0.26), transparent 68%),
            radial-gradient(54% 50% at 82% 84%, rgba(76,0,125,0.24), transparent 66%),
            linear-gradient(180deg, #ffffff 0%, #f8f8ff 48%, #f2f1fb 100%)
          `,
          mixBlendMode: "normal",
          animation: "sec02Fluid 3s ease-in-out infinite",
          opacity: 0.9,
          transformOrigin: "center",
          willChange: "transform, filter",
        }}
      />
      <div
        className="s03-grain-bg absolute inset-0"
        aria-hidden="true"
        style={{
          backgroundImage: "radial-gradient(rgba(0,0,0,0.08) 0.7px, transparent 0.7px)",
          backgroundSize: "3px 3px",
          opacity: 0.2,
          animation: "sec03GrayGrain 5s steps(8, end) infinite",
          mixBlendMode: "soft-light",
          willChange: "transform",
        }}
      />

      <div className="relative z-10 m-0 grid h-auto sm:m-4 sm:h-[calc(100svh-2rem)] grid-rows-[auto_1fr] rounded-none sm:rounded-[28px] px-6 sm:px-12 lg:px-16">
        <div className="flex items-center justify-center px-6 pt-12 sm:px-12 sm:pt-28 lg:px-16">
          <span
              className="s03-enter inline-flex items-center rounded-none border border-black/30 px-4 py-2 text-xs font-thin tracking-[0.3em] text-black/80 font-barlow-thin"
            style={{ animationDelay: "80ms" }}
          >
            A PRODUÇÃO
          </span>
        </div>

        <div className="mx-auto mt-9 flex w-full max-w-[1800px] items-start px-0 pb-10 sm:mt-0 sm:items-center sm:pb-12 lg:pb-14">
          <div className="grid w-full grid-cols-1 items-start gap-8 xl:grid-cols-[minmax(0,450px)_minmax(0,1fr)] xl:gap-10">
            <div className="s03-enter flex max-w-[450px] flex-col justify-center self-start sm:self-center" style={{ animationDelay: "180ms" }}>
              <h2 className="section-main-title font-secular mt-0 font-semibold uppercase leading-[0.92] tracking-[-0.02em] text-black">
                A CRIAÇÃO
              </h2>
              <p className="font-barlow-thin section-body-copy mt-10 max-w-[450px] text-black/85">
                A Edit Group e um hub criativo especializado em vozes nacionais e internacionais e produção de áudio premium,
                entregando interpretação autentica, excelência técnica e soluções sonoras estratéegicas para publicidade, podcasts,
                trilhas e sound branding.
              </p>
            </div>

            <div
              className="hidden h-[400px] w-full items-end gap-3 xl:flex"
              onMouseLeave={() => {
                clearHideTextTimer()
                hideTextTimerRef.current = window.setTimeout(() => {
                  setSlideTextCard(null)
                  setShiftedCard(null)
                  setActiveCard(null)
                  hideTextTimerRef.current = null
                }, 500)
              }}
            >
              {SECTION03_CARDS.map((card) => (
                <article
                  key={card.id}
                  onMouseEnter={() => setActiveCard(card.id - 1)}
                  onFocus={() => setActiveCard(card.id - 1)}
                  onClick={() => setActiveCard(card.id - 1)}
                  className={`s03-enter relative flex h-[400px] basis-0 min-h-0 min-w-0 flex-col overflow-hidden border border-black/35 bg-transparent p-4 ${
                    activeCard === null ? "" : activeCard === card.id - 1 ? "z-10" : "opacity-90"
                  }`}
                  style={{
                    flexGrow: getFlexGrow(card.id - 1),
                    transition: "flex-grow 500ms ease, opacity 500ms ease",
                    animationDelay: `${320 + (card.id - 1) * 140}ms`,
                  }}
                >
                  <div className="px-4">
                    <p className="font-barlow-thin text-[11px] text-black/65">{card.label}</p>
                    <h3 className="font-secular mt-1 text-[22px] leading-[0.95] text-black">{card.title}</h3>
                  </div>

                  {/* ? AQUI Ã‰ A CORREÃ‡ÃƒO: frame interno com inset fixo.
                      NÃ£o muda a animaÃ§Ã£o (classes e tempos continuam iguais),
                      sÃ³ garante que o retÃ¢ngulo NUNCA encoste e mantenha a mesma margem. */}
                  <div className="relative flex min-w-0 flex-1 items-center overflow-hidden px-4">
                    <div
                      className={`s03-media-frame relative flex w-full min-w-0 flex-1 items-center ${getDesktopImageWrapClass(
                        card.id - 1
                      )}`}
                    >
                      <div
                        aria-hidden="true"
                        className={`relative z-10 flex items-center justify-center bg-black transition-all duration-500 ease-out ${getDesktopImageClass(
                          card.id - 1
                        )} ${getDesktopImageShiftClass(card.id - 1)}`}
                      >
                        <img
                          src={card.iconSrc}
                          alt=""
                          className={`object-contain brightness-0 invert ${card.iconClass}`}
                          loading="lazy"
                        />
                      </div>

                      <div className={getDesktopFillTextClass(card.id - 1)}>
                        <div className="space-y-2">
                          <p className="px-4 font-barlow-thin text-[14px] leading-[1.35] text-black/75">
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Tempor incididunt ut labore et dolore magna aliqua.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="font-barlow-thin space-y-1 px-4 text-[12px] leading-[1.3] text-black/75">
                    <p>Lorem ipsum dolor sit amet</p>
                  </div>
                </article>
              ))}
            </div>

            <div className="grid w-full grid-cols-1 gap-4 xl:hidden">
              {SECTION03_CARDS.map((card) => (
                <article
                  key={`mobile-${card.id}`}
                  className="s03-enter relative flex h-auto min-h-0 flex-col overflow-hidden border border-black/35 bg-transparent p-6"
                  style={{ animationDelay: `${320 + (card.id - 1) * 140}ms` }}
                >
                  <p className="font-barlow-thin text-[11px] text-black/65">{card.label}</p>
                  <div className="mt-1 flex items-center gap-3">
                    <img
                      src={card.iconSrc}
                      alt=""
                      className="h-8 w-8 object-contain brightness-0"
                      loading="lazy"
                    />
                    <h3 className="font-secular text-[1.9rem] leading-[0.95] text-black">{card.title}</h3>
                  </div>
                  <p className="font-barlow-thin mt-2 text-[1.15rem] leading-[1.45] text-black/75">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        /* ? Frame interno: cria a â€œmargem constanteâ€ igual print 1 */
        .s03-media-frame {
          width: 100%;
          min-width: 0;
          height: 100%;
          padding-left: 12px;
          padding-right: 12px;
          box-sizing: border-box;
          overflow: hidden; /* importantÃ­ssimo: o shift/translate clipa aqui, mantendo margem */
        }

        @keyframes sec03GrayFlow {
          0% { transform: scale(1.05) translate3d(-1%, -0.8%, 0); filter: saturate(0.7) brightness(1); }
          50% { transform: scale(1.1) translate3d(1.2%, 1.6%, 0); filter: saturate(0.85) brightness(1.03); }
          100% { transform: scale(1.05) translate3d(-1%, -0.8%, 0); filter: saturate(0.7) brightness(1); }
        }
        @keyframes sec03GrayGrain {
          0% { transform: translate3d(0, 0, 0); }
          25% { transform: translate3d(-1%, 0.6%, 0); }
          50% { transform: translate3d(0.7%, -0.8%, 0); }
          75% { transform: translate3d(-0.4%, 0.9%, 0); }
          100% { transform: translate3d(0, 0, 0); }
        }
        @keyframes sec03BlurIn {
          0% { opacity: 0; transform: translateX(-26px); filter: blur(10px); }
          100% { opacity: 1; transform: translateX(0); filter: blur(0); }
        }
        .s03-enter {
          opacity: 0;
          transform: translateX(-26px);
          filter: blur(10px);
          pointer-events: none;
        }
        .s03-visible .s03-enter {
          animation: sec03BlurIn 760ms cubic-bezier(0.22, 0.9, 0.22, 1) forwards;
          will-change: transform, opacity, filter;
          pointer-events: auto;
        }
        @media (max-width: 639px) {
          .s03-enter {
            opacity: 1;
            transform: none;
            filter: none;
            pointer-events: auto;
          }
          .s03-visible .s03-enter {
            animation: none;
            will-change: auto;
          }
          .s03-fluid-bg,
          .s03-grain-bg {
            animation: none !important;
          }
        }

        /* ? mantÃ©m sua animaÃ§Ã£o intacta */
        .s03-img-shift-right {
          transform: translateX(50%);
          transition: transform 420ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        .s03-img-shift-left {
          transform: translateX(-50%);
          transition: transform 420ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        .s03-filltext-base {
          position: absolute;
          top: 0;
          bottom: 0;
          display: flex;
          align-items: center;
          padding: 0;
          opacity: 0;
          pointer-events: none;
          transform: translateX(0);
        }
        .s03-filltext-animate {
          transition: opacity 420ms cubic-bezier(0.22, 1, 0.36, 1), transform 420ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        .s03-filltext-left {
          left: 16px;
          width: calc(50% - 16px);
          justify-content: flex-start;
          text-align: left;
        }
        .is-in {
          opacity: 1;
          transform: translateX(0);
        }
        .from-left {
          transform: translateX(-16px);
        }
      `}</style>
    </section>
  )
}

export default Section03



