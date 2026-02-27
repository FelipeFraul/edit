import React from "react"
import { SAVED_BIG_NUMBERS_STATS } from "./Section05"

const footerColumns = [
  { title: "SUPORTE", links: ["15 9.9999-9999", "15 3272-7272", "falecom@editgroup.com.br"] },
  { title: "EMPRESA", links: ["Sobre", "Agência de Vozes", "Clientes"] },
  { title: "LEGAL", links: ["Termos de Serviço", "Política de Privacidade", "Licença"] },
]

// Ajuste horizontal em px (negativo = esquerda, positivo = direita)
const footerHorizontalOffsetPx: Record<string, number> = {
  BRAND: 0,
  SUPORTE: 70,
  EMPRESA: 40,
  LEGAL: 20,
}

const Section06: React.FC = () => {
  return (
    <section
      id="secao-06"
      data-header-theme="dark"
      className="relative isolate h-[100svh] snap-start snap-always overflow-hidden"
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
      `}</style>

      <div
        className="pointer-events-none absolute inset-0"
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
        className="pointer-events-none absolute inset-0"
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

      <div className="relative z-10 m-4 grid h-[calc(100svh-2rem)] grid-rows-[auto_1fr] rounded-[28px] px-6 sm:px-12 lg:px-16">
        <div className="flex items-center justify-center px-6 pt-24 sm:px-12 sm:pt-28 lg:px-16">
            <span className="inline-flex items-center rounded-none border border-white/30 px-4 py-2 text-xs font-thin tracking-[0.3em] text-white/80 font-barlow-thin">
            OS NÚMEROS
          </span>
        </div>

        <div className="mx-auto flex h-full w-full max-w-[1800px] flex-col px-0">
          <div className="flex w-full flex-1 items-center">
            <div className="grid w-full grid-cols-1 items-start gap-8 xl:grid-cols-[minmax(0,450px)_minmax(0,1fr)] xl:gap-10">
              <div className="flex max-w-[450px] flex-col justify-center self-center">
                <h2 className="font-secular mt-0 text-[72px] font-semibold uppercase leading-[0.92] tracking-[-0.02em] text-white">
                  O RESULTADO
                </h2>
                <p className="font-barlow-thin mt-10 max-w-[450px] text-[18px] leading-[1.2] text-white/85">
                  Mais do que volume, entregamos consistência. Nossa estrutura une curadoria de talentos, direção estratégica e produção técnica para garantir qualidade, diversidade e performance em cada projeto realizado.
                </p>
              </div>

              <div>
                <ul className="flex w-full flex-nowrap items-center justify-start gap-5 overflow-x-auto pb-2 text-center">
                  {SAVED_BIG_NUMBERS_STATS.map((stat) => (
                    <li
                      key={stat.title}
                      className="flex h-[190px] min-w-[190px] flex-col items-center justify-center border border-white/35 px-4"
                    >
                      <span className="font-secular text-[54px] leading-[0.9] tracking-[-0.03em] text-white">
                        {stat.value === "+3.000" ? "+3K" : stat.value}
                      </span>
                      <p className="font-barlow-thin mt-2 text-[12px] uppercase tracking-[0.22em] text-white/70">
                        {stat.title}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-auto">
            <div className="h-px w-full bg-white/15" />
            <div className="mt-8 grid grid-cols-1 gap-y-8 sm:grid-cols-2 lg:grid-cols-[minmax(0,220px)_minmax(0,1fr)] lg:items-start lg:gap-x-10">
              <div
                className="max-w-[220px]"
                style={{ transform: `translateX(${footerHorizontalOffsetPx.BRAND ?? 0}px)` }}
              >
                <img
                  src="/assets/logotipo/logo_edit_group.webp"
                  alt="Edit Group"
                  className="h-auto w-[90px] brightness-0 invert"
                  draggable={false}
                />
                <p className="font-barlow-thin mt-3 text-[13px] leading-[1.35] text-white/65">
                  Experiência sonora para sua marca.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-y-8 sm:grid-cols-2 lg:max-w-[760px] lg:grid-cols-3 lg:gap-x-10">
                {footerColumns.map((column) => (
                  <div
                    key={column.title}
                    style={{
                      transform: `translateX(${footerHorizontalOffsetPx[column.title] ?? 0}px)`,
                    }}
                  >
                    <h3 className="font-secular text-[14px] uppercase tracking-[0.1em] text-white">
                      {column.title}
                    </h3>
                    <ul className="mt-3 -space-y-1">
                      {column.links.map((link) => (
                        <li key={link}>
                          <a
                            href="#"
                            className="font-barlow-thin inline-flex text-[14px] text-white/65 transition hover:text-white"
                          >
                            {link}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Section06
