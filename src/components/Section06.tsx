import React, { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { SAVED_BIG_NUMBERS_STATS } from "./Section05"
import type { AdminContent, FooterColumnAdmin, FooterLinkAdmin, StatAdmin } from "../admin/types"

type FooterLinkView = {
  label: string
  url: string
}

type FooterColumnView = {
  title: string
  links: FooterLinkView[]
}

const fallbackFooterColumns: FooterColumnView[] = [
  {
    title: "SUPORTE",
    links: [
      { label: "11 94512-8115", url: "https://wa.me/5511945128115" },
      { label: "falecomedit@gmail.com", url: "mailto:falecomedit@gmail.com" },
    ],
  },
  {
    title: "EMPRESA",
    links: [
      { label: "Sobre", url: "#secao-01" },
      { label: "Agência de Vozes", url: "#secao-04" },
      { label: "Clientes", url: "#secao-05" },
    ],
  },
  {
    title: "LEGAL",
    links: [
      { label: "Termos de Serviço", url: "#" },
      { label: "Política de Privacidade", url: "#" },
      { label: "Licença", url: "#" },
    ],
  },
]

const footerOffsetClassByTitle: Record<string, string> = {
  SUPORTE: "lg:translate-x-[70px]",
  EMPRESA: "lg:translate-x-[40px]",
  LEGAL: "lg:translate-x-[20px]",
}

const normalizeFooterLinkLabel = (label: string) =>
  label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()

const getFooterLinkHref = (label: string) => {
  const normalized = normalizeFooterLinkLabel(label)
  if (normalized === "sobre") return "#secao-01"
  if (normalized === "agencia de vozes" || normalized === "agencia de voz") return "#secao-04"
  if (normalized === "clientes") return "#secao-05"
  return "#"
}

const scrollToFooterLink = (href: string) => {
  if (!href.startsWith("#") || href === "#") return
  const target = document.getElementById(href.slice(1))
  if (!target) return
  target.scrollIntoView({ behavior: "smooth", block: "start" })
  window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`)
}

const isExternalFooterHref = (href: string) => /^https?:\/\//i.test(href)

const resolveFooterHref = (label: string, url: string) => {
  const sectionHref = getFooterLinkHref(label)
  if (sectionHref !== "#") return sectionHref
  return url || "#"
}

type LegalDocId = "terms" | "privacy" | "license"

const getLegalDocId = (label: string): LegalDocId | null => {
  const normalized = normalizeFooterLinkLabel(label)
  if (normalized.includes("termos")) return "terms"
  if (normalized.includes("privacidade")) return "privacy"
  if (normalized.includes("licenca")) return "license"
  return null
}

const LEGAL_DOCS: Record<LegalDocId, { title: string; updatedAt: string; sections: Array<{ title?: string; paragraphs: string[] }> }> = {
  terms: {
    title: "Termos de Serviço",
    updatedAt: "7 de maio de 2026",
    sections: [
      {
        paragraphs: [
          "Estes Termos de Serviço regulam o uso do site e dos serviços oferecidos pela Edit Group, agência especializada em curadoria, intermediação e contratação de vozes profissionais para projetos comerciais, institucionais, publicitários, audiovisuais, digitais e correlatos.",
          "Ao acessar o site, solicitar orçamento, contratar serviços ou enviar materiais para produção, o usuário declara estar ciente e de acordo com estes Termos.",
        ],
      },
      {
        title: "1. Sobre a agência",
        paragraphs: [
          "A Edit Group atua como agência/intermediadora de locutores, narradores, dubladores, vozes publicitárias e profissionais de áudio, conectando clientes a talentos vocais conforme briefing, finalidade, prazo, território, mídia e formato de uso.",
        ],
      },
      {
        title: "2. Serviços oferecidos",
        paragraphs: [
          "A agência poderá oferecer, entre outros serviços: curadoria e seleção de vozes; orçamento de locução; gravação de voz profissional; direção de voz; adaptação de texto para locução; entrega de arquivos de áudio; intermediação entre cliente e locutor; licenciamento de uso de voz; produção ou pós-produção de áudio, quando contratado.",
          "Os serviços efetivamente contratados serão definidos em orçamento, proposta comercial, pedido, contrato ou comunicação formal entre as partes.",
        ],
      },
      {
        title: "3. Orçamentos e contratação",
        paragraphs: [
          "Os valores, prazos, condições de pagamento, número de versões, revisões, formato de entrega e escopo de uso serão informados previamente ao cliente.",
          "A contratação somente será considerada confirmada após aprovação formal do orçamento e/ou pagamento, conforme condição negociada.",
        ],
      },
      {
        title: "4. Responsabilidade do cliente",
        paragraphs: [
          "O cliente é responsável por enviar textos, briefings e informações corretas; garantir que possui autorização para uso dos materiais enviados; informar corretamente a finalidade da locução; informar mídia, território, período de veiculação e abrangência da campanha; aprovar o conteúdo antes da gravação; e não utilizar a voz fora do escopo contratado.",
          "A agência não se responsabiliza por textos, marcas, claims, promessas comerciais, informações técnicas, dados legais ou conteúdos fornecidos pelo cliente.",
        ],
      },
      {
        title: "5. Revisões e alterações",
        paragraphs: [
          "As revisões incluídas no serviço serão informadas na proposta comercial.",
          "Correções por erro técnico da gravação ou divergência em relação ao briefing aprovado poderão ser ajustadas sem custo adicional, desde que comunicadas dentro do prazo combinado.",
          "Alterações de texto, mudança de briefing, troca de tom, mudança de campanha, novo formato, nova mídia ou regravação por decisão do cliente poderão gerar novo orçamento.",
        ],
      },
      {
        title: "6. Prazos de entrega",
        paragraphs: [
          "Os prazos serão definidos conforme disponibilidade do locutor, complexidade do projeto, volume de texto, necessidade de direção, idioma, fuso horário e confirmação de pagamento.",
          "Prazos urgentes poderão ter cobrança adicional.",
        ],
      },
      {
        title: "7. Uso da voz",
        paragraphs: [
          "O uso da gravação é permitido apenas dentro das condições aprovadas em orçamento, proposta ou contrato.",
          "O cliente não poderá utilizar, editar, clonar, treinar, sintetizar, revender, sublicenciar ou reaproveitar a voz para finalidades diferentes das contratadas sem autorização prévia e expressa da agência e/ou do locutor.",
        ],
      },
      {
        title: "8. Proibição de uso para inteligência artificial",
        paragraphs: [
          "Salvo autorização específica por escrito, é proibido utilizar gravações, demos, samples, takes, arquivos finais ou qualquer material de voz para treinar modelos de inteligência artificial; criar voz sintética; clonar voz; gerar banco de voz; fazer text-to-speech com identidade vocal do locutor; ou criar derivados automatizados da voz.",
        ],
      },
      {
        title: "9. Portfólio e demonstração",
        paragraphs: [
          "A agência poderá exibir nomes de clientes, marcas, projetos, trechos de áudio ou peças produzidas em seu portfólio, site, redes sociais ou apresentações comerciais, salvo se houver solicitação formal de confidencialidade ou cláusula específica em contrato.",
        ],
      },
      {
        title: "10. Pagamento e inadimplência",
        paragraphs: [
          "As condições de pagamento serão estabelecidas em orçamento ou contrato.",
          "O uso da locução poderá ser suspenso caso haja inadimplência, uso fora do escopo contratado ou descumprimento destes Termos.",
        ],
      },
      {
        title: "11. Cancelamento",
        paragraphs: [
          "Cancelamentos após aprovação do orçamento, reserva de agenda, início da gravação ou entrega parcial poderão gerar cobrança proporcional ao trabalho realizado.",
        ],
      },
      {
        title: "12. Limitação de responsabilidade",
        paragraphs: [
          "A agência não será responsável por perdas indiretas, lucros cessantes, campanhas recusadas por veículos, problemas de veiculação, falhas de terceiros, plataformas, emissoras, redes sociais ou uso indevido da locução pelo cliente.",
        ],
      },
      {
        title: "13. Alterações dos Termos",
        paragraphs: ["Estes Termos poderão ser atualizados periodicamente. A versão vigente será publicada no site."],
      },
      {
        title: "14. Contato",
        paragraphs: [
          "Para dúvidas sobre estes Termos, entre em contato: E-mail: falecomedit@gmail.com. WhatsApp: (11) 94512-8115. Razão social: EDIT GROUP. CNPJ: 31.602.744/0001-00. Responsável: EDITH KAYOLANE APOLINARIO ROCHEL. Endereço: Avenida José Gomes de Camargo, 300, CEP 18213-640.",
        ],
      },
    ],
  },
  privacy: {
    title: "Política de Privacidade",
    updatedAt: "7 de maio de 2026",
    sections: [
      {
        paragraphs: [
          "Esta Política de Privacidade explica como a Edit Group coleta, utiliza, armazena e protege dados pessoais de usuários, clientes, locutores, parceiros e visitantes do site.",
        ],
      },
      {
        title: "1. Dados que podemos coletar",
        paragraphs: [
          "Podemos coletar dados fornecidos diretamente pelo usuário, como nome; e-mail; telefone/WhatsApp; empresa; cargo; cidade/estado; briefing do projeto; mensagens enviadas por formulário, WhatsApp ou e-mail; arquivos enviados para orçamento ou produção; dados de pagamento e faturamento, quando aplicável.",
          "Também podemos coletar dados técnicos de navegação, como endereço IP; tipo de navegador; dispositivo; páginas acessadas; data e horário de acesso; cookies e tecnologias similares.",
        ],
      },
      {
        title: "2. Finalidade do uso dos dados",
        paragraphs: [
          "Utilizamos os dados para responder solicitações de orçamento; entrar em contato com clientes e interessados; executar serviços contratados; selecionar vozes adequadas ao briefing; enviar propostas comerciais; emitir documentos fiscais; realizar atendimento e suporte; melhorar o site e a experiência do usuário; cumprir obrigações legais e regulatórias; e proteger direitos da agência, clientes e locutores.",
        ],
      },
      {
        title: "3. Dados de locutores",
        paragraphs: [
          "No caso de locutores, narradores, dubladores ou talentos cadastrados, podemos tratar dados como nome artístico; nome civil; contato; portfólio; demos de voz; idiomas; sotaques; especialidades; valores ou condições comerciais; dados bancários, quando necessário para pagamento; documentos fiscais ou cadastrais.",
          "Esses dados são utilizados para curadoria, apresentação de casting, contratação, pagamento e gestão de projetos.",
        ],
      },
      {
        title: "4. Compartilhamento de dados",
        paragraphs: [
          "Podemos compartilhar dados somente quando necessário, por exemplo, com locutores envolvidos em um projeto; com clientes que solicitam casting ou contratação; com fornecedores de tecnologia, hospedagem, pagamento e comunicação; com contabilidade, jurídico ou parceiros operacionais; e com autoridades públicas, quando exigido por lei.",
          "Não vendemos dados pessoais.",
        ],
      },
      {
        title: "5. Cookies",
        paragraphs: [
          "O site poderá utilizar cookies para melhorar a navegação, medir audiência, entender comportamento de uso e oferecer funcionalidades.",
          "O usuário pode ajustar as preferências de cookies diretamente no navegador.",
        ],
      },
      {
        title: "6. Segurança dos dados",
        paragraphs: [
          "Adotamos medidas técnicas e organizacionais para proteger os dados pessoais contra acesso não autorizado, perda, alteração, divulgação indevida ou uso inadequado.",
          "Nenhum sistema é totalmente imune a riscos, mas buscamos utilizar práticas adequadas de segurança da informação.",
        ],
      },
      {
        title: "7. Armazenamento dos dados",
        paragraphs: [
          "Os dados serão mantidos pelo tempo necessário para cumprir as finalidades descritas nesta Política, obrigações legais, contratuais, fiscais ou para resguardar direitos.",
        ],
      },
      {
        title: "8. Direitos do titular",
        paragraphs: [
          "Nos termos da LGPD, o titular pode solicitar, quando aplicável: confirmação da existência de tratamento; acesso aos dados; correção de dados incompletos ou desatualizados; anonimização, bloqueio ou eliminação de dados desnecessários; portabilidade; informações sobre compartilhamento; revogação de consentimento; eliminação de dados tratados com consentimento.",
          "A LGPD prevê direitos aos titulares em relação aos seus dados pessoais, incluindo acesso, correção e informações sobre compartilhamento.",
        ],
      },
      {
        title: "9. Uso de dados para marketing",
        paragraphs: [
          "Podemos enviar comunicações comerciais, novidades, portfólio, propostas ou conteúdos relacionados aos serviços da agência.",
          "O usuário poderá solicitar o descadastramento a qualquer momento.",
        ],
      },
      {
        title: "10. Dados de menores de idade",
        paragraphs: [
          "Caso haja participação de menor de idade em qualquer projeto, cadastro, gravação ou material, será necessária autorização do responsável legal, quando aplicável.",
        ],
      },
      {
        title: "11. Transferência internacional",
        paragraphs: [
          "Alguns fornecedores de tecnologia, hospedagem, armazenamento, analytics, e-mail ou comunicação podem estar localizados fora do Brasil. Nesses casos, buscamos utilizar fornecedores que adotem padrões adequados de segurança e proteção de dados.",
        ],
      },
      {
        title: "12. Contato sobre privacidade",
        paragraphs: [
          "Para exercer direitos ou tirar dúvidas sobre esta Política: E-mail: falecomedit@gmail.com. WhatsApp: (11) 94512-8115. Responsável: EDITH KAYOLANE APOLINARIO ROCHEL. Razão social: EDIT GROUP. CNPJ: 31.602.744/0001-00.",
        ],
      },
    ],
  },
  license: {
    title: "Licença de Uso",
    updatedAt: "7 de maio de 2026",
    sections: [
      {
        paragraphs: [
          "Esta Licença de Uso de Voz define as condições gerais para utilização das gravações, interpretações, locuções, narrações, demos e demais materiais de voz produzidos ou intermediados pela Edit Group.",
        ],
      },
      {
        title: "1. Objeto da licença",
        paragraphs: [
          "A licença autoriza o cliente a utilizar a gravação de voz contratada exclusivamente conforme as condições aprovadas em orçamento, proposta comercial, pedido, contrato ou autorização específica.",
          "A licença não implica cessão total, definitiva ou irrestrita da voz, imagem, nome, identidade vocal ou direitos do locutor.",
        ],
      },
      {
        title: "2. Escopo de uso",
        paragraphs: [
          "O uso da voz deverá respeitar os limites contratados, incluindo, quando aplicável: tipo de projeto; marca/produto/serviço; mídia de veiculação; território; período de uso; idioma; formato; quantidade de peças; campanha específica; praça de veiculação; finalidade comercial ou institucional.",
          "Qualquer uso fora do escopo contratado exigirá nova autorização e poderá gerar cobrança adicional.",
        ],
      },
      {
        title: "3. Exemplos de mídias",
        paragraphs: [
          "A licença poderá contemplar, conforme negociação: rádio; TV; internet; redes sociais; YouTube; podcasts; URA/espera telefônica; aplicativos; e-learning; vídeos institucionais; campanhas publicitárias; eventos; pontos de venda; cinema; streaming; mídia paga; mídia orgânica.",
        ],
      },
      {
        title: "4. Prazo de uso",
        paragraphs: [
          "O prazo de uso será definido no orçamento ou contrato.",
          "Na ausência de prazo expresso, considera-se autorizado apenas o uso pontual e específico para o projeto contratado, sem renovação automática para novas campanhas, novos produtos ou novas mídias.",
        ],
      },
      {
        title: "5. Território",
        paragraphs: [
          "O território de uso será definido no orçamento ou contrato, podendo ser local, regional, nacional ou internacional.",
          "Na ausência de definição expressa, o uso será considerado restrito ao território brasileiro e ao projeto informado no briefing.",
        ],
      },
      {
        title: "6. Proibições",
        paragraphs: [
          "Sem autorização prévia e expressa, o cliente não poderá usar a voz em campanha diferente da contratada; reutilizar a gravação em novo produto, serviço ou marca; revender, sublicenciar ou ceder a terceiros; editar a voz de forma que altere o sentido original; usar a voz em conteúdo ofensivo, político, religioso sensível, discriminatório, enganoso ou ilegal; usar a voz para treinar inteligência artificial; clonar, sintetizar ou reproduzir a identidade vocal do locutor; criar banco de voz ou modelo de voz; usar demos de portfólio como material final; ou usar takes não aprovados ou arquivos brutos sem autorização.",
        ],
      },
      {
        title: "7. Inteligência artificial e clonagem de voz",
        paragraphs: [
          "É expressamente proibido utilizar qualquer gravação, amostra, demo, take, arquivo final ou voz do locutor para treinamento, criação, simulação, clonagem, síntese, modificação automatizada ou geração de voz por inteligência artificial, salvo autorização específica, destacada e por escrito.",
        ],
      },
      {
        title: "8. Revisões e regravações",
        paragraphs: [
          "A licença cobre a versão final aprovada dentro do escopo contratado.",
          "Alterações de texto, produto, campanha, mídia, tom, direção artística ou uso posterior poderão ser consideradas novo serviço e/ou nova licença.",
        ],
      },
      {
        title: "9. Créditos",
        paragraphs: [
          "Créditos ao locutor ou à agência não são obrigatórios, salvo quando acordados previamente.",
          "O cliente não poderá utilizar o nome, imagem, apelido, assinatura vocal ou identidade pública do locutor como endosso comercial sem autorização expressa.",
        ],
      },
      {
        title: "10. Portfólio",
        paragraphs: [
          "Salvo acordo de confidencialidade, a agência e/ou o locutor poderão utilizar trechos do trabalho em portfólio, site, redes sociais, apresentações comerciais e materiais institucionais, respeitando o contexto do projeto.",
        ],
      },
      {
        title: "11. Exclusividade",
        paragraphs: [
          "A licença não concede exclusividade ao cliente, salvo previsão expressa em contrato.",
          "Caso o cliente deseje exclusividade por segmento, marca, território, período ou categoria, isso deverá ser negociado separadamente.",
        ],
      },
      {
        title: "12. Inadimplência e uso irregular",
        paragraphs: [
          "O uso da voz poderá ser considerado irregular caso haja ausência de pagamento; uso fora do escopo contratado; veiculação após o prazo autorizado; uso em mídia não contratada; reaproveitamento sem autorização; edição indevida; ou uso para IA sem autorização.",
          "Nesses casos, a agência poderá solicitar a suspensão imediata do uso, regularização financeira, nova licença ou medidas cabíveis.",
        ],
      },
      {
        title: "13. Direitos preservados",
        paragraphs: [
          "Permanecem preservados os direitos do locutor, da agência e de terceiros envolvidos, incluindo direitos de personalidade, direitos conexos, direitos autorais, direitos patrimoniais e demais direitos aplicáveis.",
        ],
      },
      {
        title: "14. Contato",
        paragraphs: [
          "Para solicitar ampliação de uso, renovação de licença ou autorização especial: E-mail: falecomedit@gmail.com. WhatsApp: (11) 94512-8115. Empresa: EDIT GROUP. CNPJ: 31.602.744/0001-00. Responsável: EDITH KAYOLANE APOLINARIO ROCHEL.",
        ],
      },
    ],
  },
}

const LEGAL_DOC_ORDER: LegalDocId[] = ["terms", "privacy", "license"]

type Section06Props = {
  content?: AdminContent["section06"]
  footer?: AdminContent["footer"]
}

const byOrder = <T extends { order_index: number }>(a: T, b: T) => a.order_index - b.order_index

const Section06: React.FC<Section06Props> = ({ content, footer }) => {
  const sectionRef = useRef<HTMLElement | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [legalModalOpen, setLegalModalOpen] = useState(false)
  const [activeLegalDocId, setActiveLegalDocId] = useState<LegalDocId>("terms")
  const activeLegalDoc = LEGAL_DOCS[activeLegalDocId]
  const stats = useMemo(() => {
    const active = (content?.stats ?? [])
      .filter((entry: StatAdmin) => entry.is_active && !entry.deleted_at)
      .sort(byOrder)
    if (!active.length) return SAVED_BIG_NUMBERS_STATS
    return active.map((entry) => ({
      value: entry.value,
      title: entry.title,
      description: entry.description,
    }))
  }, [content?.stats])

  const footerColumns = useMemo(() => {
    const active = (footer?.columns ?? [])
      .filter((entry: FooterColumnAdmin) => entry.is_active && !entry.deleted_at)
      .sort(byOrder)
    if (!active.length) return fallbackFooterColumns

    return active.map((column) => ({
      title: column.title,
      links: (column.links ?? [])
        .filter((entry: FooterLinkAdmin) => entry.is_active && !entry.deleted_at)
        .sort(byOrder)
        .map((entry) => ({
          label: entry.label || entry.url,
          url: resolveFooterHref(entry.label, entry.url),
        }))
        .filter((entry) => entry.label),
    }))
  }, [footer?.columns])

  useEffect(() => {
    const target = sectionRef.current
    if (!target) return

    const rootElement = target.closest("main") as HTMLElement | null
    const hasScrollableRoot =
      !!rootElement && (rootElement.scrollHeight > rootElement.clientHeight || rootElement.scrollWidth > rootElement.clientWidth)
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        const ratio = entry?.intersectionRatio ?? 0
        setIsVisible(Boolean(entry?.isIntersecting && ratio >= 0.45))
      },
      { threshold: [0.2, 0.45, 0.7], root: hasScrollableRoot ? rootElement : null }
    )

    observer.observe(target)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!legalModalOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return
      event.preventDefault()
      setLegalModalOpen(false)
    }
    window.addEventListener("keydown", onKeyDown, true)
    return () => window.removeEventListener("keydown", onKeyDown, true)
  }, [legalModalOpen])

  useEffect(() => {
    if (!legalModalOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [legalModalOpen])

  const openLegalModal = (docId: LegalDocId) => {
    setActiveLegalDocId(docId)
    setLegalModalOpen(true)
  }

  return (
    <section
      ref={sectionRef}
      id="secao-06"
      data-header-theme="dark"
      className={`relative isolate h-auto sm:h-[100svh] overflow-visible sm:snap-start sm:snap-always sm:overflow-hidden ${
        isVisible ? "s06-visible" : ""
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
        @keyframes s06BlurIn {
          0% { opacity: 0; transform: translateX(-26px); filter: blur(10px); }
          100% { opacity: 1; transform: translateX(0); filter: blur(0); }
        }
        .s06-enter {
          opacity: 0;
          transform: translateX(-26px);
          filter: blur(10px);
          pointer-events: none;
        }
        .s06-visible .s06-enter {
          animation: s06BlurIn 760ms cubic-bezier(0.22, 0.9, 0.22, 1) forwards;
          will-change: transform, opacity, filter;
          pointer-events: auto;
        }
        @media (max-width: 639px) {
          .s06-fluid-bg,
          .s06-grain-bg {
            animation: none !important;
          }
          .s06-enter {
            opacity: 1;
            transform: none;
            filter: none;
            pointer-events: auto;
          }
          .s06-visible .s06-enter {
            animation: none;
            will-change: auto;
          }
        }
      `}</style>

      <div
        className="s06-fluid-bg pointer-events-none absolute inset-0"
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
        className="s06-grain-bg pointer-events-none absolute inset-0"
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
            <span className="s06-enter inline-flex items-center rounded-none border border-white/30 px-4 py-2 text-xs font-thin tracking-[0.3em] text-white/80 font-barlow-thin" style={{ animationDelay: "80ms" }}>
            OS NÚMEROS
          </span>
        </div>

        <div className="mx-auto mt-9 flex h-full w-full max-w-[1800px] flex-col px-0 pb-[84px] sm:mt-0 sm:pb-0">
          <div className="flex w-full flex-1 items-start sm:items-center">
            <div className="grid w-full grid-cols-1 items-start gap-8 xl:grid-cols-[minmax(0,450px)_minmax(0,1fr)] xl:gap-10">
              <div className="s06-enter flex max-w-[450px] flex-col justify-center self-start sm:self-center" style={{ animationDelay: "180ms" }}>
                <h2 className="section-main-title font-secular mt-0 font-semibold uppercase leading-[0.92] tracking-[-0.02em] text-white">
                  {content?.title || "O RESULTADO"}
                </h2>
                <p className="font-barlow-thin section-body-copy mt-10 max-w-[450px] text-white/85">
                  {content?.text || "Mais do que volume, entregamos consistencia. Nossa estrutura une curadoria de talentos, direcao estrategica e producao tecnica para garantir qualidade, diversidade e performance em cada projeto realizado."}
                </p>
              </div>

              <div className="s06-enter" style={{ animationDelay: "280ms" }}>
                <ul className="grid w-full min-w-0 grid-cols-2 gap-3 pb-2 text-center sm:grid-cols-4 sm:items-stretch sm:gap-4 xl:gap-5">
                  {stats.map((stat, index) => (
                    <li
                      key={stat.title}
                      className="s06-enter flex h-[150px] w-full min-w-0 flex-col items-center justify-center border border-white/35 px-3 sm:h-[clamp(140px,20svh,190px)] sm:px-4"
                      style={{ animationDelay: `${340 + index * 80}ms` }}
                    >
                      <span className="font-secular text-[clamp(42px,4.2vw,54px)] leading-[0.9] tracking-[-0.03em] text-white">
                        {stat.value === "+3.000" ? "+3K" : stat.value}
                      </span>
                      <p className="font-barlow-thin mt-2 max-w-full [overflow-wrap:anywhere] text-[clamp(10px,0.78vw,12px)] uppercase leading-[1.15] tracking-[0.16em] text-white/70 xl:tracking-[0.22em]">
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
              <div className="s06-enter max-w-[220px]" style={{ animationDelay: "520ms" }}>
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
                {footerColumns.map((column, index) => (
                  <div
                    key={column.title}
                    className={`s06-enter ${footerOffsetClassByTitle[column.title] ?? ""}`}
                    style={{ animationDelay: `${620 + index * 100}ms` }}
                  >
                    <h3 className="font-secular text-[14px] uppercase tracking-[0.1em] text-white">
                      {column.title}
                    </h3>
                    <ul className="mt-3 -space-y-1">
                      {column.links.map((link) => {
                        const legalDocId = getLegalDocId(link.label)
                        const href = resolveFooterHref(link.label, link.url)
                        return (
                          <li key={`${link.label}-${href}`}>
                            <a
                              href={legalDocId ? "#" : href}
                              target={!legalDocId && isExternalFooterHref(href) ? "_blank" : undefined}
                              rel={!legalDocId && isExternalFooterHref(href) ? "noreferrer" : undefined}
                              onClick={
                                legalDocId
                                  ? (event) => {
                                      event.preventDefault()
                                      openLegalModal(legalDocId)
                                    }
                                  : href.startsWith("#")
                                    ? (event) => {
                                        event.preventDefault()
                                        scrollToFooterLink(href)
                                      }
                                    : undefined
                              }
                              className="font-barlow-thin inline-flex cursor-pointer text-[14px] text-white/65 transition hover:text-white"
                            >
                              {link.label}
                            </a>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
            <div className="s06-enter mt-8 border-t border-white/15 pt-5 text-center sm:text-left" style={{ animationDelay: "920ms" }}>
              <p className="font-barlow-thin text-[12px] leading-[1.2] text-white/65">
                {footer?.copyrightText || "© 2026, Edit Group. Direitos reservados."} {footer?.city || "São Paulo, Brasil."}
              </p>
              <p className="mt-[6px] font-barlow-thin text-[11px] leading-[1.2] text-white/65">
                Desenvolvido por{" "}
                <a
                  href="https://www.linkedin.com/in/felipeproenca/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex text-[11px] text-white/65 transition hover:text-white"
                >
                  Felipe Fraul
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>

      {legalModalOpen ? createPortal(
        <div
          className="fixed inset-0 z-[9999] bg-black/70 px-4 py-6 backdrop-blur-sm sm:px-8"
          role="dialog"
          aria-modal="true"
          aria-labelledby="legal-modal-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setLegalModalOpen(false)
          }}
        >
          <div
            className="mx-auto flex h-full w-full max-w-5xl flex-col overflow-hidden border border-white/20 bg-[#080810] text-white shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/15 px-4 py-4 sm:px-6">
              <div>
                <p className="font-barlow-thin text-[10px] uppercase tracking-[0.26em] text-white/45">
                  Edit Group
                </p>
                <h2 id="legal-modal-title" className="font-secular mt-1 text-[24px] uppercase tracking-[0.04em] text-white sm:text-[34px]">
                  {activeLegalDoc.title}
                </h2>
              </div>
              <button
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  setLegalModalOpen(false)
                }}
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  setLegalModalOpen(false)
                }}
                className="relative z-10 inline-flex h-10 w-10 cursor-pointer items-center justify-center border border-white/25 bg-transparent text-[18px] leading-none text-white/70 transition hover:border-white/60 hover:text-white"
                aria-label="Fechar"
              >
                X
              </button>
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-1 sm:grid-cols-[220px_minmax(0,1fr)]">
              <nav className="flex gap-2 overflow-x-auto border-b border-white/15 p-4 sm:flex-col sm:overflow-visible sm:border-b-0 sm:border-r sm:p-5" aria-label="Documentos legais">
                {LEGAL_DOC_ORDER.map((docId) => {
                  const doc = LEGAL_DOCS[docId]
                  const isActive = docId === activeLegalDocId
                  return (
                    <button
                      key={docId}
                      type="button"
                      onMouseEnter={() => setActiveLegalDocId(docId)}
                      onFocus={() => setActiveLegalDocId(docId)}
                      onClick={() => setActiveLegalDocId(docId)}
                      className={`min-w-[170px] cursor-pointer border px-3 py-3 text-left transition sm:min-w-0 ${
                        isActive
                          ? "border-white/70 bg-white text-black"
                          : "border-white/20 bg-transparent text-white/60 hover:border-white/50 hover:text-white"
                      }`}
                    >
                      <span className="font-secular block text-[13px] uppercase tracking-[0.08em]">
                        {doc.title}
                      </span>
                    </button>
                  )
                })}
              </nav>

              <div className="min-h-0 overflow-y-auto px-4 py-5 sm:px-8 sm:py-7">
                <p className="font-barlow-thin text-[13px] uppercase tracking-[0.18em] text-white/45">
                  Última atualização: {activeLegalDoc.updatedAt}
                </p>
                <div className="mt-6 space-y-6">
                  {activeLegalDoc.sections.map((section, sectionIndex) => (
                    <section key={`${activeLegalDocId}-${section.title ?? sectionIndex}`}>
                      {section.title ? (
                        <h3 className="font-secular text-[18px] uppercase tracking-[0.04em] text-white">
                          {section.title}
                        </h3>
                      ) : null}
                      <div className="mt-3 space-y-3">
                        {section.paragraphs.map((paragraph) => (
                          <p key={paragraph.slice(0, 48)} className="font-barlow-thin text-[16px] leading-[1.45] text-white/75">
                            {paragraph}
                          </p>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      ) : null}
    </section>
  )
}

export default Section06



