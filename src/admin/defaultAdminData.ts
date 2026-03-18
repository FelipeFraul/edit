import { heroVariants } from "../heroVariants"
import type {
  AdminContent,
  AudioEntryAdmin,
  BaseItem,
  BrandAdmin,
  BrandPanelAdmin,
  FooterColumnAdmin,
  FooterLinkAdmin,
  SectionCard,
  SectionStep,
  StatAdmin,
  TaxonomyNode,
  VoiceFilterAdmin,
  VoiceTalentAdmin,
} from "./types"

const now = () => new Date().toISOString()

const createId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`

const item = <T extends object>(orderIndex: number, data: T): BaseItem & T => ({
  id: createId(),
  order_index: orderIndex,
  is_active: true,
  deleted_at: null,
  created_at: now(),
  updated_at: now(),
  ...data,
})

const mkNode = (orderIndex: number, name: string, children: TaxonomyNode[] = []): TaxonomyNode =>
  item(orderIndex, { name, children })

const mkLink = (orderIndex: number, label: string, url: string): FooterLinkAdmin =>
  item(orderIndex, { label, url })

const mkCard = (
  orderIndex: number,
  title: string,
  text: string,
  icon: string,
  hoverText = ""
): SectionCard =>
  item(orderIndex, { title, text, icon, hoverText })

const mkStep = (orderIndex: number, name: string, text: string, media: string): SectionStep =>
  item(orderIndex, { name, text, media })

const mkFilter = (
  orderIndex: number,
  name: string,
  subtitle: string,
  hint: string,
  items: TaxonomyNode[]
): VoiceFilterAdmin => item(orderIndex, { name, subtitle, hint, items })

const mkBrand = (orderIndex: number, name: string, logo: string): BrandAdmin =>
  item(orderIndex, { name, logo })

const mkPanel = (
  orderIndex: number,
  brandId: string,
  title: string,
  description: string,
  voiceType: string
): BrandPanelAdmin => item(orderIndex, { brand_id: brandId, title, description, voiceType })

const mkAudio = (orderIndex: number, brandId: string, name: string, file: string): AudioEntryAdmin =>
  item(orderIndex, { brand_id: brandId, name, file })

const mkStat = (orderIndex: number, value: string, title: string, description: string): StatAdmin =>
  item(orderIndex, { value, title, description })

const mkColumn = (orderIndex: number, title: string, links: FooterLinkAdmin[]): FooterColumnAdmin =>
  item(orderIndex, { title, links })

const mkTalent = (
  orderIndex: number,
  name: string,
  audioFile: string,
  audioName: string,
  assignments: VoiceTalentAdmin["assignments"]
): VoiceTalentAdmin => item(orderIndex, { name, audioFile, audioName, assignments })

const mkLeafChildren = (names: string[]): TaxonomyNode[] =>
  names.map((name, index) => mkNode(index + 1, name))

const mkCapitalBranches = (capitals: Record<string, string[]>): TaxonomyNode[] =>
  Object.entries(capitals).map(([capital, accents], index) =>
    mkNode(index + 1, capital, mkLeafChildren(accents))
  )

const regionTree: Record<string, Record<string, string[]>> = {
  NORTE: {
    MANAUS: ["AMAZONENSE LEVE", "AMAZONENSE MARCANTE", "NEUTRO COM NORTISTA"],
    "BELÉM": ["PARAENSE LEVE", "PARAENSE MARCANTE", "NORTISTA COMERCIAL"],
    PALMAS: ["TOCANTINENSE LEVE", "TRANSIÇÃO NORTE-CO"],
    "RIO BRANCO": ["ACREANO LEVE", "NORTE INTERIOR"],
    "MACAPÁ": ["AMAPAENSE LEVE", "AMAZÔNICO SUAVE"],
    "PORTO VELHO": ["RONDONIENSE LEVE", "MISTO NORTE-CO"],
    "BOA VISTA": ["RORAIMENSE LEVE", "NORTISTA SUAVE"],
  },
  NORDESTE: {
    SALVADOR: ["BAIANO LEVE", "BAIANO MARCANTE", "BAIANO COMERCIAL"],
    FORTALEZA: ["CEARENSE LEVE", "CEARENSE FORTE"],
    RECIFE: ["PERNAMBUCANO LEVE", "PERNAMBUCANO FORTE"],
    "SÃO LUÍS": ["MARANHENSE LEVE", "MISTO NORTE-NE"],
    "JOÃO PESSOA": ["PARAIBANO LEVE", "PARAIBANO MARCADO"],
    TERESINA: ["PIAUIENSE LEVE", "PIAUIENSE TRADICIONAL"],
    NATAL: ["POTIGUAR LEVE", "POTIGUAR MARCADO"],
    ARACAJU: ["SERGIPANO LEVE", "SERGIPANO SUAVE"],
    "MACEIÓ": ["ALAGOANO LEVE", "ALAGOANO FORTE"],
  },
  SUDESTE: {
    "SÃO PAULO": ["PAULISTANO", "INTERIOR PAULISTA", "CAIPIRA LEVE", "NEUTRO NACIONAL"],
    "RIO DE JANEIRO": ["CARIOCA LEVE", "CARIOCA MARCADO", "FLUMINENSE INTERIOR"],
    "BELO HORIZONTE": ["MINEIRO SUAVE", "MINEIRO RAIZ"],
    "VITÓRIA": ["CAPIXABA LEVE", "SUDESTE NEUTRO"],
  },
  SUL: {
    CURITIBA: ["PARANAENSE LEVE", "SUL COMERCIAL"],
    "PORTO ALEGRE": ["GAÚCHO LEVE", "GAÚCHO TRADICIONAL"],
    FLORIANÓPOLIS: ["CATARINENSE LEVE", "SUL SUAVE"],
  },
  "CENTRO-OESTE": {
    "BRASÍLIA": ["NEUTRO INSTITUCIONAL", "CENTRO-OESTE LEVE"],
    "GOIÂNIA": ["GOIANO LEVE", "SERTANEJO LEVE"],
    "CUIABÁ": ["CUIABANO LEVE", "CENTRO-OESTE MARCADO"],
    "CAMPO GRANDE": ["SUL-MATO-GROSSENSE LEVE", "CENTRO-OESTE TRADICIONAL"],
  },
}

const idiomaTree: Record<string, string[]> = {
  INGLÊS: ["AMERICANO", "BRITÂNICO", "AUSTRALIANO", "CANADENSE", "IRLANDÊS", "ESCOCÊS"],
  ESPANHOL: ["ESPANHA", "LATINO", "RIOPLATENSE", "CARIBENHO", "MEXICANO", "ANDINO", "CHILENO", "COLOMBIANO"],
  FRANCÊS: ["FRANÇA", "CANADÁ (QUEBEC)", "BÉLGICA", "SUÍÇA"],
  ALEMÃO: ["ALEMANHA", "ÁUSTRIA", "SUÍÇA"],
  ITALIANO: ["ITÁLIA (PADRÃO)", "NORTE", "SUL"],
  ÁRABE: ["PADRÃO (MSA)", "EGÍPCIO", "LEVANTINO", "GOLFO", "MAGREBINO"],
  MANDARIM: ["PUTONGHUA (PADRÃO)", "TAIWAN", "SINGAPURA"],
  JAPONÊS: ["TOKYO (PADRÃO)", "KANSAI"],
}

const timbreTree: Record<string, string[]> = {
  GRAVE: ["2 A 5 ANOS", "6 A 12 ANOS", "13 A 17 ANOS", "18 A 25 ANOS", "26 A 35 ANOS", "36 A 50 ANOS", "50+"],
  MÉDIO: ["2 A 5 ANOS", "6 A 12 ANOS", "13 A 17 ANOS", "18 A 25 ANOS", "26 A 35 ANOS", "36 A 50 ANOS", "50+"],
  AGUDO: ["2 A 5 ANOS", "6 A 12 ANOS", "13 A 17 ANOS", "18 A 25 ANOS", "26 A 35 ANOS", "36 A 50 ANOS", "50+"],
  ROUCO: ["18 A 25 ANOS", "26 A 35 ANOS", "36 A 50 ANOS", "50+"],
  SUAVE: ["2 A 5 ANOS", "6 A 12 ANOS", "13 A 17 ANOS", "18 A 25 ANOS", "26 A 35 ANOS", "36 A 50 ANOS", "50+"],
  CORPORATIVO: ["18 A 25 ANOS", "26 A 35 ANOS", "36 A 50 ANOS", "50+"],
}

const estiloTree: Record<string, string[]> = {
  IMPACTANTE: ["CONTIDO", "MODERADO", "ALTO", "EXPLOSIVO"],
  CONVERSADO: ["CONTIDO", "MODERADO", "ALTO", "EXPLOSIVO"],
  DRAMÁTICO: ["CONTIDO", "MODERADO", "ALTO", "EXPLOSIVO"],
  "JOVEM DINÂMICO": ["CONTIDO", "MODERADO", "ALTO", "EXPLOSIVO"],
  INSTITUCIONAL: ["CONTIDO", "MODERADO", "ALTO", "EXPLOSIVO"],
}

const heroVariantItems = heroVariants
  .slice()
  .sort((a, b) => a.pos - b.pos)
  .map((variant, index) =>
    item(index + 1, {
      pos: variant.pos,
      kicker: variant.kicker ?? "",
      title: variant.title ?? variant.media.title ?? "",
      animatedPrefix: variant.animatedPrefix ?? "",
      animatedWords: variant.animatedWords ?? [],
      tagline: variant.tagline ?? "",
      who: variant.media.who ?? "",
      when: variant.media.when ?? "",
      category: variant.media.category ?? "",
      modalTitle: variant.media.title ?? "",
      subtitle: variant.media.subtitle ?? "",
      videoSrc: variant.media.videoSrc ?? "",
      poster: variant.media.poster ?? "",
      bgImage: variant.bgImage ?? "",
      mobileBgImage: variant.mobileBgImage ?? "",
      topCtaLabel: variant.topCtaLabel ?? "",
      topCtaHref: variant.topCtaHref ?? "",
    })
  )

const brands = [
  mkBrand(1, "Netshoes", "/assets/logotipo/isotipo_netshoes.webp"),
  mkBrand(2, "Mc Donald's", "/assets/logotipo/isotipo_mcdonalds.svg"),
  mkBrand(3, "Globo", "/assets/logotipo/isotipo_globo.svg"),
  mkBrand(4, "Giraffas", "/assets/logotipo/isotipo_giraffas.webp"),
  mkBrand(5, "Burger King", "/assets/logotipo/isotipo_bk.svg"),
  mkBrand(6, "Ambev", "/assets/logotipo/isotipo_ambev.webp"),
]

const brandByName = Object.fromEntries(brands.map((entry) => [entry.name, entry.id]))

export const createDefaultAdminContent = (): AdminContent => ({
  hero: {
    variants: heroVariantItems,
  },
  section02: {
    title: "SOBRE NÓS",
    text:
      "A Edit Group é um hub criativo especializado em vozes nacionais e internacionais e produção de áudio premium, entregando interpretação autêntica e excelência técnica para publicidade, podcasts, trilhas e sound branding.",
    cards: [
      mkCard(
        1,
        "CRIATIVIDADE",
        "Dando som a imagens. Dando voz a ideias. Criamos o que não se vê, mas se sente.",
        "/assets/icon/bulb-2-svgrepo-com.svg",
        "A Edit Group é um hub criativo especializado em vozes nacionais e internacionais e produção de áudio premium, entregando interpretação autêntica e excelência técnica para publicidade, podcasts, trilhas e sound branding."
      ),
      mkCard(
        2,
        "PROCESSO",
        "Fluxo claro do briefing à entrega, com direção e acompanhamento.",
        "/assets/icon/attach-svgrepo-com.svg",
        "A Edit Group é um hub criativo especializado em vozes nacionais e internacionais e produção de áudio premium, entregando interpretação autêntica e excelência técnica para publicidade, podcasts, trilhas e sound branding."
      ),
      mkCard(
        3,
        "TEMPO",
        "Produção ágil com padrão de qualidade e previsibilidade de prazos.",
        "/assets/icon/time-svgrepo-com.svg",
        "A Edit Group é um hub criativo especializado em vozes nacionais e internacionais e produção de áudio premium, entregando interpretação autêntica e excelência técnica para publicidade, podcasts, trilhas e sound branding."
      ),
    ],
  },
  section03: {
    title: "A CRIAÇÃO",
    text:
      "A Edit Group une direção criativa e técnica para transformar demanda em produção consistente.",
    steps: [
      mkStep(1, "EDIÇÃO", "Organização narrativa e precisão técnica dos elementos sonoros.", "/assets/icon/settings-2-svgrepo-com.svg"),
      mkStep(2, "MIXAGEM", "Equilíbrio de camadas para clareza, impacto e identidade de marca.", "/assets/icon/settings-svgrepo-com.svg"),
      mkStep(3, "FINALIZAÇÃO", "Master final com padronização para múltiplos canais e formatos.", "/assets/icon/send-1-svgrepo-com.svg"),
    ],
  },
  section04: {
    title: "LOCUTORES",
    text:
      "Voz humana. Sotaque nativo. Representamos vozes do Brasil e do exterior com curadoria e intermediação completa.",
    filters: [
      mkFilter(1, "REGIÃO", "FILTRO ESTRUTURAL", "Ativa o diferencial regionalista.", [
        ...Object.entries(regionTree).map(([region, capitals], index) =>
          mkNode(index + 1, region, mkCapitalBranches(capitals))
        ),
      ]),
      mkFilter(2, "IDIOMA", "FILTRO ESTRUTURAL", "Amplia o alcance nacional e internacional.", [
        ...Object.entries(idiomaTree).map(([idioma, familias], index) =>
          mkNode(index + 1, idioma, mkLeafChildren(familias))
        ),
      ]),
      mkFilter(3, "TIMBRE", "FILTRO TÉCNICO", "Mostra curadoria profissional real.", [
        ...Object.entries(timbreTree).map(([timbre, faixas], index) =>
          mkNode(index + 1, timbre, mkLeafChildren(faixas))
        ),
      ]),
      mkFilter(4, "ESTILO", "FILTRO EMOCIONAL", "Define a sensação da voz.", [
        ...Object.entries(estiloTree).map(([estilo, intensidades], index) =>
          mkNode(index + 1, estilo, mkLeafChildren(intensidades))
        ),
      ]),
      mkFilter(5, "OBJETIVO", "FILTRO ESTRATÉGICO", "Vende resultado, não voz.", [
        mkNode(1, "VENDER / PERFORMANCE"),
        mkNode(2, "INSTITUCIONAL / AUTORIDADE"),
        mkNode(3, "BRANDING / IDENTIDADE"),
        mkNode(4, "CONTEÚDO DIGITAL"),
        mkNode(5, "EXPLICATIVO / EDUCACIONAL"),
      ]),
    ],
  },
  section05: {
    title: "PARCERIAS",
    text:
      "Trabalhamos com agências, produtoras de vídeo, videomakers e clientes finais para resolver áudio com qualidade e consistência.",
    brands,
    panels: [
      mkPanel(
        1,
        brandByName.Netshoes,
        "Performance e atitude em cada spot",
        "Locução jovem e conversada para campanhas que conectam esporte, ritmo e conversão.",
        "JOVEM CONVERSADO"
      ),
      mkPanel(
        2,
        brandByName["Mc Donald's"],
        "Voz natural para drive e ofertas",
        "Entonação conversada que aproxima a marca do público no ponto de decisão.",
        "DRIVE JOVEM NATURAL CONVERSADO"
      ),
      mkPanel(
        3,
        brandByName["Burger King"],
        "Tom jovem para varejo de impacto",
        "Comunicação dinâmica para campanhas promocionais com leitura rápida e energia comercial.",
        "JOVEM CONVERSADO / NATURAL"
      ),
    ],
    audios: [
      mkAudio(
        1,
        brandByName.Netshoes,
        "Jovem conversado",
        "/assets/audios/NETSHOES - JOVEM CONVERSADO (BRUNOROCHEL).mp3"
      ),
      mkAudio(
        2,
        brandByName["Mc Donald's"],
        "Drive jovem natural conversado",
        "/assets/audios/MC DONALDS - DRIVE JOVEM, NATURAL CONVERSADO (BRUNOROCHEL) .mp3"
      ),
      mkAudio(
        3,
        brandByName["Burger King"],
        "Jovem natural",
        "/assets/audios/BURGER KING - JOVEM, NATURAL (BRUNOROCHEL).mp3"
      ),
    ],
  },
  section06: {
    title: "O RESULTADO",
    text:
      "Mais do que volume, entregamos consistência com curadoria de talentos, direção estratégica e produção técnica.",
    stats: [
      mkStat(1, "+150", "VOZES PROFISSIONAIS", "Locutores no casting."),
      mkStat(2, "+20", "ESTADOS DO BRASIL", "Cobertura regional."),
      mkStat(3, "+12", "IDIOMAS", "Idiomas disponíveis."),
      mkStat(4, "+3.000", "PRODUÇÕES", "Projetos entregues."),
    ],
  },
  section07: {
    title: "LOCUTORES",
    text: "Cadastre locutores, suba o áudio e conecte aos filtros da Seção Vozes.",
    talents: [
      mkTalent(1, "Felipe Fraul", "/assets/audios/NETSHOES - JOVEM CONVERSADO (BRUNOROCHEL).mp3", "Demo Felipe", {
        REGIAO: [["SUDESTE", "SÃO PAULO", "NEUTRO NACIONAL"]],
        IDIOMA: [["INGLÊS", "AMERICANO"]],
        TIMBRE: [["MÉDIO", "26 A 35 ANOS"]],
        ESTILO: [["CONVERSADO", "MODERADO"]],
        OBJETIVO: [["BRANDING / IDENTIDADE"]],
      }),
    ],
  },
  footer: {
    columns: [
      mkColumn(1, "SUPORTE", [mkLink(1, "11 94512-8115", "#"), mkLink(2, "falecomedit@gmail.com", "mailto:falecomedit@gmail.com")]),
      mkColumn(2, "EMPRESA", [mkLink(1, "Sobre", "#"), mkLink(2, "Agência de Vozes", "#"), mkLink(3, "Clientes", "#")]),
      mkColumn(3, "LEGAL", [mkLink(1, "Termos de Serviço", "#"), mkLink(2, "Política de Privacidade", "#"), mkLink(3, "Licença", "#")]),
    ],
    copyrightText: "© 2026, Edit Group. Direitos reservados.",
    city: "Sao Paulo, Brazil.",
    developerCredit: "Desenvolvido por",
  },
})
