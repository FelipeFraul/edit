export type MediaItem = {
  videoSrc?: string
  poster?: string
  who: string
  when: string
  category: string
  title?: string
  subtitle?: string
}

export type HeroVariant = {
  pos: -3 | -2 | -1 | 0 | 1 | 2 | 3
  mode: "split" | "ads" | "entertainment"
  kicker: string
  title: string
  animatedPrefix?: string
  animatedWords?: string[]
  subtitle: string
  tagline: string
  mobileLines?: string[]
  client: string
  year: string
  category: string
  ctaLabel: string
  ctaHref: string
  topCtaLabel?: string
  topCtaHref?: string
  media?: MediaItem
  bgImage: string
}

export const heroVariants: HeroVariant[] = [
  {
    pos: -3,
    mode: "ads",
    kicker: "DIREÇÃO, PRODUÇÃO E MIXAGEM CRIATIVA",
    title: "UMA PROMOÇÃO PARA DAR UM SUSTO NA SUA FOME",
    subtitle: "Campanha de lançamento para um novo público urbano.",
    tagline: "Técnica comercial viva e descontraída para a marca Giraffas.",
    mobileLines: [],
    client: "GIRAFFAS",
    year: "2025",
    category: "Publicidade",
    ctaLabel: "VER ESTUDO DE CASO",
    ctaHref: "#ads-3",
    topCtaLabel: "VER MÍDIA",
    topCtaHref: "#midia-3",
    media: {
      videoSrc: "https://player.vimeo.com/video/769434808?autoplay=1",
      poster: "",
      who: "GIRAFFAS",
      when: "2025",
      category: "Publicidade",
      title: "UMA PROMOÇÃO PARA DAR UM SUSTO NA SUA FOME",
      subtitle: "Campanha de lançamento para um novo público urbano.",
    },
    bgImage: "/assets/bg_hero_publicidade_giraffas.webp",
  },
  {
    pos: -2,
    mode: "ads",
    kicker: "DIREÇÃO, PRODUÇÃO E MIXAGEM CRIATIVA",
    title: "SABEMOS QUE NEM TODO HERÓI USA CAPA.",
    subtitle: "Reposicionamento com foco em impacto e clareza.",
    tagline:
      "Técnica, direção e narrativa alinhadas ao compromisso da Ambev de conectar pessoas.",
    mobileLines: [],
    client: "AMBEV",
    year: "2025",
    category: "Publicidade",
    ctaLabel: "VER ESTUDO DE CASO",
    ctaHref: "#ads-2",
    topCtaLabel: "VER MÍDIA",
    topCtaHref: "#midia-2",
    media: {
      videoSrc: "https://player.vimeo.com/video/1120853474?autoplay=1",
      poster: "",
      who: "AMBEV",
      when: "2025",
      category: "Publicidade",
      title: "SABEMOS QUE NEM TODO HERÓI USA CAPA.",
      subtitle: "Reposicionamento com foco em impacto e clareza.",
    },
    bgImage: "/assets/bg_hero_publicidade_ambev.webp",
  },
  {
    pos: -1,
    mode: "ads",
    kicker: "DIREÇÃO, PRODUÇÃO E MIXAGEM CRIATIVA",
    title: "SEMPRE CHECK O QUE VÊ, O QUE OUVE E O FATO.",
    subtitle: "",
    tagline:
      "Técnica, direção e narrativa alinhadas ao padrão Globo de excelência.",
    mobileLines: [],
    client: "TV GLOBO",
    year: "2025",
    category: "Publicidade",
    ctaLabel: "VER ESTUDO DE CASO",
    ctaHref: "#ads-1",
    topCtaLabel: "VER MÍDIA",
    topCtaHref: "#midia-1",
    media: {
      videoSrc: "https://player.vimeo.com/video/1120855640?autoplay=1",
      poster: "",
      who: "TV GLOBO",
      when: "2025",
      category: "Publicidade",
      title: "SEMPRE CHECK O QUE VÊ, O QUE OUVE E O FATO.",
      subtitle: "",
    },
    bgImage: "/assets/bg_hero_publicidade_globo.webp",
  },
  {
    pos: 0,
    mode: "split",
    kicker: "ESTÚDIO DE PRODUÇÃO CRIATIVA",
    title: "EXPERIÊNCIA SONORA QUE TRANSFORMA IMAGEM BRUTA EM FILME QUE",
    animatedPrefix: "EXPERIÊNCIA SONORA QUE TRANSFORMA IMAGEM BRUTA EM FILME QUE",
    animatedWords: [
      "MARCA",
      "IMPACTA",
      "EMOCIONA",
      "INSPIRA",
      "PROVOCA",
      "RESSOA",
      "TRANSFORMA",
      "MOBILIZA",
    ],
    subtitle: "Narrativas de alto impacto no cruzamento de mídia e arte.",
    tagline: "Unimos técnica, estética e narrativa para dar vida às marcas.",
    mobileLines: ["EXPERIÊNCIAS", "QUE CONECTAM", "PESSOAS POR"],
    client: "EDIT GROUP",
    year: "2025",
    category: "Publicidade / Entretenimento",
    ctaLabel: "VER ESTUDO DE CASO",
    ctaHref: "#split",
    topCtaLabel: "AGÊNCIA DE VOZES",
    topCtaHref: "#split",
    media: {
      videoSrc: "",
      poster: "",
      who: "EDIT GROUP",
      when: "2025",
      category: "Publicidade",
      title: "EXPERIÊNCIAS QUE CONECTAM PESSOAS POR",
      subtitle: "Narrativas de alto impacto no cruzamento de mídia e arte.",
    },
    bgImage:
      "",
  },
  {
    pos: 1,
    mode: "entertainment",
    kicker: "ESTÚDIO DE PRODUÇÃO CRIATIVA",
    title: "AQUI VAI ENTRETENIMENTO",
    subtitle: "Experiência audiovisual para lançamento global.",
    tagline: "Unimos técnica, estética e narrativa para dar vida às marcas.",
    mobileLines: [],
    client: "Test",
    year: "2026",
    category: "Entretenimento",
    ctaLabel: "VER ESTUDO DE CASO",
    ctaHref: "#ent-1",
    topCtaLabel: "VER MÍDIA",
    topCtaHref: "#midia-ent-1",
    media: {
      videoSrc: "",
      poster: "",
      who: "Test",
      when: "2026",
      category: "Entretenimento",
      title: "NEON STAGE",
      subtitle: "Experiência audiovisual para lançamento global.",
    },
    bgImage: "/assets/bg_hero_publicidade_globo.webp",
  },
  {
    pos: 2,
    mode: "entertainment",
    kicker: "ESTÚDIO DE PRODUÇÃO CRIATIVA",
    title: "AQUI VAI ENTRETENIMENTO",
    subtitle: "Nova identidade para streaming de autor.",
    tagline: "Unimos técnica, estética e narrativa para dar vida às marcas.",
    mobileLines: [],
    client: "Test 2",
    year: "2025",
    category: "Entretenimento",
    ctaLabel: "VER ESTUDO DE CASO",
    ctaHref: "#ent-2",
    topCtaLabel: "VER MÍDIA",
    topCtaHref: "#midia-ent-2",
    media: {
      videoSrc: "",
      poster: "",
      who: "Test 2",
      when: "2025",
      category: "Entretenimento",
      title: "ECHO ROOM",
      subtitle: "Nova identidade para streaming de autor.",
    },
    bgImage: "/assets/bg_hero_publicidade_ambev.webp",
  },
  {
    pos: 3,
    mode: "entertainment",
    kicker: "ESTÚDIO DE PRODUÇÃO CRIATIVA",
    title: "AQUI VAI ENTRETENIMENTO",
    subtitle: "Direção de arte para série original.",
    tagline: "Unimos técnica, estética e narrativa para dar vida às marcas.",
    mobileLines: [],
    client: "Test 3",
    year: "2024",
    category: "Entretenimento",
    ctaLabel: "VER ESTUDO DE CASO",
    ctaHref: "#ent-3",
    topCtaLabel: "VER MÍDIA",
    topCtaHref: "#midia-ent-3",
    media: {
      videoSrc: "",
      poster: "",
      who: "Test 3",
      when: "2024",
      category: "Entretenimento",
      title: "AFTERGLOW",
      subtitle: "Direção de arte para série original.",
    },
    bgImage: "/assets/bg_hero_publicidade_giraffas.webp",
  },
]

const clampHeroPos = (pos: number) => Math.min(3, Math.max(-3, Math.round(pos))) as HeroVariant["pos"]

export const getHeroVariant = (pos: HeroVariant["pos"] | number) => {
  const snappedPos = clampHeroPos(pos)
  const exact = heroVariants.find((variant) => variant.pos === snappedPos)
  if (exact) return exact

  let best = heroVariants[0]
  let bestDist = Infinity
  for (const variant of heroVariants) {
    const d = Math.abs(variant.pos - snappedPos)
    if (d < bestDist) {
      bestDist = d
      best = variant
    }
  }
  return best
}
