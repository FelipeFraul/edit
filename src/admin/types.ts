export type AdminStatus = "draft" | "published"

export type BaseItem = {
  id: string
  order_index: number
  is_active: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export type HeroVariantAdmin = BaseItem & {
  pos: -3 | -2 | -1 | 0 | 1 | 2 | 3
  kicker: string
  title: string
  animatedPrefix: string
  animatedWords: string[]
  tagline: string
  who: string
  when: string
  category: string
  modalTitle: string
  subtitle: string
  videoSrc: string
  poster: string
  bgImage: string
  mobileBgImage: string
  topCtaLabel: string
  topCtaHref: string
  modalBodyText?: string
  badgeResponsible?: string
  badgeAgency?: string
  badgeProdVideo?: string
  badgeProdAudio?: string
  badgeVoice?: string
  badgeOperator?: string
}

export type SectionCard = BaseItem & {
  title: string
  text: string
  hoverText?: string
  icon: string
}

export type SectionStep = BaseItem & {
  name: string
  text: string
  hiddenText?: string
  media: string
}

export type TaxonomyNode = BaseItem & {
  name: string
  children: TaxonomyNode[]
}

export type VoiceFilterAdmin = BaseItem & {
  name: string
  subtitle: string
  hint: string
  items: TaxonomyNode[]
}

export type VoiceFilterKey = "REGIAO" | "IDIOMA" | "IDIOMAS" | "TIMBRE" | "ESTILO" | "OBJETIVO"

export type VoiceTalentAdmin = BaseItem & {
  name: string
  audioFile: string
  audioName: string
  gender?: "MASCULINA" | "FEMININA" | ""
  assignments: Partial<Record<VoiceFilterKey, string[][]>>
}

export type BrandAdmin = BaseItem & {
  name: string
  logo: string
  secondaryLogo?: string
  logoScale?: number
  secondaryLogoScale?: number
}

export type BrandPanelAdmin = BaseItem & {
  brand_id: string
  title: string
  description: string
  voiceType: string
  companyText?: string
  videoSrc?: string
}

export type AudioEntryAdmin = BaseItem & {
  name: string
  file: string
  brand_id: string
}

export type StatAdmin = BaseItem & {
  value: string
  title: string
  description: string
}

export type FooterLinkAdmin = BaseItem & {
  label: string
  url: string
}

export type FooterColumnAdmin = BaseItem & {
  title: string
  links: FooterLinkAdmin[]
}

export type AdminContent = {
  hero: {
    variants: HeroVariantAdmin[]
  }
  section02: {
    title: string
    text: string
    cards: SectionCard[]
  }
  section03: {
    title: string
    text: string
    steps: SectionStep[]
  }
  section04: {
    title: string
    text: string
    filters: VoiceFilterAdmin[]
  }
  section05: {
    title: string
    text: string
    brands: BrandAdmin[]
    panels: BrandPanelAdmin[]
    audios: AudioEntryAdmin[]
  }
  section06: {
    title: string
    text: string
    stats: StatAdmin[]
  }
  section07: {
    title: string
    text: string
    talents: VoiceTalentAdmin[]
  }
  footer: {
    columns: FooterColumnAdmin[]
    copyrightText: string
    city: string
    developerCredit: string
  }
}

export type ContentVersion = {
  id: string
  version_number: number
  data_json: AdminContent
  created_at: string
  created_by: string
  is_published: boolean
}

export type AdminSession = {
  email: string
  logged_at: string
}
