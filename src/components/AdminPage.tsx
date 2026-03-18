import React, { useEffect, useMemo, useState } from "react"
import { createDefaultAdminContent } from "../admin/defaultAdminData"
import {
  clearAdminSession,
  getLatestPublished,
  loadAdminSession,
  loadDraftContent,
  loadDraftContentRemote,
  loadVersions,
  loadVersionsRemote,
  saveAdminSession,
  saveDraftContent,
  saveDraftContentRemote,
  saveVersionRemote,
  saveVersions,
} from "../admin/storage"
import type {
  AdminContent,
  AdminSession,
  AdminStatus,
  BaseItem,
  ContentVersion,
  FooterLinkAdmin,
  SectionCard,
  VoiceFilterAdmin,
  HeroVariantAdmin,
  TaxonomyNode,
  VoiceFilterKey,
  VoiceTalentAdmin,
} from "../admin/types"

const ADMIN_EMAIL = "admin@editgroup.com"
const ADMIN_PASSWORD = "edit@123"

const now = () => new Date().toISOString()
const createId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`

const byOrder = <T extends BaseItem>(a: T, b: T) => a.order_index - b.order_index
const visibleItems = <T extends BaseItem>(items: T[]) => items.filter((entry) => !entry.deleted_at).sort(byOrder)

const normalizeVisibleItems = <T extends BaseItem>(items: T[]) => {
  const deleted = items.filter((entry) => entry.deleted_at)
  const visible = visibleItems(items).map((entry, index) => ({ ...entry, order_index: index + 1, updated_at: now() }))
  return [...visible, ...deleted]
}

const toggleItem = <T extends BaseItem>(items: T[], id: string) =>
  items.map((entry) => (entry.id === id ? { ...entry, is_active: !entry.is_active, updated_at: now() } : entry))
const patchItem = <T extends BaseItem>(items: T[], id: string, patch: Partial<T>) =>
  items.map((entry) => (entry.id === id ? { ...entry, ...patch, updated_at: now() } : entry))
const markDeleted = <T extends BaseItem>(items: T[], id: string) =>
  normalizeVisibleItems(items.map((entry) => (entry.id === id ? { ...entry, is_active: false, deleted_at: now(), updated_at: now() } : entry)))
const reorderByIds = <T extends BaseItem>(items: T[], dragId: string, targetId: string) => {
  if (dragId === targetId) return items
  const visible = visibleItems(items)
  const from = visible.findIndex((entry) => entry.id === dragId)
  const to = visible.findIndex((entry) => entry.id === targetId)
  if (from < 0 || to < 0) return items
  const next = [...visible]
  const [dragged] = next.splice(from, 1)
  next.splice(to, 0, dragged)
  return normalizeVisibleItems([...next, ...items.filter((entry) => entry.deleted_at)])
}

const createBase = (orderIndex: number): BaseItem => ({
  id: createId(),
  order_index: orderIndex,
  is_active: true,
  deleted_at: null,
  created_at: now(),
  updated_at: now(),
})

const sidebarSections = [
  { id: "hero", label: "Hero" },
  { id: "section02", label: "Seção Estúdio" },
  { id: "section03", label: "Seção Produção" },
  { id: "section04", label: "Seção Vozes" },
  { id: "section05", label: "Seção Clientes" },
  { id: "section06", label: "Seção Números" },
  { id: "section07", label: "Adicionar Locutores" },
  { id: "section07bulk", label: "Locutores em Massa" },
] as const
type SidebarSection = (typeof sidebarSections)[number]["id"]

const ASSET_OPTIONS = {
  logos: [
    "/assets/logotipo/isotipo_netshoes.webp",
    "/assets/logotipo/isotipo_mcdonalds.svg",
    "/assets/logotipo/isotipo_globo.svg",
    "/assets/logotipo/isotipo_giraffas.webp",
    "/assets/logotipo/isotipo_bk.svg",
    "/assets/logotipo/isotipo_ambev.webp",
    "/assets/logotipo/isotipo_skala.svg",
    "/assets/logotipo/isotipo_hydrata.svg",
    "/assets/logotipo/isotipo_sata.svg",
    "/assets/logotipo/isotipo_shop_plaza.svg",
    "/assets/logotipo/isotipo_coca.svg",
    "/assets/logotipo/isotipo_sicredi.svg",
    "/assets/logotipo/isotipo_smurf.svg",
    "/assets/logotipo/isotipo_amazon.svg",
  ],
  audios: [
    "/assets/audios/NETSHOES - JOVEM CONVERSADO (BRUNOROCHEL).mp3",
    "/assets/audios/MC DONALDS - DRIVE JOVEM, NATURAL CONVERSADO (BRUNOROCHEL) .mp3",
    "/assets/audios/BURGER KING - JOVEM, NATURAL (BRUNOROCHEL).mp3",
    "/assets/audios/BURGER KING - JOVEM CONVERSADO ANIMADO (BRUNOROCHEL).mp3",
    "/assets/audios/MC DONALDS - NATURAL CONVERSADO (BRUNOROCHEL).mp3",
    "/assets/audios/CASAS BAHIA - VAREJO FELIZ SORRISO HARDSELL.mp3",
    "/assets/audios/MOTOROLA - JOVEM, ANIMADO, NATURAL (BRUNOROCHEL) .mp3",
  ],
  icons: [
    "/assets/icon/bulb-2-svgrepo-com.svg",
    "/assets/icon/attach-svgrepo-com.svg",
    "/assets/icon/time-svgrepo-com.svg",
    "/assets/icon/settings-2-svgrepo-com.svg",
    "/assets/icon/settings-svgrepo-com.svg",
    "/assets/icon/send-1-svgrepo-com.svg",
  ],
  images: [
    "/assets/hero_coca_cola_desk.webp",
    "/assets/hero_edit_group_desk.webp",
    "/assets/hero_bud_desk.webp",
  ],
  videos: [
    "https://player.vimeo.com/video/1168960953?",
  ],
}

const getAssetFileName = (value: string) => {
  if (!value) return ""
  const cleanValue = value.split("?")[0]
  const parts = cleanValue.split("/").filter(Boolean)
  return parts[parts.length - 1] ?? value
}

const normalizeVideoUrl = (raw: string) => {
  const value = raw.trim()
  if (!value) return ""
  try {
    const url = new URL(value)
    const host = url.hostname.toLowerCase()

    if (host.includes("youtu.be")) {
      const id = url.pathname.replace("/", "").trim()
      if (!id) return value
      return `https://www.youtube.com/embed/${id}`
    }

    if (host.includes("youtube.com")) {
      if (url.pathname.startsWith("/embed/")) return value
      const id = url.searchParams.get("v")?.trim()
      if (!id) return value
      return `https://www.youtube.com/embed/${id}`
    }

    if (host === "vimeo.com" || host.endsWith(".vimeo.com")) {
      if (host === "player.vimeo.com") return value
      const id = url.pathname.split("/").filter(Boolean).find((part) => /^\d+$/.test(part))
      if (!id) return value
      return `https://player.vimeo.com/video/${id}`
    }
  } catch {
    return value
  }

  return value
}

const normalizeLogoScale = (raw: number) => {
  if (!Number.isFinite(raw)) return 1
  return Math.min(3, Math.max(0.1, Math.round(raw * 10) / 10))
}

const formatLogoScale = (value: number) => {
  const normalized = normalizeLogoScale(value)
  return Number.isInteger(normalized) ? String(normalized) : normalized.toFixed(1)
}

type VoiceAssignments = Partial<Record<VoiceFilterKey, string[][]>>

const patchVoiceAssignment = (
  source: VoiceAssignments,
  key: VoiceFilterKey,
  groupIndex: number,
  level: number,
  value: string
): VoiceAssignments => {
  const currentGroups = source[key] ?? []
  const currentPath = currentGroups[groupIndex] ?? []
  const nextPath = [...currentPath.slice(0, level)]
  if (value) nextPath.push(value)
  const nextGroups = [...currentGroups]
  nextGroups[groupIndex] = nextPath
  return { ...source, [key]: nextGroups }
}

const addVoiceAssignmentGroup = (source: VoiceAssignments, key: VoiceFilterKey): VoiceAssignments => {
  const currentGroups = source[key] ?? []
  const nextGroups = currentGroups.length === 0 ? [[], []] : [...currentGroups, []]
  return { ...source, [key]: nextGroups }
}

const removeVoiceAssignmentGroup = (source: VoiceAssignments, key: VoiceFilterKey, groupIndex: number): VoiceAssignments => {
  const currentGroups = source[key] ?? []
  const nextGroups = currentGroups.filter((_, idx) => idx !== groupIndex)
  return { ...source, [key]: nextGroups }
}

const toDisplayName = (value: string) =>
  value
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")

const firstNameOnly = (value: string) => {
  const normalized = toDisplayName(value)
  const [first = "Locutor"] = normalized.split(" ").filter(Boolean)
  return first
}

const fallbackFemaleNames = [
  "Ana",
  "Bruna",
  "Carla",
  "Dani",
  "Elisa",
  "Fernanda",
  "Giovana",
  "Helena",
  "Isabela",
  "Julia",
  "Larissa",
  "Marina",
  "Natasha",
  "Paula",
  "Renata",
]

const invalidNameTokens = new Set([
  "REGIAO",
  "IDIOMA",
  "IDIOMAS",
  "ESTILO",
  "NORTE",
  "NORDESTE",
  "SUDESTE",
  "SUL",
  "CENTRO",
  "OESTE",
  "CENTROOESTE",
  "CENTRO-OESTE",
  "CEARA",
  "BR",
  "SP",
  "RJ",
  "MG",
  "RS",
  "SC",
  "PR",
  "GO",
  "DF",
  "MS",
  "MT",
  "BA",
  "PE",
  "PB",
  "RN",
  "PI",
  "MA",
  "AL",
  "SE",
  "PA",
  "AM",
  "RO",
  "RR",
  "TO",
  "AP",
  "AC",
  "FEMININA",
  "MASCULINA",
  "FEMININO",
  "MASCULINO",
  "FEM",
  "MAS",
  "INGLES",
  "ESPANHOL",
  "FRANCES",
  "ITALIANO",
  "MANDARIM",
  "POLONES",
  "ARABE",
  "CONVERSADO",
  "IMPACTANTE",
  "DRAMATICO",
  "INSTITUCIONAL",
  "INFANTIL",
  "MADURA",
])

const inferTalentNameFromFileName = (fileName: string, relativePath?: string) => {
  const baseName = fileName.replace(/\.[^/.]+$/, "")
  const fullText = `${relativePath ?? ""} ${baseName}`
  const tokens = fullText
    .replace(/[()]/g, " ")
    .replace(/[._\-\/\\]+/g, " ")
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean)

  for (const token of tokens) {
    const normalized = normalizeLookup(token)
    if (!normalized || invalidNameTokens.has(normalized) || normalized.length < 3) continue
    if (/^\d+$/.test(normalized)) continue
    return firstNameOnly(token)
  }

  const hashSeed = normalizeLookup(fullText || fileName)
  const hash = hashSeed.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return fallbackFemaleNames[hash % fallbackFemaleNames.length]
}

const bulkInferOptions: Array<{ key: VoiceFilterKey; label: string }> = [
  { key: "REGIAO", label: "Regiao" },
  { key: "IDIOMA", label: "Idioma" },
  { key: "ESTILO", label: "Estilo" },
]

const getBulkRootFolderByKey = (key: VoiceFilterKey) => {
  if (key === "REGIAO") return "regiao"
  if (key === "IDIOMA") return "idioma"
  if (key === "ESTILO") return "estilo"
  return ""
}

const buildBulkAudioAssetPath = (inferKey: VoiceFilterKey, relativePath: string) => {
  const normalized = relativePath.replace(/\\/g, "/").replace(/^\/+/, "")
  const root = getBulkRootFolderByKey(inferKey)
  if (!root) return `/assets/audios/${normalized}`
  const rootPattern = new RegExp(`^${root}(?:/|$)`, "i")
  const full = rootPattern.test(normalized) ? normalized : `${root}/${normalized}`
  return `/assets/audios/${full}`
}

const normalizeLookup = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim()

const flattenTaxonomyEntries = (nodes: TaxonomyNode[], prefix: string[] = []): string[][] => {
  const output: string[][] = []
  for (const node of nodes) {
    const path = [...prefix, node.name]
    output.push(path)
    output.push(...flattenTaxonomyEntries(node.children, path))
  }
  return output
}

const flattenLeafTaxonomyPaths = (nodes: TaxonomyNode[], prefix: string[] = []): string[][] => {
  const output: string[][] = []
  for (const node of nodes) {
    const path = [...prefix, node.name]
    if (!node.children?.length) {
      output.push(path)
      continue
    }
    output.push(...flattenLeafTaxonomyPaths(node.children, path))
  }
  return output
}

const uniquePaths = (paths: string[][]): string[][] => {
  const seen = new Set<string>()
  const output: string[][] = []
  for (const path of paths) {
    const key = path.map((part) => normalizeLookup(part)).join(">")
    if (!key || seen.has(key)) continue
    seen.add(key)
    output.push(path)
  }
  return output
}

const getVoiceFilterByKey = (voiceFilters: VoiceFilterAdmin[], key: VoiceFilterKey) =>
  voiceFilters.find((filter) => {
    const normalized = normalizeFilterKey(filter.name)
    if (key === "IDIOMA") return normalized === "IDIOMA" || normalized === "IDIOMAS"
    return normalized === key
  })

const ignoredInferenceTokens = new Set([
  "MASCULINA",
  "FEMININA",
  "MASCULINO",
  "FEMININO",
  "REGIAO",
  "IDIOMA",
  "IDIOMAS",
  "ESTILO",
  "LOCUTOR",
  "LOCUTORES",
  "VOZ",
  "VOZES",
  "BR",
])

const ufToRegion: Record<string, string> = {
  AC: "NORTE",
  AL: "NORDESTE",
  AP: "NORTE",
  AM: "NORTE",
  BA: "NORDESTE",
  CE: "NORDESTE",
  DF: "CENTRO OESTE",
  ES: "SUDESTE",
  GO: "CENTRO OESTE",
  MA: "NORDESTE",
  MT: "CENTRO OESTE",
  MS: "CENTRO OESTE",
  MG: "SUDESTE",
  PA: "NORTE",
  PB: "NORDESTE",
  PR: "SUL",
  PE: "NORDESTE",
  PI: "NORDESTE",
  RJ: "SUDESTE",
  RN: "NORDESTE",
  RS: "SUL",
  RO: "NORTE",
  RR: "NORTE",
  SC: "SUL",
  SP: "SUDESTE",
  SE: "NORDESTE",
  TO: "NORTE",
}

const regionFolderAliases: Record<string, string[]> = {
  NORTE: ["NORTE"],
  NORDESTE: ["NORDESTE", "NORD"],
  SUDESTE: ["SUDESTE", "SUD", "SE"],
  SUL: ["SUL"],
  "CENTRO OESTE": ["CENTRO OESTE", "CENTRO-OESTE", "CENTROOESTE", "CO", "CENTRO"],
}

const detectGenderFromFolder = (segments: string[]): string | null => {
  for (const segment of segments) {
    if (segment.includes("FEMININA") || segment.includes("FEMININO") || segment.includes("FEM")) return "FEMININA"
    if (segment.includes("MASCULINA") || segment.includes("MASCULINO") || segment.includes("MASC")) return "MASCULINA"
  }
  return null
}

const detectRegionFromFolder = (segments: string[]): string | null => {
  for (const [region, aliases] of Object.entries(regionFolderAliases)) {
    if (aliases.some((alias) => segments.some((segment) => segment.includes(alias)))) return region
  }
  return null
}

const detectRegionFromTokens = (tokens: string[]): string | null => {
  for (const token of tokens) {
    const region = ufToRegion[token]
    if (region) return normalizeLookup(region)
  }
  return null
}

const idiomaAliases: Record<string, string[]> = {
  INGLES: ["ENGLISH", "AMERICAN", "BRITISH", "EN", "ENG", "US", "USA", "UK"],
  ESPANHOL: ["SPANISH", "ESPANOL", "CASTELLANO", "ES", "ESP"],
  FRANCES: ["FRENCH", "FRANCAIS", "FRANCAISE", "FR"],
  ITALIANO: ["ITALIAN", "IT"],
  MANDARIM: ["MANDARIN", "CHINESE"],
  POLONES: ["POLISH", "POLAND", "POLONIA", "POLONES", "POLONESA", "POL"],
  PORTUGUES: ["PORTUGUESE", "BRAZILIAN PORTUGUESE", "PORTUGAL PORTUGUESE", "PT"],
  ARABE: ["ARABIC", "ARAB", "ARABE", "AR"],
}

const idiomaRoots: Record<string, string[]> = {
  INGLES: ["INGL", "ENGL", "BRIT", "AMERIC"],
  ESPANHOL: ["ESPAN", "CASTELL"],
  FRANCES: ["FRANC", "FRENCH", "FRANCAIS"],
  ITALIANO: ["ITAL"],
  MANDARIM: ["MANDAR", "CHINES"],
  POLONES: ["POLON", "POLISH"],
  PORTUGUES: ["PORTUG", "LUSO"],
  ARABE: ["ARAB"],
}

const estiloAliases: Record<string, string[]> = {
  INFANTIL: ["CRIANCA", "CRIANCA", "CHILD", "KID", "KIDS"],
  ADOLESCENTE: ["ADOLESCENCIA", "TEEN", "TEENAGER", "JOVEM"],
  MADURA: ["MADURO", "MATURE", "ADULTA", "ADULTO"],
  SENIOR: ["SENIOR", "IDOSO", "IDOSA"],
  CONVERSADO: ["CONVERSA", "NATURAL", "DIALOGO"],
  ANIMADO: ["ANIMADA", "ENERGICO", "ENERGICA", "ENERGY"],
  IMPACTANTE: ["IMPACTO", "FORTE", "POTENTE"],
  DRAMATICO: ["DRAMATICA", "DRAMA", "CINEMATICO"],
  SUAVE: ["SOFT", "CALMO", "CALMA", "DELICADO", "DELICADA"],
  INSTITUCIONAL: ["CORPORATIVO", "CORPORATIVA", "FORMAL"],
  VAREJO: ["HARDSELL", "PROMOCIONAL", "OFERTA"],
  "VOZES PRETAS": ["VOZ PRETA", "VOZES PRETAS", "BLACK VOICES"],
}

const estiloRoots: Record<string, string[]> = {
  INFANTIL: ["INFANT", "CRIANC"],
  ADOLESCENTE: ["ADOLESC", "TEEN"],
  MADURA: ["MADUR", "MATURE"],
  SENIOR: ["SENIOR", "IDOS"],
  CONVERSADO: ["CONVERS", "NATUR"],
  ANIMADO: ["ANIM", "ENERG"],
  IMPACTANTE: ["IMPACT", "POTENT", "FORTE"],
  DRAMATICO: ["DRAM"],
  SUAVE: ["SUAV", "SOFT", "CALM"],
  INSTITUCIONAL: ["INSTITUC", "CORPORAT"],
  VAREJO: ["VAREJ", "HARDSELL", "PROMOC"],
  "VOZES PRETAS": ["PRET", "BLACK"],
}

const getLookupTerms = (selectedKey: VoiceFilterKey, normalizedPart: string) => {
  const terms = [normalizedPart]
  if (selectedKey === "IDIOMA") {
    const aliases = idiomaAliases[normalizedPart] ?? []
    for (const alias of aliases) terms.push(normalizeLookup(alias))
  }
  if (selectedKey === "ESTILO") {
    const aliases = estiloAliases[normalizedPart] ?? []
    for (const alias of aliases) terms.push(normalizeLookup(alias))
  }
  return Array.from(new Set(terms))
}

const inferPathForSelectedFilter = (
  fileName: string,
  relativePath: string,
  voiceFilters: VoiceFilterAdmin[],
  selectedKey: VoiceFilterKey
): string[][] => {
  const filter = getVoiceFilterByKey(voiceFilters, selectedKey)
  if (!filter) return []

  const entries = flattenTaxonomyEntries(filter.items)
  if (!entries.length) return []

  const fileBase = fileName.replace(/\.[^/.]+$/, "")
  const normalizedRelativePath = relativePath.replace(/\\/g, "/")
  const pathBase = normalizedRelativePath.replace(/\.[^/.]+$/, "")
  const folderSegments = normalizedRelativePath
    .split("/")
    .slice(0, -1)
    .map((segment) => normalizeLookup(segment))
    .filter(Boolean)
  const folderGender = selectedKey === "REGIAO" ? detectGenderFromFolder(folderSegments) : null
  const folderRegion = selectedKey === "REGIAO" ? detectRegionFromFolder(folderSegments) : null
  const fullText =
    selectedKey === "ESTILO" || selectedKey === "IDIOMA"
      ? normalizeLookup(`${fileBase} ${pathBase}`)
      : normalizeLookup(fileBase)
  const tokens = fullText.split(" ").filter(Boolean)
  const tokenSet = new Set(tokens)

  if (selectedKey === "REGIAO") {
    const desiredGender = folderGender
    const desiredRegion = folderRegion ?? detectRegionFromTokens(tokens)

    const matchGenderAndRegion = entries.find((path) => {
      const normalizedPath = path.map((part) => normalizeLookup(part))
      return Boolean(desiredGender && desiredRegion && normalizedPath.includes(desiredGender) && normalizedPath.includes(desiredRegion))
    })
    if (matchGenderAndRegion) return [matchGenderAndRegion]

    const matchGenderOnly = entries.find((path) => {
      if (!desiredGender) return false
      const normalizedPath = path.map((part) => normalizeLookup(part))
      return path.length === 1 && normalizedPath.includes(desiredGender)
    })
    if (matchGenderOnly) return [matchGenderOnly]
  }

  let bestScore = 0
  let bestPath: string[] | null = null

  for (const path of entries) {
    let score = 0
    const normalizedPath = path.map((part) => normalizeLookup(part))
    for (const part of path) {
      const normalizedPart = normalizeLookup(part)
      if (!normalizedPart || ignoredInferenceTokens.has(normalizedPart)) continue
      const lookupTerms = getLookupTerms(selectedKey, normalizedPart)
      const hasExact = lookupTerms.some((term) => tokenSet.has(term))
      const hasContains = lookupTerms.some((term) => term.length >= 4 && fullText.includes(term))
      if (hasExact) score += 8
      else if (hasContains) score += 4

      if (selectedKey === "IDIOMA") {
        const roots = idiomaRoots[normalizedPart] ?? []
        const hasRoot = roots.some((root) => fullText.includes(normalizeLookup(root)))
        if (hasRoot) score += 6
      }
      if (selectedKey === "ESTILO") {
        const roots = estiloRoots[normalizedPart] ?? []
        const hasRoot = roots.some((root) => fullText.includes(normalizeLookup(root)))
        if (hasRoot) score += 6
      }
    }

    if (selectedKey === "REGIAO") {
      const ufRegionHits = tokens
        .map((token) => ufToRegion[token])
        .filter(Boolean)
        .map((value) => normalizeLookup(value))

      // Folder is the primary reference for region filter.
      if (folderGender) {
        if (normalizedPath.includes(folderGender)) score += 26
        else score -= 12
      }
      if (folderRegion) {
        if (normalizedPath.includes(folderRegion)) score += 28
        else score -= 14
      }
      if (ufRegionHits.some((region) => normalizedPath.includes(region))) score += 12
    }

    if (score > bestScore || (score === bestScore && bestPath && path.length > bestPath.length)) {
      bestScore = score
      bestPath = path
    }
  }

  return bestPath && bestScore > 0 ? [bestPath] : []
}

const inferAssignmentsFromFileName = (
  fileName: string,
  relativePath: string,
  voiceFilters: VoiceFilterAdmin[],
  baseAssignments: VoiceAssignments,
  selectedKey: VoiceFilterKey
): VoiceAssignments => {
  const merged: VoiceAssignments = { ...baseAssignments }
  const existing = (baseAssignments[selectedKey] ?? []).map((path) => [...path])
  const inferred = inferPathForSelectedFilter(fileName, relativePath, voiceFilters, selectedKey)
  merged[selectedKey] = uniquePaths([...existing, ...inferred])
  return merged
}

const formatAssignmentPreview = (assignments: VoiceAssignments, key: VoiceFilterKey) => {
  const groups = assignments[key] ?? []
  if (!groups.length) return "nao identificado"
  return groups
    .filter((path) => path.length > 0)
    .map((path) => path.join(" > "))
    .join(" | ")
}

const extractSequentialFiltersFromAssignments = (assignments: VoiceAssignments) => {
  const regionPath = assignments.REGIAO?.[0] ?? []
  const idiomaPath = (assignments.IDIOMAS?.[0] ?? assignments.IDIOMA?.[0] ?? []) as string[]
  const estiloPath = assignments.ESTILO?.[0] ?? []
  const genderPath = assignments.OBJETIVO?.[0] ?? []

  const isGender = (value: string) => {
    const normalized = normalizeLookup(value)
    return normalized === "MASCULINA" || normalized === "FEMININA"
  }

  const genero =
    regionPath.find((part) => isGender(part)) ??
    idiomaPath.find((part) => isGender(part)) ??
    genderPath.find((part) => isGender(part)) ??
    ""
  const regiao = regionPath.find((part) => !isGender(part)) ?? ""
  const idioma = idiomaPath.find((part) => !isGender(part)) ?? ""
  const estilo = estiloPath[0] ?? ""

  return { genero, regiao, idioma, estilo }
}

const normalizeGenderValue = (value: string) => {
  const normalized = normalizeLookup(value)
  if (normalized === "MASCULINA" || normalized === "MASCULINO" || normalized === "MASC" || normalized === "MAS") return "MASCULINA"
  if (normalized === "FEMININA" || normalized === "FEMININO" || normalized === "FEM") return "FEMININA"
  return ""
}

const buildAssignmentsFromSequentialFilters = (
  existingAssignments: VoiceAssignments,
  filters: { genero: string; regiao: string; idioma: string; estilo: string }
): VoiceAssignments => {
  const next: VoiceAssignments = { ...existingAssignments }
  const normalizedGender = normalizeGenderValue(filters.genero)
  const genderPath = normalizedGender ? [normalizedGender] : []

  if (filters.regiao) {
    next.REGIAO = [[...genderPath, filters.regiao]]
  } else {
    delete next.REGIAO
  }

  if (filters.idioma) {
    next.IDIOMAS = [[...genderPath, filters.idioma]]
    delete next.IDIOMA
  } else {
    delete next.IDIOMAS
    delete next.IDIOMA
  }

  if (filters.estilo) next.ESTILO = [[filters.estilo]]
  else delete next.ESTILO

  if (normalizedGender) next.OBJETIVO = [[normalizedGender]]
  else delete next.OBJETIVO

  return next
}

const extractPrimaryTerm = (path: string[]) =>
  path.find((part) => {
    const normalized = normalizeLookup(part)
    return normalized !== "MASCULINA" && normalized !== "FEMININA"
  }) ?? ""

const applyManualBulkAssignments = (
  baseAssignments: VoiceAssignments,
  manual: { genero: string; regiao: string; idioma: string; estilo: string }
): VoiceAssignments => {
  const next: VoiceAssignments = { ...baseAssignments }
  const normalizedGender = normalizeGenderValue(manual.genero)
  const genderPath = normalizedGender ? [normalizedGender] : []

  if (manual.regiao) {
    next.REGIAO = [[...genderPath, manual.regiao]]
  }
  if (manual.idioma) {
    next.IDIOMAS = [[...genderPath, manual.idioma]]
  }
  if (manual.estilo) {
    next.ESTILO = [[manual.estilo]]
  }
  if (normalizedGender) {
    next.OBJETIVO = [[normalizedGender]]
  }

  return next
}

const sanitizeVoiceAssignments = (assignments: VoiceAssignments): VoiceAssignments => {
  const next: VoiceAssignments = {}
  for (const [key, groups] of Object.entries(assignments)) {
    const cleaned = (groups ?? [])
      .filter((group): group is string[] => Array.isArray(group))
      .map((group) => group.map((part) => String(part).trim()).filter(Boolean))
      .filter((group) => group.length > 0)
    if (cleaned.length > 0) next[key as VoiceFilterKey] = cleaned
  }
  return next
}

const inferAssignmentFromFolderStructure = (
  relativePath: string,
  fileName: string,
  sourceKey: VoiceFilterKey
): VoiceAssignments => {
  const normalizedPath = relativePath.replace(/\\/g, "/")
  const segments = normalizedPath
    .split("/")
    .slice(0, -1)
    .map((segment) => normalizeLookup(segment))
    .filter(Boolean)

  const allText = normalizeLookup(`${normalizedPath} ${fileName}`)
  const detectGender = () => {
    if (/(^| )MASCULINA( |$)|(^| )MASCULINO( |$)|(^| )MASC( |$)|(^| )MAS( |$)/.test(allText)) return "MASCULINA"
    if (/(^| )FEMININA( |$)|(^| )FEMININO( |$)|(^| )FEM( |$)/.test(allText)) return "FEMININA"
    return ""
  }
  const gender = detectGender()

  const axisBySegment = () => {
    const lookup = segments.join(" ")
    if (lookup.includes("REGIAO")) return "REGIAO" as VoiceFilterKey
    if (lookup.includes("IDIOMA") || lookup.includes("IDIOMAS")) return "IDIOMA" as VoiceFilterKey
    if (lookup.includes("ESTILO")) return "ESTILO" as VoiceFilterKey
    return sourceKey
  }
  const axis = axisBySegment()

  const genericTokens = new Set([
    "REGIAO",
    "IDIOMA",
    "IDIOMAS",
    "ESTILO",
    "MASCULINA",
    "MASCULINO",
    "MASC",
    "MAS",
    "FEMININA",
    "FEMININO",
    "FEM",
  ])

  let primary = segments.find((segment) => !genericTokens.has(segment)) ?? ""
  if (!primary && axis === "REGIAO") {
    const tokens = allText.split(" ").filter(Boolean)
    const regionByUf = tokens.map((token) => ufToRegion[token]).find(Boolean)
    if (regionByUf) primary = normalizeLookup(regionByUf)
  }

  if (!primary) return {}

  if (axis === "REGIAO") return { REGIAO: [[...(gender ? [gender] : []), primary]] }
  if (axis === "ESTILO") return { ESTILO: [[primary]] }
  return { IDIOMAS: [[...(gender ? [gender] : []), primary]] }
}

const detectBulkGender = (relativePath: string, fileName: string) => {
  const text = normalizeLookup(`${relativePath} ${fileName}`)
  if (/(^| )MASCULINA( |$)|(^| )MASCULINO( |$)|(^| )MASC( |$)|(^| )MAS( |$)/.test(text)) return "MASCULINA"
  if (/(^| )FEMININA( |$)|(^| )FEMININO( |$)|(^| )FEM( |$)/.test(text)) return "FEMININA"
  return ""
}

const toIdiomaLabel = (value: string) => normalizeLookup(value).replace(/\s+/g, " ").trim()

const inferIdiomaFromUploadText = (relativePath: string, fileName: string, sourceKey?: VoiceFilterKey) => {
  const normalizedPath = relativePath.replace(/\\/g, "/")
  const rawSegments = normalizedPath
    .split("/")
    .slice(0, -1)
    .map((segment) => segment.trim())
    .filter(Boolean)
  const normalizedSegments = rawSegments.map((segment) => normalizeLookup(segment))
  const text = normalizeLookup(`${relativePath} ${fileName}`)

  const markerTokens = new Set(["IDIOMA", "IDIOMAS", "LINGUA", "LINGUAS", "LANGUAGE", "LANGUAGES"])
  const markerIndex = normalizedSegments.findIndex((segment) => markerTokens.has(segment))
  if (markerIndex >= 0) {
    const nextFolder = rawSegments[markerIndex + 1]
    if (nextFolder) {
      const label = toIdiomaLabel(nextFolder)
      if (label) return label
    }
  }

  if (sourceKey === "IDIOMA") {
    const ignored = new Set([
      "IDIOMA",
      "IDIOMAS",
      "REGIAO",
      "ESTILO",
      "MASCULINA",
      "FEMININA",
      "MASCULINO",
      "FEMININO",
      "MASC",
      "FEM",
      "MAS",
      "NORTE",
      "NORDESTE",
      "SUDESTE",
      "SUL",
      "CENTRO OESTE",
      "CENTROOESTE",
    ])
    for (let index = normalizedSegments.length - 1; index >= 0; index -= 1) {
      const candidate = normalizedSegments[index]
      if (!candidate || ignored.has(candidate)) continue
      return candidate
    }
  }

  if (/(^| )PORTUGUES( |$).*(^| )PT( |$)|(^| )PT( |$).*(^| )PORTUGUES( |$)/.test(text)) return "PORTUGUES PT"
  if (/(^| )PORTUGUES( |$).*(^| )BR( |$)|(^| )BR( |$).*(^| )PORTUGUES( |$)/.test(text)) return "PORTUGUES BR"

  const directMap: Record<string, string> = {
    PORTUGUES: "PORTUGUES",
    PORTUGUESA: "PORTUGUES",
    PORTUGAL: "PORTUGUES PT",
    BRASIL: "PORTUGUES BR",
    BRASILEIRO: "PORTUGUES BR",
    BRASILEIRA: "PORTUGUES BR",
    INGLES: "INGLES",
    ENGLISH: "INGLES",
    ESPANHOL: "ESPANHOL",
    SPANISH: "ESPANHOL",
    MANDARIM: "MANDARIM",
    CHINES: "MANDARIM",
    ITALIANO: "ITALIANO",
    ITALIA: "ITALIANO",
    FRANCES: "FRANCES",
    FRANCAIS: "FRANCES",
    FRANCA: "FRANCES",
    POLONES: "POLONES",
    POLONIA: "POLONES",
    ARABE: "ARABE",
    ARABIA: "ARABE",
  }

  for (const [token, idioma] of Object.entries(directMap)) {
    if (new RegExp(`(^| )${token}( |$)`).test(text)) return idioma
  }

  return ""
}

const normalizeBulkPathGender = (
  assignments: VoiceAssignments,
  sourceKey: VoiceFilterKey,
  detectedGender: string
): VoiceAssignments => {
  if (!detectedGender) return assignments
  const key = sourceKey === "IDIOMA" ? "IDIOMAS" : sourceKey
  const groups = assignments[key] ?? []
  if (!groups.length) return assignments
  const nextGroups = groups.map((path) => {
    if (!path.length) return path
    const first = normalizeLookup(path[0])
    if (first === "MASCULINA" || first === "FEMININA") return path
    return [detectedGender, ...path]
  })
  return { ...assignments, [key]: nextGroups }
}

const resolveBulkAssignments = (
  fileName: string,
  relativePath: string,
  voiceFilters: VoiceFilterAdmin[],
  baseAssignments: VoiceAssignments,
  manual: { genero: string; regiao: string; idioma: string; estilo: string },
  sourceKey: VoiceFilterKey
): VoiceAssignments => {
  return resolveBulkAssignmentsWithMeta(fileName, relativePath, voiceFilters, baseAssignments, manual, sourceKey).assignments
}

const resolveBulkAssignmentsWithMeta = (
  fileName: string,
  relativePath: string,
  voiceFilters: VoiceFilterAdmin[],
  baseAssignments: VoiceAssignments,
  manual: { genero: string; regiao: string; idioma: string; estilo: string },
  sourceKey: VoiceFilterKey
): { assignments: VoiceAssignments; source: "manual" | "folder" | "filename" | "none" } => {
  // Manual values override when provided.
  const manualApplied = sanitizeVoiceAssignments(applyManualBulkAssignments(baseAssignments, manual))

  const sourceAssignmentKey = sourceKey === "IDIOMA" ? "IDIOMAS" : sourceKey
  const hasManualForSource = (manualApplied[sourceAssignmentKey] ?? []).length > 0
  if (hasManualForSource) return { assignments: manualApplied, source: "manual" }

  const folderBased = sanitizeVoiceAssignments({
    ...manualApplied,
    ...inferAssignmentFromFolderStructure(relativePath, fileName, sourceKey),
  })
  if ((folderBased[sourceAssignmentKey] ?? []).length > 0) return { assignments: folderBased, source: "folder" }

  // Fallback only for the selected source filter: infer from folder/file naming.
  const inferred = inferAssignmentsFromFileName(
    fileName,
    relativePath,
    voiceFilters,
    folderBased,
    sourceKey
  )
  const detectedGender = detectBulkGender(relativePath, fileName)
  const normalized = sanitizeVoiceAssignments(normalizeBulkPathGender(inferred, sourceKey, detectedGender))
  if ((normalized[sourceAssignmentKey] ?? []).length > 0) return { assignments: normalized, source: "filename" }
  const inferredIdioma = inferIdiomaFromUploadText(relativePath, fileName, sourceKey)
  if (inferredIdioma) {
    const withIdioma: VoiceAssignments = {
      ...normalized,
      IDIOMAS: [[...(detectedGender ? [detectedGender] : []), inferredIdioma]],
    }
    return { assignments: sanitizeVoiceAssignments(withIdioma), source: "filename" }
  }
  return { assignments: normalized, source: "none" }
}

const VoiceAssignmentsEditor: React.FC<{
  voiceFilters: VoiceFilterAdmin[]
  assignments: VoiceAssignments
  onChange: (value: VoiceAssignments) => void
}> = ({ voiceFilters, assignments, onChange }) => (
  <div className="border border-black/15 bg-black/[0.02] p-3">
    <div className="text-[11px] uppercase tracking-[0.14em] text-black/75 mb-2">Filtros</div>
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {voiceFilters.map((filter) => {
        const key = normalizeFilterKey(filter.name) as VoiceFilterKey
        const groups = assignments[key] ?? []
        const ensuredGroups = groups.length ? groups : [[]]
        return (
          <div key={`speaker-filter-${key}`} className="space-y-2 border border-black/10 bg-white p-3">
            {ensuredGroups.map((selectedPath, groupIndex) => {
              const levels = getTaxonomyLevelOptions(filter.items, selectedPath)
              return (
                <div key={`speaker-filter-group-${key}-${groupIndex}`} className="group space-y-2 border border-black/10 p-2">
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] uppercase tracking-[0.14em] text-black/70">{filter.name}</div>
                    <div className="flex items-center gap-1">
                      <Button onClick={() => onChange(addVoiceAssignmentGroup(assignments, key))}>+</Button>
                      {ensuredGroups.length > 1 ? (
                        <Button
                          className="border-red-400 text-red-700 opacity-0 transition-opacity group-hover:opacity-100"
                          onClick={() => onChange(removeVoiceAssignmentGroup(assignments, key, groupIndex))}
                        >
                          x
                        </Button>
                      ) : null}
                    </div>
                  </div>
                  {levels.length === 0 ? (
                    <div className="text-xs text-black/55">Sem subfiltros cadastrados.</div>
                  ) : null}
                  {levels.map((options, levelIndex) => (
                    <select
                      key={`speaker-filter-${key}-group-${groupIndex}-level-${levelIndex}`}
                      className="w-full border border-black/20 px-2 py-2 text-sm"
                      value={selectedPath[levelIndex] ?? ""}
                      onChange={(event) =>
                        onChange(patchVoiceAssignment(assignments, key, groupIndex, levelIndex, event.target.value))
                      }
                    >
                      <option value="">Selecionar</option>
                      {options.map((option) => (
                        <option key={`speaker-filter-${key}-group-${groupIndex}-option-${levelIndex}-${option}`} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ))}
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  </div>
)

const AssetAutocompleteInput: React.FC<{
  value: string
  options: string[]
  onChange: (value: string) => void
  placeholder?: string
  displayFileName?: boolean
}> = ({ value, options, onChange, placeholder = "Digite 3 letras para buscar...", displayFileName = true }) => {
  const [query, setQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)

  const displayValue = (entry: string) => (displayFileName ? getAssetFileName(entry) : entry)

  useEffect(() => {
    setQuery(displayValue(value))
  }, [value, displayFileName])

  const normalizedQuery = query.trim().toLowerCase()
  const filteredOptions = useMemo(() => {
    if (normalizedQuery.length < 3) return []
    return options
      .filter((entry) => {
        const name = displayValue(entry).toLowerCase()
        return name.includes(normalizedQuery) || entry.toLowerCase().includes(normalizedQuery)
      })
      .slice(0, 20)
  }, [options, normalizedQuery, displayFileName])

  return (
    <div className="relative mt-1">
      <input
        className="w-full border border-black/20 px-2 py-2 text-sm"
        value={query}
        placeholder={placeholder}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 120)}
        onChange={(event) => {
          const next = event.target.value
          setQuery(next)
          onChange(next.trim())
        }}
      />
      {isOpen && normalizedQuery.length >= 3 ? (
        <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto border border-black/20 bg-white shadow-sm">
          {filteredOptions.length ? (
            filteredOptions.map((entry) => (
              <button
                key={`asset-option-${entry}`}
                type="button"
                className="block w-full border-b border-black/10 px-2 py-2 text-left text-sm last:border-b-0 hover:bg-black/5"
                onMouseDown={(event) => {
                  event.preventDefault()
                  onChange(entry)
                  setQuery(displayValue(entry))
                  setIsOpen(false)
                }}
              >
                {displayValue(entry)}
              </button>
            ))
          ) : (
            <div className="px-2 py-2 text-xs text-black/60">Nenhum arquivo encontrado.</div>
          )}
        </div>
      ) : null}
    </div>
  )
}

const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className = "", ...props }) => (
  <button
    {...props}
    className={`border border-black/20 px-2 py-1 text-[11px] uppercase tracking-[0.14em] transition-colors duration-200 hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
  />
)

const CrudActions: React.FC<{
  item: BaseItem
  onToggle?: () => void
  onDelete?: () => void
  showToggle?: boolean
  showDelete?: boolean
}> = ({ item, onToggle, onDelete, showToggle = true, showDelete = true }) => (
  <div className="flex items-center gap-2">
    {showToggle ? <Button onClick={onToggle}>{item.is_active ? "Ativo" : "Off"}</Button> : null}
    {showDelete ? <Button onClick={onDelete} className="border-red-400 text-red-700">Excluir</Button> : null}
  </div>
)

const flattenTaxonomyPaths = (nodes: TaxonomyNode[], prefix: string[] = []): string[] => {
  const output: string[] = []
  for (const node of nodes) {
    const path = [...prefix, node.name]
    output.push(path.join(" > "))
    output.push(...flattenTaxonomyPaths(node.children, path))
  }
  return output
}

const buildTaxonomyFromPaths = (input: string): TaxonomyNode[] => {
  type DraftNode = { name: string; children: Map<string, DraftNode> }
  const root = new Map<string, DraftNode>()
  const lines = input
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)

  for (const line of lines) {
    const parts = line
      .split(">")
      .map((part) => part.trim())
      .filter(Boolean)
    if (!parts.length) continue

    let level = root
    for (const part of parts) {
      const existing = level.get(part)
      if (existing) {
        level = existing.children
        continue
      }
      const created: DraftNode = { name: part, children: new Map() }
      level.set(part, created)
      level = created.children
    }
  }

  const toNodes = (level: Map<string, DraftNode>): TaxonomyNode[] => {
    let order = 1
    return Array.from(level.values()).map((entry) => ({
      ...(createBase(order++) as TaxonomyNode),
      name: entry.name,
      children: toNodes(entry.children),
    }))
  }

  return toNodes(root)
}

const normalizeFilterKey = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9]/g, "")
    .toUpperCase()

const getTaxonomyLevelOptions = (nodes: TaxonomyNode[], selectedPath: string[]): string[][] => {
  const levels: string[][] = []
  let currentNodes = nodes
  let depth = 0
  while (currentNodes.length && depth < 5) {
    levels.push(currentNodes.map((entry) => entry.name))
    const selected = selectedPath[depth]
    const nextNode = currentNodes.find((entry) => entry.name === selected)
    currentNodes = nextNode?.children ?? []
    depth += 1
  }
  return levels
}

const TaxonomyField: React.FC<{
  value: TaxonomyNode[]
  onChange: (value: TaxonomyNode[]) => void
}> = ({ value, onChange }) => {
  const [text, setText] = useState("")

  useEffect(() => {
    setText(flattenTaxonomyPaths(value).join("\n"))
  }, [value])

  return (
    <div className="space-y-1">
      <div className="text-[11px] uppercase tracking-[0.14em] text-black/70">Hierarquia (uma linha por caminho)</div>
      <textarea
        className="min-h-28 w-full border border-black/20 p-2 text-sm"
        value={text}
        onChange={(event) => {
          const next = event.target.value
          setText(next)
          onChange(buildTaxonomyFromPaths(next))
        }}
        placeholder={"REGIÃƒO > NORDESTE\nREGIÃƒO > NORDESTE > SALVADOR\nIDIOMA > PORTUGUÃŠS"}
      />
      <p className="text-[11px] text-black/55">Use &quot; &gt; &quot; para separar nÃ­veis.</p>
    </div>
  )
}

const FooterLinksField: React.FC<{
  value: FooterLinkAdmin[]
  onChange: (value: FooterLinkAdmin[]) => void
}> = ({ value, onChange }) => {
  const activeLinks = value.filter((entry) => !entry.deleted_at).sort(byOrder)
  const sync = (next: FooterLinkAdmin[]) =>
    onChange(
      next.map((entry, index) => ({
        ...entry,
        order_index: index + 1,
        updated_at: now(),
      }))
    )

  return (
    <div className="space-y-2">
      <div className="text-[11px] uppercase tracking-[0.14em] text-black/70">Links</div>
      {activeLinks.map((link) => (
        <div key={link.id} className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_1fr_auto]">
          <input
            className="w-full border border-black/20 px-2 py-2 text-sm"
            placeholder="Texto do link"
            value={link.label}
            onChange={(event) =>
              sync(activeLinks.map((entry) => (entry.id === link.id ? { ...entry, label: event.target.value } : entry)))
            }
          />
          <input
            className="w-full border border-black/20 px-2 py-2 text-sm"
            placeholder="URL"
            value={link.url}
            onChange={(event) =>
              sync(activeLinks.map((entry) => (entry.id === link.id ? { ...entry, url: event.target.value } : entry)))
            }
          />
          <Button className="border-red-400 text-red-700" onClick={() => sync(activeLinks.filter((entry) => entry.id !== link.id))}>
            Remover
          </Button>
        </div>
      ))}
      <Button
        onClick={() =>
          sync([
            ...activeLinks,
            {
              ...(createBase(activeLinks.length + 1) as FooterLinkAdmin),
              label: "",
              url: "",
            },
          ])
        }
      >
        Adicionar Link
      </Button>
    </div>
  )
}

const LoginView: React.FC<{ onLogin: (session: AdminSession) => void }> = ({ onLogin }) => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  return (
    <div className="min-h-screen bg-[#0E1A37] text-white flex items-center justify-center p-6">
      <form
        onSubmit={(event) => {
          event.preventDefault()
          if (email.trim().toLowerCase() !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
            setError("Credenciais invÃ¡lidas")
            return
          }
          const session: AdminSession = { email: ADMIN_EMAIL, logged_at: now() }
          saveAdminSession(session)
          onLogin(session)
        }}
        className="w-full max-w-md border border-white/30 bg-black/30 p-6 space-y-4"
      >
        <h1 className="font-secular text-2xl uppercase tracking-wide">Admin Edit Group</h1>
        <input className="w-full border border-white/40 bg-transparent px-3 py-2 text-sm" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" />
        <input type="password" className="w-full border border-white/40 bg-transparent px-3 py-2 text-sm" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Senha" />
        {error ? <p className="text-sm text-red-300">{error}</p> : null}
        <button type="submit" className="w-full border border-white/50 bg-white py-2 text-sm uppercase tracking-[0.18em] text-black transition-colors duration-200 hover:bg-black hover:text-white">Entrar</button>
      </form>
    </div>
  )
}

export default function AdminPage() {
  const [session, setSession] = useState<AdminSession | null>(() => loadAdminSession())
  const [content, setContent] = useState<AdminContent>(() => loadDraftContent())
  const [versions, setVersions] = useState<ContentVersion[]>(() => loadVersions())
  const [status, setStatus] = useState<AdminStatus>(() => (getLatestPublished(loadVersions()) ? "published" : "draft"))
  const [activeSection, setActiveSection] = useState<SidebarSection>("hero")
  const [showHistory, setShowHistory] = useState(false)
  const [dragId, setDragId] = useState<string | null>(null)
  const [editingHeroPos, setEditingHeroPos] = useState<-3 | -2 | -1 | 0 | 1 | 2 | 3 | null>(null)
  const [heroDragPos, setHeroDragPos] = useState<-3 | -2 | -1 | 1 | 2 | 3 | null>(null)
  const [heroDeleteMode, setHeroDeleteMode] = useState(false)
  const [heroCreateOpen, setHeroCreateOpen] = useState(false)
  const [heroCreateType, setHeroCreateType] = useState<"central" | "slide">("slide")
  const [heroCreatePos, setHeroCreatePos] = useState<-3 | -2 | -1 | 1 | 2 | 3>(-3)
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)
  const [heroCreateDraft, setHeroCreateDraft] = useState({
    who: "",
    title: "",
    tagline: "",
    videoSrc: "",
    bgImage: "",
  })
  const [sectionMetaModal, setSectionMetaModal] = useState<null | "section02" | "section04" | "section05" | "section06" | "section07">(null)
  const [sectionMetaDraft, setSectionMetaDraft] = useState({ title: "", text: "" })
  const [section02CardModalId, setSection02CardModalId] = useState<string | null>(null)
  const [section02CardDraft, setSection02CardDraft] = useState({ title: "", text: "", hoverText: "", icon: "" })
  const [section05ModalBrandId, setSection05ModalBrandId] = useState<string | "new" | null>(null)
  const [section05Draft, setSection05Draft] = useState({
    name: "",
    logo: "",
    secondaryLogo: "",
    logoScale: 1,
    secondaryLogoScale: 1,
    title: "",
    description: "",
    voiceType: "",
    companyText: "",
    videoSrc: "",
  })
  const [section07ModalId, setSection07ModalId] = useState<string | "new" | null>(null)
  const [section07BulkModalOpen, setSection07BulkModalOpen] = useState(false)
  const [section07Draft, setSection07Draft] = useState<{
    name: string
    audioFile: string
    audioName: string
    assignments: Partial<Record<VoiceFilterKey, string[][]>>
  }>({
    name: "",
    audioFile: "",
    audioName: "",
    assignments: {},
  })
  const [section07FilterDraft, setSection07FilterDraft] = useState({
    genero: "",
    regiao: "",
    idioma: "",
    estilo: "",
  })
  const [section07BulkDraft, setSection07BulkDraft] = useState<{
    assignments: VoiceAssignments
    files: File[]
    sourceKey: VoiceFilterKey
    manual: {
      genero: string
      regiao: string
      idioma: string
      estilo: string
    }
  }>({
    assignments: {},
    files: [],
    sourceKey: "REGIAO",
    manual: {
      genero: "",
      regiao: "",
      idioma: "",
      estilo: "",
    },
  })
  const [talentFilterRegiao, setTalentFilterRegiao] = useState("")
  const [talentFilterIdioma, setTalentFilterIdioma] = useState("")
  const [talentFilterEstilo, setTalentFilterEstilo] = useState("")
  const [talentFilterGenero, setTalentFilterGenero] = useState("")
  const [talentSearch, setTalentSearch] = useState("")
  const [footerMetaModalOpen, setFooterMetaModalOpen] = useState(false)
  const [footerMetaDraft, setFooterMetaDraft] = useState({
    copyrightText: "",
    city: "",
    developerCredit: "",
  })

  useEffect(() => {
    let cancelled = false
    const hydrateFromRemote = async () => {
      const [remoteDraft, remoteVersions] = await Promise.all([loadDraftContentRemote(), loadVersionsRemote()])
      if (cancelled) return
      if (remoteDraft) setContent(remoteDraft)
      if (remoteVersions && remoteVersions.length) {
        setVersions(remoteVersions)
        setStatus(getLatestPublished(remoteVersions) ? "published" : "draft")
      }
    }
    void hydrateFromRemote()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const activeCards = visibleItems(content.section02.cards)
    if (activeCards.length > 0) return
    const fallbackCards = visibleItems(createDefaultAdminContent().section02.cards).slice(0, 3)
    mutateContent((prev) => ({
      ...prev,
      section02: {
        ...prev.section02,
        cards: normalizeVisibleItems(
          fallbackCards.map((card, index) => ({
            ...card,
            order_index: index + 1,
            is_active: true,
            deleted_at: null,
            updated_at: now(),
          }))
        ),
      },
    }))
  }, [content.section02.cards])

  useEffect(() => {
    const activeSteps = visibleItems(content.section03.steps)
    if (activeSteps.length > 0) return
    const fallbackSteps = visibleItems(createDefaultAdminContent().section03.steps).slice(0, 3)
    mutateContent((prev) => ({
      ...prev,
      section03: {
        ...prev.section03,
        steps: normalizeVisibleItems(
          fallbackSteps.map((step, index) => ({
            ...step,
            order_index: index + 1,
            is_active: true,
            deleted_at: null,
            updated_at: now(),
          }))
        ),
      },
    }))
  }, [content.section03.steps])

  useEffect(() => {
    const activeStats = visibleItems(content.section06.stats)
    if (activeStats.length > 0) return
    const fallbackStats = visibleItems(createDefaultAdminContent().section06.stats).slice(0, 4)
    mutateContent((prev) => ({
      ...prev,
      section06: {
        ...prev.section06,
        stats: normalizeVisibleItems(
          fallbackStats.map((stat, index) => ({
            ...stat,
            order_index: index + 1,
            is_active: true,
            deleted_at: null,
            updated_at: now(),
          }))
        ),
      },
    }))
  }, [content.section06.stats])

  useEffect(() => {
    const activeColumns = visibleItems(content.footer.columns)
    if (activeColumns.length > 0) return
    const fallbackColumns = visibleItems(createDefaultAdminContent().footer.columns).slice(0, 3)
    mutateContent((prev) => ({
      ...prev,
      footer: {
        ...prev.footer,
        columns: normalizeVisibleItems(
          fallbackColumns.map((column, index) => ({
            ...column,
            order_index: index + 1,
            is_active: true,
            deleted_at: null,
            updated_at: now(),
          }))
        ),
      },
    }))
  }, [content.footer.columns])

  const mutateContent = (updater: (previous: AdminContent) => AdminContent) => {
    setContent((previous) => updater(previous))
    setStatus("draft")
  }
  const deleteWithConfirm = (label: string, onConfirm: () => void) => {
    if (!window.confirm(`Tem certeza que deseja excluir ${label}?`)) return
    onConfirm()
  }
  const saveDraft = () => {
    saveDraftContent(content)
    void saveDraftContentRemote(content)
    setStatus("draft")
    setLastSavedAt(new Date().toLocaleTimeString())
  }
  const saveNow = () => {
    saveDraftContent(content)
    void saveDraftContentRemote(content)
    setStatus("draft")
    setLastSavedAt(new Date().toLocaleTimeString())
  }
  const publish = async () => {
    const remoteVersions = await loadVersionsRemote()
    const sourceVersions = [...versions, ...(remoteVersions ?? [])]
    const nextVersion =
      (sourceVersions.length ? Math.max(...sourceVersions.map((entry) => entry.version_number)) : 0) + 1
    const next: ContentVersion = {
      id: createId(),
      version_number: nextVersion,
      data_json: content,
      created_at: now(),
      created_by: session?.email ?? ADMIN_EMAIL,
      is_published: true,
    }
    const baseVersions = remoteVersions ?? versions
    const nextVersions = [...baseVersions, next]
    setVersions(nextVersions)
    saveVersions(nextVersions)
    await saveVersionRemote(next)
    saveDraftContent(content)
    void saveDraftContentRemote(content)
    setStatus("published")
  }
  const revertToVersion = (version: ContentVersion) => {
    setContent(version.data_json)
    saveDraftContent(version.data_json)
    void saveDraftContentRemote(version.data_json)
    setStatus(version.is_published ? "published" : "draft")
  }
  const revertPublished = () => {
    const latest = getLatestPublished(versions)
    if (latest) revertToVersion(latest)
  }

  const brands = useMemo(() => visibleItems(content.section05.brands), [content.section05.brands])
  const section05Rows = useMemo(
    () =>
      brands.map((brand) => ({
        brand,
        panel:
          visibleItems(content.section05.panels).find((entry) => entry.brand_id === brand.id) ?? null,
      })),
    [brands, content.section05.panels]
  )
  const voiceFilters = useMemo(() => visibleItems(content.section04.filters), [content.section04.filters])
  const talents = useMemo(() => visibleItems(content.section07.talents), [content.section07.talents])
  const regionFilterRef = useMemo(() => getVoiceFilterByKey(voiceFilters, "REGIAO") ?? null, [voiceFilters])
  const idiomaFilterRef = useMemo(() => getVoiceFilterByKey(voiceFilters, "IDIOMA") ?? null, [voiceFilters])
  const estiloFilterRef = useMemo(() => getVoiceFilterByKey(voiceFilters, "ESTILO") ?? null, [voiceFilters])

  const regionFilterOptions = useMemo(
    () => {
      if (!regionFilterRef) return []
      const leafs = flattenLeafTaxonomyPaths(regionFilterRef.items)
      const picked = leafs
        .map((path) => {
          if (path.length >= 2) return path[1]
          return path[0] ?? ""
        })
        .filter((value) => {
          const normalized = normalizeLookup(value)
          return Boolean(normalized) && normalized !== "MASCULINA" && normalized !== "FEMININA"
        })
      return Array.from(new Set(picked.map((value) => normalizeLookup(value)))).map((normalized) => {
        const found = picked.find((value) => normalizeLookup(value) === normalized)
        return found ?? normalized
      })
    },
    [regionFilterRef]
  )
  const idiomaFilterOptions = useMemo(
    () => {
      if (!idiomaFilterRef) return []
      const leafs = flattenLeafTaxonomyPaths(idiomaFilterRef.items)
      const picked = leafs
        .map((path) => {
          const first = path[0] ? normalizeLookup(path[0]) : ""
          if (first === "MASCULINA" || first === "FEMININA") return path[1] ?? ""
          return path[path.length - 1] ?? ""
        })
        .filter(Boolean)
      return Array.from(new Set(picked.map((value) => normalizeLookup(value)))).map((normalized) => {
        const found = picked.find((value) => normalizeLookup(value) === normalized)
        return found ?? normalized
      })
    },
    [idiomaFilterRef]
  )
  const estiloFilterOptions = useMemo(
    () => {
      if (!estiloFilterRef) return []
      const leafs = flattenLeafTaxonomyPaths(estiloFilterRef.items)
      const picked = leafs
        .map((path) => {
          const first = path[0] ? normalizeLookup(path[0]) : ""
          if (first === "MASCULINA" || first === "FEMININA") return path[1] ?? ""
          return path[path.length - 1] ?? ""
        })
        .filter(Boolean)
      return Array.from(new Set(picked.map((value) => normalizeLookup(value)))).map((normalized) => {
        const found = picked.find((value) => normalizeLookup(value) === normalized)
        return found ?? normalized
      })
    },
    [estiloFilterRef]
  )

  const matchesSelectedRegion = (groups: string[][] | undefined, selectedRegion: string) => {
    if (!selectedRegion) return true
    const selectedNorm = normalizeLookup(selectedRegion)
    return (groups ?? []).some((path) => path.some((part) => normalizeLookup(part) === selectedNorm))
  }

  const matchesSelectedTerm = (groups: string[][] | undefined, selected: string) => {
    if (!selected) return true
    const selectedNorm = normalizeLookup(selected)
    return (groups ?? []).some((path) => path.some((part) => normalizeLookup(part) === selectedNorm))
  }

  const detectTalentGenderFromAssignments = (assignments: VoiceAssignments, explicitGender?: string) => {
    const normalizedExplicit = normalizeGenderValue(explicitGender ?? "")
    if (normalizedExplicit) return normalizedExplicit
    const allParts = Object.values(assignments ?? {}).flat().flat().map((part) => normalizeLookup(part))
    if (allParts.includes("FEMININA") || allParts.includes("FEMININO") || allParts.includes("FEM")) return "FEMININA"
    if (allParts.includes("MASCULINA") || allParts.includes("MASCULINO") || allParts.includes("MAS")) return "MASCULINA"
    return ""
  }

  const filteredTalents = useMemo(() => {
    const searchNorm = normalizeLookup(talentSearch)
    return talents.filter((talent) => {
      const matchesRegion = matchesSelectedRegion(talent.assignments?.REGIAO, talentFilterRegiao)
      const matchesIdiomaTerm = matchesSelectedTerm(
        [...(talent.assignments?.IDIOMA ?? []), ...(talent.assignments?.IDIOMAS ?? [])],
        talentFilterIdioma
      )
      const matchesEstilo = matchesSelectedTerm(talent.assignments?.ESTILO, talentFilterEstilo)
      const talentGender = detectTalentGenderFromAssignments(talent.assignments ?? {}, talent.gender)
      const matchesGenero = !talentFilterGenero || talentGender === talentFilterGenero
      if (!matchesRegion || !matchesIdiomaTerm || !matchesEstilo || !matchesGenero) return false

      if (!searchNorm) return true
      const searchableText = normalizeLookup(
        `${talent.name} ${talent.audioName} ${talent.audioFile} ${Object.values(talent.assignments ?? {}).flat().flat().join(" ")}`
      )
      return searchableText.includes(searchNorm)
    })
  }, [talents, talentFilterRegiao, talentFilterIdioma, talentFilterEstilo, talentFilterGenero, talentSearch])

  const heroSlots = useMemo(() => {
    const variants = visibleItems(content.hero.variants).filter((entry) => entry.is_active)
    const positions: Array<-3 | -2 | -1 | 0 | 1 | 2 | 3> = [-3, -2, -1, 0, 1, 2, 3]
    return positions.map((pos) => ({
      pos,
      item: variants.find((entry) => entry.pos === pos) ?? null,
    }))
  }, [content.hero.variants])
  const activeHeroSlotIds = useMemo(
    () => new Set(heroSlots.map((slot) => slot.item?.id).filter((id): id is string => Boolean(id))),
    [heroSlots]
  )
  const historicalHeroItems = useMemo(
    () =>
      content.hero.variants
        .filter((entry) => !activeHeroSlotIds.has(entry.id))
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()),
    [content.hero.variants, activeHeroSlotIds]
  )
  const editingHeroItem =
    editingHeroPos === null
      ? null
      : visibleItems(content.hero.variants).find((entry) => entry.pos === editingHeroPos) ?? null

  const ensureHeroVariantByPos = (pos: -3 | -2 | -1 | 0 | 1 | 2 | 3) => {
    const found = visibleItems(content.hero.variants).find((entry) => entry.pos === pos)
    if (found) return found.id
    const newId = createId()
    mutateContent((prev) => ({
      ...prev,
      hero: {
        ...prev.hero,
        variants: normalizeVisibleItems([
          ...prev.hero.variants,
          {
            ...createBase(visibleItems(prev.hero.variants).length + 1),
            id: newId,
            pos,
            kicker: "",
            title: "",
            animatedPrefix: "",
            animatedWords: [],
            tagline: "",
            who: "",
            when: "",
            category: "",
            modalTitle: "",
            subtitle: "",
            videoSrc: "",
            poster: "",
            bgImage: "",
            mobileBgImage: "",
            topCtaLabel: "",
            topCtaHref: "",
          } as HeroVariantAdmin,
        ]),
      },
    }))
    return newId
  }

  const updateEditingHero = (patch: Partial<HeroVariantAdmin>) => {
    if (!editingHeroItem) return
    mutateContent((prev) => ({
      ...prev,
      hero: {
        ...prev.hero,
        variants: patchItem(prev.hero.variants, editingHeroItem.id, patch),
      },
    }))
  }

  const openSectionMeta = (key: "section02" | "section04" | "section05" | "section06" | "section07") => {
    if (key === "section02") {
      setSectionMetaDraft({ title: content.section02.title, text: content.section02.text })
    }
    if (key === "section04") {
      setSectionMetaDraft({ title: content.section04.title, text: content.section04.text })
    }
    if (key === "section05") {
      setSectionMetaDraft({ title: content.section05.title, text: content.section05.text })
    }
    if (key === "section06") {
      setSectionMetaDraft({ title: content.section06.title, text: content.section06.text })
    }
    if (key === "section07") {
      setSectionMetaDraft({ title: content.section07.title, text: content.section07.text })
    }
    setSectionMetaModal(key)
  }

  const saveSectionMeta = () => {
    if (!sectionMetaModal) return
    mutateContent((prev) => {
      if (sectionMetaModal === "section02") {
        return { ...prev, section02: { ...prev.section02, title: sectionMetaDraft.title, text: sectionMetaDraft.text } }
      }
      if (sectionMetaModal === "section04") {
        return { ...prev, section04: { ...prev.section04, title: sectionMetaDraft.title, text: sectionMetaDraft.text } }
      }
      if (sectionMetaModal === "section05") {
        return { ...prev, section05: { ...prev.section05, title: sectionMetaDraft.title, text: sectionMetaDraft.text } }
      }
      if (sectionMetaModal === "section07") {
        return { ...prev, section07: { ...prev.section07, title: sectionMetaDraft.title, text: sectionMetaDraft.text } }
      }
      return { ...prev, section06: { ...prev.section06, title: sectionMetaDraft.title, text: sectionMetaDraft.text } }
    })
    setSectionMetaModal(null)
  }

  const openSection02CardModal = (id: string) => {
    const card = visibleItems(content.section02.cards).find((entry) => entry.id === id)
    if (!card) return
    setSection02CardDraft({ title: card.title, text: card.text, hoverText: card.hoverText ?? "", icon: card.icon ?? "" })
    setSection02CardModalId(id)
  }

  const saveSection02CardModal = () => {
    if (!section02CardModalId) return
    mutateContent((prev) => ({
      ...prev,
      section02: {
        ...prev.section02,
        cards: patchItem(prev.section02.cards, section02CardModalId, {
          title: section02CardDraft.title,
          text: section02CardDraft.text,
          hoverText: section02CardDraft.hoverText,
          icon: section02CardDraft.icon,
        }),
      },
    }))
    setSection02CardModalId(null)
  }

  const openSection05BrandModal = (brandId: string) => {
    const brand = visibleItems(content.section05.brands).find((entry) => entry.id === brandId)
    if (!brand) return
    const panel = visibleItems(content.section05.panels).find((entry) => entry.brand_id === brandId)
    setSection05Draft({
      name: brand.name,
      logo: brand.logo,
      secondaryLogo: brand.secondaryLogo ?? brand.logo,
      logoScale: normalizeLogoScale(brand.logoScale ?? 1),
      secondaryLogoScale: normalizeLogoScale(brand.secondaryLogoScale ?? brand.logoScale ?? 1),
      title: panel?.title ?? "",
      description: panel?.description ?? "",
      voiceType: panel?.voiceType ?? "",
      companyText: panel?.companyText ?? panel?.description ?? "",
      videoSrc: panel?.videoSrc ?? "",
    })
    setSection05ModalBrandId(brandId)
  }

  const openNewSection05BrandModal = () => {
    setSection05Draft({
      name: "",
      logo: "",
      secondaryLogo: "",
      logoScale: 1,
      secondaryLogoScale: 1,
      title: "",
      description: "",
      voiceType: "",
      companyText: "",
      videoSrc: "",
    })
    setSection05ModalBrandId("new")
  }

  const saveSection05BrandModal = () => {
    if (!section05ModalBrandId) return
    mutateContent((prev) => {
      const isCreating = section05ModalBrandId === "new"
      const targetBrandId = isCreating ? createId() : section05ModalBrandId

      const nextBrands = patchItem(prev.section05.brands, section05ModalBrandId, {
        name: section05Draft.name,
        logo: section05Draft.logo,
        secondaryLogo: section05Draft.secondaryLogo || section05Draft.logo,
        logoScale: normalizeLogoScale(section05Draft.logoScale),
        secondaryLogoScale: normalizeLogoScale(section05Draft.secondaryLogoScale),
      })

      const brandsWithCreate = isCreating
        ? normalizeVisibleItems([
            ...prev.section05.brands,
            {
              ...createBase(visibleItems(prev.section05.brands).length + 1),
              id: targetBrandId,
              name: section05Draft.name,
              logo: section05Draft.logo,
              secondaryLogo: section05Draft.secondaryLogo || section05Draft.logo,
              logoScale: normalizeLogoScale(section05Draft.logoScale),
              secondaryLogoScale: normalizeLogoScale(section05Draft.secondaryLogoScale),
            },
          ])
        : nextBrands

      const existingPanel = visibleItems(prev.section05.panels).find(
        (entry) => entry.brand_id === targetBrandId
      )
      const nextPanels = existingPanel
        ? patchItem(prev.section05.panels, existingPanel.id, {
            title: section05Draft.title,
            description: section05Draft.description,
            voiceType: section05Draft.voiceType,
            companyText: section05Draft.companyText,
            videoSrc: normalizeVideoUrl(section05Draft.videoSrc),
          })
        : normalizeVisibleItems([
            ...prev.section05.panels,
            {
              ...createBase(visibleItems(prev.section05.panels).length + 1),
              brand_id: targetBrandId,
              title: section05Draft.title,
              description: section05Draft.description,
              voiceType: section05Draft.voiceType,
              companyText: section05Draft.companyText,
              videoSrc: normalizeVideoUrl(section05Draft.videoSrc),
            },
          ])

      return {
        ...prev,
        section05: {
          ...prev.section05,
          brands: brandsWithCreate as typeof prev.section05.brands,
          panels: nextPanels as typeof prev.section05.panels,
        },
      }
    })
    setSection05ModalBrandId(null)
  }

  const openSection07TalentModal = (talentId: string | "new") => {
    if (talentId === "new") {
      setSection07Draft({
        name: "",
        audioFile: "",
        audioName: "",
        assignments: {},
      })
      setSection07FilterDraft({ genero: "", regiao: "", idioma: "", estilo: "" })
      setSection07ModalId("new")
      return
    }
    const talent = visibleItems(content.section07.talents).find((entry) => entry.id === talentId)
    if (!talent) return
    setSection07Draft({
      name: talent.name,
      audioFile: talent.audioFile,
      audioName: talent.audioName,
      assignments: talent.assignments,
    })
    const extracted = extractSequentialFiltersFromAssignments(talent.assignments)
    setSection07FilterDraft({ ...extracted, genero: normalizeGenderValue(talent.gender ?? extracted.genero) })
    setSection07ModalId(talentId)
  }

  const openSection07BulkModal = () => {
    setSection07BulkDraft({
      assignments: {},
      files: [],
      sourceKey: "REGIAO",
      manual: { genero: "", regiao: "", idioma: "", estilo: "" },
    })
    setSection07BulkModalOpen(true)
  }

  const ensureIdiomaOptionsInFilters = (filters: VoiceFilterAdmin[], rawOptions: string[]) => {
    const options = Array.from(
      new Set(
        rawOptions
          .map((option) => option.trim())
          .filter(Boolean)
          .map((option) => normalizeLookup(option))
          .filter(Boolean)
      )
    )
    if (!options.length) return filters
    const displayByKey = new Map(
      rawOptions
        .map((option) => option.trim())
        .filter(Boolean)
        .map((option) => [normalizeLookup(option), option] as const)
    )

    return filters.map((filter) => {
      const filterKey = normalizeFilterKey(filter.name)
      if (filterKey !== "IDIOMA" && filterKey !== "IDIOMAS") return filter

      const nextItems = [...(filter.items ?? [])]
      const ensureGenderNode = (gender: "MASCULINA" | "FEMININA", orderIndex: number) => {
        let node = nextItems.find((item) => normalizeLookup(item.name) === gender)
        if (!node) {
          node = { ...(createBase(orderIndex) as TaxonomyNode), name: gender, children: [] }
          nextItems.push(node)
        }
        const children = [...(node.children ?? [])]
        for (const optionKey of options) {
          const hasOption = children.some((child) => normalizeLookup(child.name) === optionKey)
          if (!hasOption) {
            children.push({
              ...(createBase(children.length + 1) as TaxonomyNode),
              name: displayByKey.get(optionKey) ?? optionKey,
              children: [],
            })
          }
        }
        node.children = children.map((child, index) => ({ ...child, order_index: index + 1 }))
      }

      ensureGenderNode("MASCULINA", 1)
      ensureGenderNode("FEMININA", 2)

      return {
        ...filter,
        items: nextItems.map((item, index) => ({ ...item, order_index: index + 1 })),
        updated_at: now(),
      }
    })
  }

  const saveSection07BulkModal = () => {
    if (section07BulkDraft.files.length === 0) {
      window.alert("Selecione pelo menos um Ã¡udio.")
      return
    }
    setContent((previous) => {
      const nextIndex = visibleItems(previous.section07.talents).length
      const createdTalents: VoiceTalentAdmin[] = section07BulkDraft.files.map((file, index) => {
        const relativePath =
          ((file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name).replace(/\\/g, "/")
        const baseAssignments = Object.fromEntries(
          Object.entries(section07BulkDraft.assignments).map(([key, groups]) => [key, (groups ?? []).map((path) => [...path])])
        ) as VoiceAssignments
        const manualAssignments = resolveBulkAssignments(
          file.name,
          relativePath,
          voiceFilters,
          baseAssignments,
          section07BulkDraft.manual,
          section07BulkDraft.sourceKey
        )
        const extracted = extractSequentialFiltersFromAssignments(manualAssignments)
        return {
          ...(createBase(nextIndex + index + 1) as VoiceTalentAdmin),
          name: firstNameOnly(inferTalentNameFromFileName(file.name, relativePath)),
          audioFile: buildBulkAudioAssetPath(section07BulkDraft.sourceKey, relativePath),
          audioName: file.name.replace(/\.[^/.]+$/, ""),
          gender: normalizeGenderValue(section07BulkDraft.manual.genero || extracted.genero),
          assignments: manualAssignments,
        }
      })
      const idiomaTerms = [
        ...createdTalents
          .flatMap((talent) => [...(talent.assignments?.IDIOMAS ?? []), ...(talent.assignments?.IDIOMA ?? [])])
          .map((path) => extractPrimaryTerm(path))
          .filter(Boolean),
        ...section07BulkDraft.files
          .map((file) => {
            const relativePath =
              ((file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name).replace(/\\/g, "/")
            return inferIdiomaFromUploadText(relativePath, file.name, section07BulkDraft.sourceKey)
          })
          .filter(Boolean),
      ]
      const nextFilters = ensureIdiomaOptionsInFilters(previous.section04.filters, idiomaTerms)
      const next = {
        ...previous,
        section04: {
          ...previous.section04,
          filters: nextFilters,
        },
        section07: {
          ...previous.section07,
          talents: normalizeVisibleItems([...previous.section07.talents, ...createdTalents]),
        },
      }
      saveDraftContent(next)
      void saveDraftContentRemote(next)
      return next
    })
    setStatus("draft")
    setLastSavedAt(new Date().toLocaleTimeString())
    setSection07BulkModalOpen(false)
  }

  const saveSection07TalentModal = () => {
    if (!section07ModalId) return
    const resolvedAssignments = buildAssignmentsFromSequentialFilters(section07Draft.assignments, section07FilterDraft)
    const resolvedGender = normalizeGenderValue(section07FilterDraft.genero)
    const idiomaTerms = [...(resolvedAssignments.IDIOMAS ?? []), ...(resolvedAssignments.IDIOMA ?? [])]
      .map((path) => extractPrimaryTerm(path))
      .filter(Boolean)
    setContent((prev) => {
      const nextFilters = ensureIdiomaOptionsInFilters(prev.section04.filters, idiomaTerms)
      const next =
        section07ModalId === "new"
          ? (() => {
              const created: VoiceTalentAdmin = {
                ...(createBase(visibleItems(prev.section07.talents).length + 1) as VoiceTalentAdmin),
                name: firstNameOnly(section07Draft.name),
                audioFile: section07Draft.audioFile,
                audioName:
                  section07Draft.audioName ||
                  (section07Draft.audioFile
                    ? section07Draft.audioFile.split("/").pop()?.replace(/\.[^/.]+$/, "") ?? ""
                    : section07Draft.name),
                gender: resolvedGender,
                assignments: resolvedAssignments,
              }
              return {
                ...prev,
                section04: {
                  ...prev.section04,
                  filters: nextFilters,
                },
                section07: {
                  ...prev.section07,
                  talents: normalizeVisibleItems([...prev.section07.talents, created]),
                },
              }
            })()
          : {
              ...prev,
              section04: {
                ...prev.section04,
                filters: nextFilters,
              },
              section07: {
                ...prev.section07,
                talents: patchItem(prev.section07.talents, section07ModalId, {
                  name: firstNameOnly(section07Draft.name),
                  audioFile: section07Draft.audioFile,
                  audioName:
                    section07Draft.audioName ||
                    (section07Draft.audioFile
                      ? section07Draft.audioFile.split("/").pop()?.replace(/\.[^/.]+$/, "") ?? ""
                      : section07Draft.name),
                  gender: resolvedGender,
                  assignments: resolvedAssignments,
                }),
              },
            }
      saveDraftContent(next)
      void saveDraftContentRemote(next)
      return next
    })
    setStatus("draft")
    setLastSavedAt(new Date().toLocaleTimeString())
    setSection07ModalId(null)
  }

  const openFooterMetaModal = () => {
    setFooterMetaDraft({
      copyrightText: content.footer.copyrightText,
      city: content.footer.city,
      developerCredit: content.footer.developerCredit,
    })
    setFooterMetaModalOpen(true)
  }

  const saveFooterMetaModal = () => {
    mutateContent((prev) => ({
      ...prev,
      footer: {
        ...prev.footer,
        copyrightText: footerMetaDraft.copyrightText,
        city: footerMetaDraft.city,
        developerCredit: footerMetaDraft.developerCredit,
      },
    }))
    setFooterMetaModalOpen(false)
  }

  const reuseHistoricalHero = (itemId: string) => {
    mutateContent((prev) => {
      const source = prev.hero.variants.find((entry) => entry.id === itemId)
      if (!source) return prev

      const currentAtPos = prev.hero.variants.find(
        (entry) =>
          entry.id !== source.id &&
          entry.pos === source.pos &&
          !entry.deleted_at &&
          entry.is_active
      )

      const next = prev.hero.variants.map((entry) => {
        if (currentAtPos && entry.id === currentAtPos.id) {
          return {
            ...entry,
            is_active: false,
            deleted_at: now(),
            updated_at: now(),
          }
        }
        if (entry.id === source.id) {
          return {
            ...entry,
            is_active: true,
            deleted_at: null,
            updated_at: now(),
          }
        }
        return entry
      })

      return {
        ...prev,
        hero: {
          ...prev.hero,
          variants: next,
        },
      }
    })
  }

  const repositionHeroSlot = (fromPos: -3 | -2 | -1 | 1 | 2 | 3, toPos: -3 | -2 | -1 | 1 | 2 | 3) => {
    if (fromPos === toPos) return
    mutateContent((prev) => {
      const variants = visibleItems(prev.hero.variants)
      const source = variants.find((entry) => entry.pos === fromPos)
      if (!source) return prev
      const target = variants.find((entry) => entry.pos === toPos)
      let nextVariants = patchItem(prev.hero.variants, source.id, {
        pos: toPos,
      } as Partial<HeroVariantAdmin>)
      if (target) {
        nextVariants = patchItem(nextVariants, target.id, {
          pos: fromPos,
        } as Partial<HeroVariantAdmin>)
      }
      return {
        ...prev,
        hero: {
          ...prev.hero,
          variants: nextVariants,
        },
      }
    })
  }

  const createHeroFromDraft = () => {
    const pos = heroCreateType === "central" ? 0 : heroCreatePos
    mutateContent((prev) => {
      const currentAtPos = prev.hero.variants.find(
        (entry) => entry.pos === pos && !entry.deleted_at && entry.is_active
      )
      const withoutCurrent = prev.hero.variants.map((entry) => {
        if (!currentAtPos || entry.id !== currentAtPos.id) return entry
        return {
          ...entry,
          is_active: false,
          deleted_at: now(),
          updated_at: now(),
        }
      })
      const created: HeroVariantAdmin = {
        ...(createBase(visibleItems(prev.hero.variants).length + 1) as HeroVariantAdmin),
        pos,
        kicker: "",
        title: heroCreateDraft.title,
        animatedPrefix: "",
        animatedWords: [],
        tagline: heroCreateDraft.tagline,
        who: heroCreateDraft.who,
        when: "",
        category: "",
        modalTitle: heroCreateDraft.title,
        subtitle: "",
        videoSrc: heroCreateDraft.videoSrc,
        poster: "",
        bgImage: heroCreateDraft.bgImage,
        mobileBgImage: "",
        topCtaLabel: "",
        topCtaHref: "",
      }
      return {
        ...prev,
        hero: {
          ...prev.hero,
          variants: normalizeVisibleItems([...withoutCurrent, created]),
        },
      }
    })
    setHeroCreateDraft({ who: "", title: "", tagline: "", videoSrc: "", bgImage: "" })
    setHeroCreateType("slide")
    setHeroCreatePos(-3)
    setHeroCreateOpen(false)
  }

  const deleteHeroPermanently = (id: string) => {
    if (!window.confirm("Este quadro serÃ¡ excluÃ­do definitivamente. Deseja continuar?")) return
    mutateContent((prev) => ({
      ...prev,
      hero: {
        ...prev.hero,
        variants: prev.hero.variants.filter((entry) => entry.id !== id),
      },
    }))
    if (editingHeroItem?.id === id) setEditingHeroPos(null)
  }

  if (!session) return <LoginView onLogin={setSession} />

  return (
    <div className="min-h-screen bg-[#f3f4fb] text-black">
      <header className="sticky top-0 z-30 border-b border-black/10 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 md:px-6">
          <div className="flex items-center gap-4">
            <strong className="font-secular text-lg uppercase tracking-wide">Edit Group Admin</strong>
            <span className={`rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.14em] ${status === "published" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>{status === "published" ? "Publicado" : "Rascunho"}</span>
            {lastSavedAt ? (
              <span className="text-[11px] uppercase tracking-[0.12em] text-black/55">Salvo Ã s {lastSavedAt}</span>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={saveDraft}>Salvar Rascunho</Button>
            <Button className="bg-black text-white" onClick={publish}>Publicar</Button>
            <Button onClick={revertPublished}>Reverter</Button>
            <Button onClick={() => setShowHistory((value) => !value)}>HistÃ³rico</Button>
            <Button className="border-red-400 text-red-700" onClick={() => { clearAdminSession(); setSession(null) }}>Logout</Button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr]">
        <aside className="border-r border-black/10 bg-white p-3 md:min-h-[calc(100vh-68px)]">
          <nav className="space-y-1">
            {sidebarSections.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => {
                  if (entry.id === "section07bulk") {
                    setActiveSection("section07bulk")
                    openSection07BulkModal()
                    return
                  }
                  setActiveSection(entry.id)
                }}
                className={`w-full px-3 py-2 text-left text-sm uppercase tracking-[0.13em] transition-colors duration-200 ${activeSection === entry.id ? "bg-black text-white hover:bg-black/90" : "hover:bg-black/5"}`}
              >
                {entry.label}
              </button>
            ))}
          </nav>
        </aside>
        <main className="p-4 md:p-6 space-y-4">
          {activeSection === "hero" ? (
            <section className="space-y-4 border border-black/10 bg-white/60 p-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-secular text-xl uppercase">Hero</h2>
                <div className="flex items-center gap-2">
                  <Button onClick={() => setHeroCreateOpen(true)}>Novo Quadro</Button>
                  <Button onClick={saveNow}>Salvar Hero</Button>
                  <Button
                    className={heroDeleteMode ? "border-red-500 bg-red-50 text-red-700" : "border-red-400 text-red-700"}
                    onClick={() => setHeroDeleteMode((prev) => !prev)}
                  >
                    {heroDeleteMode ? "Cancelar ExclusÃ£o" : "Excluir Quadros"}
                  </Button>
                </div>
              </div>
              <p className="text-sm text-black/70">Clique em uma caixa para editar. Arraste as caixas de clientes para reposicionar rapidamente. A caixa central (posiÃ§Ã£o 0) representa o vÃ­deo central e Ã© fixa.</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
                {heroSlots.map((slot) => {
                  const label =
                    slot.pos === 0
                      ? "VIDEO CENTRAL"
                      : slot.item?.who?.trim() || slot.item?.title?.trim() || `CLIENTE ${slot.pos}`
                  const isClientSlot = slot.pos !== 0
                  const clientPos = isClientSlot ? (slot.pos as -3 | -2 | -1 | 1 | 2 | 3) : null
                  return (
                    <div key={`hero-slot-${slot.pos}`} className="relative">
                      <button
                        type="button"
                        draggable={isClientSlot && !heroDeleteMode}
                        onDragStart={() => {
                          if (!clientPos || heroDeleteMode) return
                          setHeroDragPos(clientPos)
                        }}
                        onDragOver={(event) => {
                          if (!isClientSlot || heroDragPos === null || heroDeleteMode) return
                          event.preventDefault()
                        }}
                        onDragEnd={() => setHeroDragPos(null)}
                        onDrop={(event) => {
                          if (!clientPos || heroDragPos === null || heroDeleteMode) return
                          event.preventDefault()
                          repositionHeroSlot(heroDragPos, clientPos)
                          setHeroDragPos(null)
                        }}
                        onClick={() => {
                          if (heroDeleteMode || heroDragPos !== null) return
                          ensureHeroVariantByPos(slot.pos)
                          setEditingHeroPos(slot.pos)
                        }}
                        className={`min-h-[96px] w-full border px-3 py-3 text-left transition-colors duration-200 ${
                          slot.pos === 0 ? "border-black bg-black text-white hover:bg-black/90" : "border-black/20 bg-white hover:bg-black/5"
                        }`}
                      >
                        <div className="text-[10px] uppercase tracking-[0.16em] opacity-70">posiÃ§Ã£o {slot.pos}</div>
                        <div className="mt-2 text-sm font-semibold leading-tight">{label}</div>
                        <div className="mt-2 text-[11px] opacity-70">{slot.item?.is_active === false ? "Off" : "Ativo"}</div>
                      </button>
                      {heroDeleteMode && slot.item ? (
                        <button
                          type="button"
                          onClick={() => deleteHeroPermanently(slot.item!.id)}
                          className="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center border border-red-500 bg-white text-xs font-semibold text-red-700 transition-colors duration-200 hover:bg-red-50"
                          aria-label={`Excluir quadro da posiÃ§Ã£o ${slot.pos}`}
                        >
                          X
                        </button>
                      ) : null}
                    </div>
                  )
                })}
              </div>

              <div className="space-y-2">
                <h3 className="font-secular text-base uppercase">HistÃ³rico do Hero</h3>
                <p className="text-sm text-black/65">
                  Itens fora do grid atual. VocÃª pode reaproveitar no slot de origem (inclui vÃ­deo central e slides).
                </p>
                {historicalHeroItems.length === 0 ? (
                  <div className="border border-dashed border-black/20 bg-white px-3 py-4 text-sm text-black/60">
                    Nenhum item no histÃ³rico.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {historicalHeroItems.map((item) => (
                      <div key={`hero-history-${item.id}`} className="border border-black/20 bg-white p-3">
                        <div className="text-[10px] uppercase tracking-[0.16em] text-black/60">
                          {item.pos === 0 ? "VÃDEO CENTRAL" : `SLIDE POSIÃ‡ÃƒO ${item.pos}`}
                        </div>
                        <div className="mt-1 text-sm font-semibold text-black">
                          {item.who?.trim() || item.title?.trim() || "Sem tÃ­tulo"}
                        </div>
                        <div className="mt-1 text-[11px] text-black/60">
                          {item.deleted_at ? "ExcluÃ­do (histÃ³rico)" : item.is_active ? "Ativo fora do grid" : "Off"}
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <Button onClick={() => reuseHistoricalHero(item.id)}>Reaproveitar</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {heroCreateOpen ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
                  <div className="w-full max-w-2xl border border-black/20 bg-white p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <h3 className="font-secular text-lg uppercase">Novo Quadro do Hero</h3>
                      <button
                        type="button"
                        onClick={() => setHeroCreateOpen(false)}
                        className="border border-black/20 px-2 py-1 text-xs uppercase transition-colors duration-200 hover:bg-black/5"
                      >
                        Fechar
                      </button>
                    </div>
                    <div className="mt-4 grid gap-3">
                      <label className="text-xs uppercase tracking-[0.14em]">
                        Tipo de Quadro
                        <select
                          className="mt-1 w-full border border-black/20 px-2 py-2 text-sm"
                          value={heroCreateType}
                          onChange={(event) => setHeroCreateType(event.target.value as "central" | "slide")}
                        >
                          <option value="slide">Slide de Cliente</option>
                          <option value="central">ConteÃºdo Central</option>
                        </select>
                      </label>
                      {heroCreateType === "slide" ? (
                        <label className="text-xs uppercase tracking-[0.14em]">
                          PosiÃ§Ã£o do Slide
                          <select
                            className="mt-1 w-full border border-black/20 px-2 py-2 text-sm"
                            value={heroCreatePos}
                            onChange={(event) => setHeroCreatePos(Number(event.target.value) as -3 | -2 | -1 | 1 | 2 | 3)}
                          >
                            {[-3, -2, -1, 1, 2, 3].map((pos) => (
                              <option key={`new-hero-pos-${pos}`} value={pos}>
                                posiÃ§Ã£o {pos}
                              </option>
                            ))}
                          </select>
                        </label>
                      ) : null}
                      <label className="text-xs uppercase tracking-[0.14em]">
                        Nome do Cliente
                        <input
                          className="mt-1 w-full border border-black/20 px-2 py-2 text-sm"
                          value={heroCreateDraft.who}
                          onChange={(event) => setHeroCreateDraft((prev) => ({ ...prev, who: event.target.value }))}
                        />
                      </label>
                      <label className="text-xs uppercase tracking-[0.14em]">
                        TÃ­tulo Principal
                        <input
                          className="mt-1 w-full border border-black/20 px-2 py-2 text-sm"
                          value={heroCreateDraft.title}
                          onChange={(event) => setHeroCreateDraft((prev) => ({ ...prev, title: event.target.value }))}
                        />
                      </label>
                      <label className="text-xs uppercase tracking-[0.14em]">
                        Texto de Apoio
                        <textarea
                          className="mt-1 min-h-20 w-full border border-black/20 px-2 py-2 text-sm"
                          value={heroCreateDraft.tagline}
                          onChange={(event) => setHeroCreateDraft((prev) => ({ ...prev, tagline: event.target.value }))}
                        />
                      </label>
                      <label className="text-xs uppercase tracking-[0.14em]">
                        URL do VÃ­deo
                        <AssetAutocompleteInput
                          value={heroCreateDraft.videoSrc}
                          options={ASSET_OPTIONS.videos}
                          onChange={(value) => setHeroCreateDraft((prev) => ({ ...prev, videoSrc: value }))}
                          displayFileName={false}
                        />
                      </label>
                      <label className="text-xs uppercase tracking-[0.14em]">
                        Subir Imagem (desktop)
                        <input
                          type="file"
                          accept="image/*"
                          className="mt-1 w-full border border-black/20 px-2 py-2 text-sm"
                          onChange={(event) => {
                            const file = event.target.files?.[0]
                            if (!file) return
                            const reader = new FileReader()
                            reader.onload = () => {
                              const result = typeof reader.result === "string" ? reader.result : ""
                              if (!result) return
                              setHeroCreateDraft((prev) => ({ ...prev, bgImage: result }))
                            }
                            reader.readAsDataURL(file)
                          }}
                        />
                      </label>
                      <label className="text-xs uppercase tracking-[0.14em]">
                        URL da Imagem (desktop)
                        <AssetAutocompleteInput
                          value={heroCreateDraft.bgImage}
                          options={ASSET_OPTIONS.images}
                          onChange={(value) => setHeroCreateDraft((prev) => ({ ...prev, bgImage: value }))}
                        />
                      </label>
                      <div className="flex items-center gap-2">
                        <Button className="bg-black text-white" onClick={createHeroFromDraft}>
                          Criar Quadro
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {editingHeroPos !== null && editingHeroItem ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
                  <div className="w-full max-w-2xl border border-black/20 bg-white p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <h3 className="font-secular text-lg uppercase">
                        Editar Hero {editingHeroPos === 0 ? "(VÃ­deo Central)" : `(Cliente ${editingHeroPos})`}
                      </h3>
                      <button type="button" onClick={() => setEditingHeroPos(null)} className="border border-black/20 px-2 py-1 text-xs uppercase transition-colors duration-200 hover:bg-black/5">Fechar</button>
                    </div>
                    <div className="mt-4 grid gap-3">
                      <label className="text-xs uppercase tracking-[0.14em]">
                        Nome do cliente
                        <input
                          className="mt-1 w-full border border-black/20 px-2 py-2 text-sm"
                          value={editingHeroItem.who}
                          onChange={(event) => updateEditingHero({ who: event.target.value })}
                        />
                      </label>
                      <label className="text-xs uppercase tracking-[0.14em]">
                        TÃ­tulo principal
                        <input
                          className="mt-1 w-full border border-black/20 px-2 py-2 text-sm"
                          value={editingHeroItem.title}
                          onChange={(event) => updateEditingHero({ title: event.target.value })}
                        />
                      </label>
                      <label className="text-xs uppercase tracking-[0.14em]">
                        Texto de apoio
                        <textarea
                          className="mt-1 min-h-20 w-full border border-black/20 px-2 py-2 text-sm"
                          value={editingHeroItem.tagline}
                          onChange={(event) => updateEditingHero({ tagline: event.target.value })}
                        />
                      </label>
                      {editingHeroPos === 0 ? (
                        <label className="text-xs uppercase tracking-[0.14em]">
                          Palavras que trocam (separadas por vÃ­rgula)
                          <input
                            className="mt-1 w-full border border-black/20 px-2 py-2 text-sm"
                            value={editingHeroItem.animatedWords.join(", ")}
                            onChange={(event) =>
                              updateEditingHero({
                                animatedWords: event.target.value
                                  .split(",")
                                  .map((word) => word.trim())
                                  .filter(Boolean),
                              })
                            }
                            placeholder="MARCA, IMPACTA, INSPIRA..."
                          />
                        </label>
                      ) : null}
                      <label className="text-xs uppercase tracking-[0.14em]">
                        URL do vÃ­deo
                        <AssetAutocompleteInput
                          value={editingHeroItem.videoSrc}
                          options={ASSET_OPTIONS.videos}
                          onChange={(value) => updateEditingHero({ videoSrc: value })}
                          displayFileName={false}
                        />
                      </label>
                      <label className="text-xs uppercase tracking-[0.14em]">
                        Subir imagem (desktop)
                        <input
                          type="file"
                          accept="image/*"
                          className="mt-1 w-full border border-black/20 px-2 py-2 text-sm"
                          onChange={(event) => {
                            const file = event.target.files?.[0]
                            if (!file) return
                            const reader = new FileReader()
                            reader.onload = () => {
                              const result = typeof reader.result === "string" ? reader.result : ""
                              if (result) updateEditingHero({ bgImage: result })
                            }
                            reader.readAsDataURL(file)
                          }}
                        />
                      </label>
                      <label className="text-xs uppercase tracking-[0.14em]">
                        URL da imagem (desktop)
                        <AssetAutocompleteInput
                          value={editingHeroItem.bgImage}
                          options={ASSET_OPTIONS.images}
                          onChange={(value) => updateEditingHero({ bgImage: value })}
                        />
                      </label>
                      <div className="flex items-center gap-2">
                        <Button onClick={saveNow}>Salvar</Button>
                        <Button onClick={() => updateEditingHero({ is_active: !editingHeroItem.is_active })}>
                          {editingHeroItem.is_active ? "Ativo" : "Off"}
                        </Button>
                        <Button
                          className="border-red-400 text-red-700"
                          onClick={() =>
                            deleteWithConfirm("esta variaÃ§Ã£o do hero", () =>
                              mutateContent((prev) => ({
                                ...prev,
                                hero: { ...prev.hero, variants: markDeleted(prev.hero.variants, editingHeroItem.id) },
                              }))
                            )
                          }
                        >
                          Excluir
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </section>
          ) : null}

          {activeSection === "section02" ? (
            <section className="space-y-3 border border-black/10 bg-white/60 p-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-secular text-xl uppercase">SeÃ§Ã£o EstÃºdio</h2>
                <div className="flex gap-2">
                  <Button onClick={() => openSectionMeta("section02")}>Editar SeÃ§Ã£o</Button>
                </div>
              </div>
              <p className="text-sm text-black/70">VisÃ£o em quadros. Clique em editar para atualizar via modal.</p>
              <section className="space-y-2">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {visibleItems(content.section02.cards).slice(0, 3).map((card) => (
                    <div key={card.id} className="w-full border border-black/15 bg-white p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-[10px] uppercase tracking-[0.16em] text-black/60">{card.title}</div>
                        {card.icon ? <img src={card.icon} alt="" className="h-4 w-4 object-contain" /> : null}
                      </div>
                      <p className="text-sm text-black/85 line-clamp-3">{card.text}</p>
                      <p className="text-[12px] text-black/60 line-clamp-2">{card.hoverText ?? "Sem texto de hover"}</p>
                      <div className="flex items-center justify-end gap-2">
                        <Button onClick={() => openSection02CardModal(card.id)}>Editar</Button>
                      </div>
                    </div>
                  ))}
                </div>              </section>
            </section>
          ) : null}

          {activeSection === "section03"
            ? <SectionEditor
                title="SeÃ§Ã£o ProduÃ§Ã£o"
                text={content.section03.text}
                heading={content.section03.title}
                onHeading={(value) => mutateContent((prev) => ({ ...prev, section03: { ...prev.section03, title: value } }))}
                onText={(value) => mutateContent((prev) => ({ ...prev, section03: { ...prev.section03, text: value } }))}
                items={content.section03.steps}
                onItems={(items) => mutateContent((prev) => ({ ...prev, section03: { ...prev.section03, steps: items as typeof prev.section03.steps } }))}
                template={{ name: "Nova etapa", text: "", media: "" }}
                fields={["name", "text", "media"]}
                deleteWithConfirm={deleteWithConfirm}
                onSave={saveNow}
                allowCreate={false}
                showToggleDelete={false}
                fitContent
                hideSaveButtons
                fitContentClass="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3"
              />
            : null}

          {activeSection === "section04" ? (
            <section className="space-y-3 border border-black/10 bg-white/60 p-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-secular text-xl uppercase">SeÃ§Ã£o Vozes</h2>
                <div className="flex gap-2">
                  <Button onClick={() => openSectionMeta("section04")}>Editar SeÃ§Ã£o</Button>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="border border-black/15 bg-white p-3">
                  <div className="text-[10px] uppercase tracking-[0.16em] text-black/60">TÃ­tulo</div>
                  <div className="mt-1 text-sm text-black/90">{content.section04.title}</div>
                </div>
                <div className="border border-black/15 bg-white p-3">
                  <div className="text-[10px] uppercase tracking-[0.16em] text-black/60">Texto</div>
                  <div className="mt-1 text-sm text-black/80 line-clamp-3">{content.section04.text}</div>
                </div>
              </div>
              <SectionEditor
                title="Filtros e Taxonomia"
                text=""
                heading=""
                onHeading={() => {}}
                onText={() => {}}
                items={content.section04.filters}
                onItems={(items) => mutateContent((prev) => ({ ...prev, section04: { ...prev.section04, filters: items as typeof prev.section04.filters } }))}
                template={{ name: "NOVO FILTRO", subtitle: "", hint: "", items: [] as TaxonomyNode[] }}
                fields={["name", "subtitle", "hint"]}
                deleteWithConfirm={deleteWithConfirm}
                onSave={saveNow}
                extraField={(item, onPatch) => (
                  <TaxonomyField
                    value={(item as { items: TaxonomyNode[] }).items}
                    onChange={(value) => onPatch({ items: value })}
                  />
                )}
                fitContent
                fitContentClass="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3"
              />
            </section>
          ) : null}

          {activeSection === "section05" ? (
            <section className="space-y-3 border border-black/10 bg-white/60 p-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-secular text-xl uppercase">SeÃ§Ã£o Clientes</h2>
                <div className="flex gap-2">
                  <Button onClick={() => openSectionMeta("section05")}>Editar SeÃ§Ã£o</Button>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="border border-black/15 bg-white p-3">
                  <div className="text-[10px] uppercase tracking-[0.16em] text-black/60">TÃ­tulo</div>
                  <div className="mt-1 text-sm text-black/90">{content.section05.title}</div>
                </div>
                <div className="border border-black/15 bg-white p-3">
                  <div className="text-[10px] uppercase tracking-[0.16em] text-black/60">Texto</div>
                  <div className="mt-1 text-sm text-black/80 line-clamp-3">{content.section05.text}</div>
                </div>
              </div>
              <section className="space-y-3 border border-black/10 bg-white/60 p-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-secular text-lg uppercase">Marcas</h3>
                  <Button onClick={openNewSection05BrandModal}>Adicionar</Button>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {section05Rows.map((row) => (
                    <div key={row.brand.id} className="border border-black/15 bg-white p-3 space-y-2">
                      <div className="text-[10px] uppercase tracking-[0.16em] text-black/60">Marca</div>
                      <div className="text-sm font-semibold text-black">{row.brand.name || "-"}</div>
                      <div className="text-xs text-black/70 line-clamp-1">{row.brand.logo ? getAssetFileName(row.brand.logo) : "Sem logo"}</div>
                      <div className="text-xs text-black/70 line-clamp-1">{row.brand.secondaryLogo ? getAssetFileName(row.brand.secondaryLogo) : "Sem segundo logo"}</div>
                      <div className="text-xs text-black/70 line-clamp-2">{row.panel?.companyText || row.panel?.description || "Sem texto"}</div>
                      <div className="text-xs text-black/55 line-clamp-1">{row.panel?.videoSrc || "Sem vÃ­deo"}</div>
                      <div className="flex items-center justify-end">
                        <Button onClick={() => openSection05BrandModal(row.brand.id)}>Editar</Button>
                      </div>
                    </div>
                  ))}
                </div>              </section>
            </section>
          ) : null}

          {activeSection === "section06" ? (
            <section className="space-y-3 border border-black/10 bg-white/60 p-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-secular text-xl uppercase">SeÃ§Ã£o NÃºmeros</h2>
                <div className="flex gap-2">
                  <Button onClick={() => openSectionMeta("section06")}>Editar SeÃ§Ã£o</Button>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="border border-black/15 bg-white p-3">
                  <div className="text-[10px] uppercase tracking-[0.16em] text-black/60">TÃ­tulo</div>
                  <div className="mt-1 text-sm text-black/90">{content.section06.title}</div>
                </div>
                <div className="border border-black/15 bg-white p-3">
                  <div className="text-[10px] uppercase tracking-[0.16em] text-black/60">Texto</div>
                  <div className="mt-1 text-sm text-black/80 line-clamp-3">{content.section06.text}</div>
                </div>
              </div>
              <SectionEditor title="MÃ©tricas" text="" heading="" onHeading={() => {}} onText={() => {}} items={content.section06.stats} onItems={(items) => mutateContent((prev) => ({ ...prev, section06: { ...prev.section06, stats: items as typeof prev.section06.stats } }))} template={{ value: "+0", title: "Nova mÃ©trica", description: "" }} fields={["value", "title", "description"]} deleteWithConfirm={deleteWithConfirm} onSave={saveNow} allowCreate={false} showToggleDelete={false} fitContent fitContentClass="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4" hideSaveButtons />
              <SectionEditor title="Colunas do RodapÃ©" text="" heading="" onHeading={() => {}} onText={() => {}} items={content.footer.columns} onItems={(items) => mutateContent((prev) => ({ ...prev, footer: { ...prev.footer, columns: items as typeof prev.footer.columns } }))} template={{ title: "Nova coluna", links: [] as FooterLinkAdmin[] }} fields={["title"]} deleteWithConfirm={deleteWithConfirm} onSave={saveNow} extraField={(item, onPatch) => <FooterLinksField value={(item as { links: FooterLinkAdmin[] }).links} onChange={(value) => onPatch({ links: value })} />} allowCreate={false} showToggleDelete={false} fitContent fitContentClass="grid grid-cols-1 gap-3 md:grid-cols-3" hideSaveButtons />
              <section className="space-y-2 border border-black/10 bg-white/60 p-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-secular text-lg uppercase">InformaÃ§Ãµes Legais</h3>
                  <div className="flex gap-2">
                    <Button onClick={openFooterMetaModal}>Editar</Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                  <div className="border border-black/15 bg-white p-3 md:col-span-2">
                    <div className="text-[10px] uppercase tracking-[0.16em] text-black/60">Copyright</div>
                    <div className="mt-1 text-sm text-black/90 line-clamp-3">{content.footer.copyrightText || "-"}</div>
                  </div>
                  <div className="border border-black/15 bg-white p-3 md:col-span-2">
                    <div className="text-[10px] uppercase tracking-[0.16em] text-black/60">Cidade</div>
                    <div className="mt-1 text-sm text-black/90 line-clamp-3">{content.footer.city || "-"}</div>
                  </div>
                </div>              </section>
            </section>
          ) : null}

          {activeSection === "section07" || activeSection === "section07bulk" ? (
            <section className="space-y-3 border border-black/10 bg-white/60 p-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-secular text-xl uppercase">Locutores</h2>
                <div className="flex gap-2">
                  <Button onClick={() => openSectionMeta("section07")}>Editar SeÃ§Ã£o</Button>
                  <Button onClick={() => openSection07TalentModal("new")}>Novo Locutor</Button>
                  <Button onClick={saveNow}>Salvar</Button>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="border border-black/15 bg-white p-3">
                  <div className="text-[10px] uppercase tracking-[0.16em] text-black/60">TÃ­tulo</div>
                  <div className="mt-1 text-sm text-black/90">{content.section07.title}</div>
                </div>
                <div className="border border-black/15 bg-white p-3">
                  <div className="text-[10px] uppercase tracking-[0.16em] text-black/60">Texto</div>
                  <div className="mt-1 text-sm text-black/80 line-clamp-3">{content.section07.text}</div>
                </div>
              </div>

              <div className="border border-black/15 bg-white p-3 space-y-2">
                <div className="text-[10px] uppercase tracking-[0.16em] text-black/60">Filtros (espelho do site)</div>
                <div className="grid grid-cols-1 gap-2 xl:grid-cols-5">
                  <select
                    className="w-full border border-black/20 px-2 py-2 text-sm"
                    value={talentFilterGenero}
                    onChange={(event) => setTalentFilterGenero(event.target.value)}
                  >
                    <option value="">GÃªnero: Todos</option>
                    <option value="MASCULINA">Masculino</option>
                    <option value="FEMININA">Feminino</option>
                  </select>
                  <select
                    className="w-full border border-black/20 px-2 py-2 text-sm"
                    value={talentFilterRegiao}
                    onChange={(event) => setTalentFilterRegiao(event.target.value)}
                  >
                    <option value="">RegiÃ£o: Todas</option>
                    {regionFilterOptions.map((option) => (
                      <option key={`filter-regiao-${option}`} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <select
                    className="w-full border border-black/20 px-2 py-2 text-sm"
                    value={talentFilterIdioma}
                    onChange={(event) => setTalentFilterIdioma(event.target.value)}
                  >
                    <option value="">Idioma: Todos</option>
                    {idiomaFilterOptions.map((option) => (
                      <option key={`filter-idioma-${option}`} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <select
                    className="w-full border border-black/20 px-2 py-2 text-sm"
                    value={talentFilterEstilo}
                    onChange={(event) => setTalentFilterEstilo(event.target.value)}
                  >
                    <option value="">Estilo: Todos</option>
                    {estiloFilterOptions.map((option) => (
                      <option key={`filter-estilo-${option}`} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <input
                    className="w-full border border-black/20 px-2 py-2 text-sm"
                    placeholder="Pesquisar locutor, Ã¡udio ou filtro"
                    value={talentSearch}
                    onChange={(event) => setTalentSearch(event.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {filteredTalents.map((talent) => (
                  <div key={talent.id} className="border border-black/15 bg-white p-3 space-y-2">
                    <div className="text-[10px] uppercase tracking-[0.16em] text-black/60">Locutor</div>
                    <div className="text-sm font-semibold text-black">{talent.name || "-"}</div>
                    <div className="text-xs text-black/60 line-clamp-1">{talent.audioFile ? getAssetFileName(talent.audioFile) : "Sem Ã¡udio"}</div>
                    <div className="space-y-1 text-[11px] text-black/65">
                      {voiceFilters.map((filter) => {
                        const key = normalizeFilterKey(filter.name) as VoiceFilterKey
                        const groups = talent.assignments?.[key] ?? []
                        return (
                          <div key={`talent-filter-${talent.id}-${key}`}>
                            <strong className="font-semibold">{filter.name}:</strong>{" "}
                            {groups.length ? groups.map((path) => path.join(" > ")).join(" | ") : "-"}
                          </div>
                        )
                      })}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <CrudActions
                        item={talent}
                        onToggle={() =>
                          mutateContent((prev) => ({
                            ...prev,
                            section07: { ...prev.section07, talents: toggleItem(prev.section07.talents, talent.id) },
                          }))
                        }
                        onDelete={() =>
                          deleteWithConfirm("este locutor", () =>
                            mutateContent((prev) => ({
                              ...prev,
                              section07: { ...prev.section07, talents: markDeleted(prev.section07.talents, talent.id) },
                            }))
                          )
                        }
                      />
                      <Button onClick={() => openSection07TalentModal(talent.id)}>Editar</Button>
                    </div>
                  </div>
                ))}
              </div>
              {!filteredTalents.length ? (
                <div className="border border-black/15 bg-white p-3 text-sm text-black/70">
                  Nenhum locutor encontrado com os filtros/pesquisa atuais.
                </div>
              ) : null}
            </section>
          ) : null}
        </main>
      </div>

      {sectionMetaModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <div className="w-full max-w-xl border border-black/20 bg-white p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-secular text-lg uppercase">Editar SeÃ§Ã£o</h3>
              <Button onClick={() => setSectionMetaModal(null)}>Fechar</Button>
            </div>
            <div className="mt-4 grid gap-3">
              <label className="text-xs uppercase tracking-[0.14em]">
                TÃ­tulo
                <input
                  className="mt-1 w-full border border-black/20 px-2 py-2 text-sm"
                  value={sectionMetaDraft.title}
                  onChange={(event) => setSectionMetaDraft((prev) => ({ ...prev, title: event.target.value }))}
                />
              </label>
              <label className="text-xs uppercase tracking-[0.14em]">
                Texto
                <textarea
                  className="mt-1 min-h-24 w-full border border-black/20 px-2 py-2 text-sm"
                  value={sectionMetaDraft.text}
                  onChange={(event) => setSectionMetaDraft((prev) => ({ ...prev, text: event.target.value }))}
                />
              </label>
              <div className="flex gap-2">
                <Button className="bg-black text-white" onClick={saveSectionMeta}>Salvar</Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {section02CardModalId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <div className="w-full max-w-xl border border-black/20 bg-white p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-secular text-lg uppercase">Editar Quadro do EstÃºdio</h3>
              <Button onClick={() => setSection02CardModalId(null)}>Fechar</Button>
            </div>
            <div className="mt-4 grid gap-3">
              <label className="text-xs uppercase tracking-[0.14em]">
                TÃ­tulo do quadro
                <input
                  className="mt-1 w-full border border-black/20 px-2 py-2 text-sm"
                  value={section02CardDraft.title}
                  onChange={(event) => setSection02CardDraft((prev) => ({ ...prev, title: event.target.value }))}
                />
              </label>
              <label className="text-xs uppercase tracking-[0.14em]">
                Ãcone
                <AssetAutocompleteInput
                  value={section02CardDraft.icon}
                  options={ASSET_OPTIONS.icons}
                  onChange={(value) => setSection02CardDraft((prev) => ({ ...prev, icon: value }))}
                />
              </label>
              <label className="text-xs uppercase tracking-[0.14em]">
                Texto do quadro
                <textarea
                  className="mt-1 min-h-20 w-full border border-black/20 px-2 py-2 text-sm"
                  value={section02CardDraft.text}
                  onChange={(event) => setSection02CardDraft((prev) => ({ ...prev, text: event.target.value }))}
                />
              </label>
              <label className="text-xs uppercase tracking-[0.14em]">
                Texto de hover
                <textarea
                  className="mt-1 min-h-24 w-full border border-black/20 px-2 py-2 text-sm"
                  value={section02CardDraft.hoverText}
                  onChange={(event) => setSection02CardDraft((prev) => ({ ...prev, hoverText: event.target.value }))}
                />
              </label>
              <div className="flex gap-2">
                <Button className="bg-black text-white" onClick={saveSection02CardModal}>Salvar</Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {section05ModalBrandId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <div className="w-full max-w-3xl border border-black/20 bg-white p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-secular text-lg uppercase">
                {section05ModalBrandId === "new" ? "Adicionar Marca" : "Editar Marca"}
              </h3>
              <Button onClick={() => setSection05ModalBrandId(null)}>Fechar</Button>
            </div>
            <div className="mt-4 grid gap-3">
              <label className="text-xs uppercase tracking-[0.14em]">
                Name
                <input
                  className="mt-1 w-full border border-black/20 px-2 py-2 text-sm"
                  value={section05Draft.name}
                  onChange={(event) => setSection05Draft((prev) => ({ ...prev, name: event.target.value }))}
                />
              </label>
              <label className="text-xs uppercase tracking-[0.14em]">
                Logo 1
                <div className="mt-1 flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <AssetAutocompleteInput
                      value={section05Draft.logo}
                      options={ASSET_OPTIONS.logos}
                      onChange={(value) => setSection05Draft((prev) => ({ ...prev, logo: value }))}
                    />
                  </div>
                  <div className="mt-1 flex h-[38px] items-stretch gap-1">
                    <Button
                      type="button"
                      className="h-full min-w-[34px] px-2 py-0"
                      onClick={() =>
                        setSection05Draft((prev) => ({
                          ...prev,
                          logoScale: normalizeLogoScale(prev.logoScale - 0.1),
                        }))
                      }
                    >
                      -
                    </Button>
                    <span className="inline-flex h-full min-w-[44px] items-center justify-center border border-black/20 px-2 py-0 text-[11px] tracking-[0.14em]">
                      {formatLogoScale(section05Draft.logoScale)}
                    </span>
                    <Button
                      type="button"
                      className="h-full min-w-[34px] px-2 py-0"
                      onClick={() =>
                        setSection05Draft((prev) => ({
                          ...prev,
                          logoScale: normalizeLogoScale(prev.logoScale + 0.1),
                        }))
                      }
                    >
                      +
                    </Button>
                  </div>
                </div>
              </label>
              <label className="text-xs uppercase tracking-[0.14em]">
                Logo 2
                <div className="mt-1 flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <AssetAutocompleteInput
                      value={section05Draft.secondaryLogo}
                      options={ASSET_OPTIONS.logos}
                      onChange={(value) => setSection05Draft((prev) => ({ ...prev, secondaryLogo: value }))}
                    />
                  </div>
                  <div className="mt-1 flex h-[38px] items-stretch gap-1">
                    <Button
                      type="button"
                      className="h-full min-w-[34px] px-2 py-0"
                      onClick={() =>
                        setSection05Draft((prev) => ({
                          ...prev,
                          secondaryLogoScale: normalizeLogoScale(prev.secondaryLogoScale - 0.1),
                        }))
                      }
                    >
                      -
                    </Button>
                    <span className="inline-flex h-full min-w-[44px] items-center justify-center border border-black/20 px-2 py-0 text-[11px] tracking-[0.14em]">
                      {formatLogoScale(section05Draft.secondaryLogoScale)}
                    </span>
                    <Button
                      type="button"
                      className="h-full min-w-[34px] px-2 py-0"
                      onClick={() =>
                        setSection05Draft((prev) => ({
                          ...prev,
                          secondaryLogoScale: normalizeLogoScale(prev.secondaryLogoScale + 0.1),
                        }))
                      }
                    >
                      +
                    </Button>
                  </div>
                </div>
              </label>
              <label className="text-xs uppercase tracking-[0.14em]">
                TÃ­tulo Interno
                <input
                  className="mt-1 w-full border border-black/20 px-2 py-2 text-sm"
                  value={section05Draft.title}
                  onChange={(event) => setSection05Draft((prev) => ({ ...prev, title: event.target.value }))}
                />
              </label>
              <label className="text-xs uppercase tracking-[0.14em]">
                DescriÃ§Ã£o Curta
                <textarea
                  className="mt-1 min-h-20 w-full border border-black/20 px-2 py-2 text-sm"
                  value={section05Draft.description}
                  onChange={(event) => setSection05Draft((prev) => ({ ...prev, description: event.target.value }))}
                />
              </label>
              <label className="text-xs uppercase tracking-[0.14em]">
                Texto da Empresa
                <textarea
                  className="mt-1 min-h-24 w-full border border-black/20 px-2 py-2 text-sm"
                  value={section05Draft.companyText}
                  onChange={(event) => setSection05Draft((prev) => ({ ...prev, companyText: event.target.value }))}
                />
              </label>
              <label className="text-xs uppercase tracking-[0.14em]">
                URL do VÃ­deo
                <AssetAutocompleteInput
                  value={section05Draft.videoSrc}
                  options={ASSET_OPTIONS.videos}
                  onChange={(value) => setSection05Draft((prev) => ({ ...prev, videoSrc: value }))}
                  displayFileName={false}
                  placeholder="Cole uma URL do Vimeo, YouTube ou arquivo de vÃ­deo..."
                />
              </label>
              <div className="flex gap-2">
                <Button className="bg-black text-white" onClick={saveSection05BrandModal}>Salvar</Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {section07ModalId ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/55 p-4">
          <div className="mx-auto my-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-black/20 bg-white p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-secular text-lg uppercase">
                {section07ModalId === "new" ? "Novo Locutor" : "Editar Locutor"}
              </h3>
              <Button onClick={() => setSection07ModalId(null)}>Fechar</Button>
            </div>
            <div className="mt-4 grid gap-3">
              <label className="text-xs uppercase tracking-[0.14em]">
                Nome
                <input
                  className="mt-1 w-full border border-black/20 px-2 py-2 text-sm"
                  value={section07Draft.name}
                  onChange={(event) => setSection07Draft((prev) => ({ ...prev, name: event.target.value }))}
                />
              </label>
              <label className="text-xs uppercase tracking-[0.14em]">
                Arquivo de Ã¡udio
                <AssetAutocompleteInput
                  value={section07Draft.audioFile}
                  options={ASSET_OPTIONS.audios}
                  onChange={(value) => setSection07Draft((prev) => ({ ...prev, audioFile: value }))}
                />
              </label>
              <label className="text-xs uppercase tracking-[0.14em]">
                Subir Ã¡udio (servidor)
                <input
                  type="file"
                  accept="audio/*"
                  className="mt-1 w-full border border-black/20 px-2 py-2 text-sm"
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (!file) return
                    setSection07Draft((prev) => ({
                      ...prev,
                      audioFile: `/assets/audios/${file.name}`,
                      audioName: file.name.replace(/\.[^/.]+$/, ""),
                    }))
                  }}
                />
              </label>

              <div className="border border-black/15 bg-black/[0.02] p-3 space-y-2">
                <div className="text-[11px] uppercase tracking-[0.14em] text-black/75">Filtros</div>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  <label className="text-xs uppercase tracking-[0.14em]">
                    GÃªnero
                    <select
                      className="mt-1 w-full border border-black/20 px-2 py-2 text-sm"
                      value={section07FilterDraft.genero}
                      onChange={(event) => setSection07FilterDraft((prev) => ({ ...prev, genero: event.target.value }))}
                    >
                      <option value="">NÃ£o definir</option>
                      <option value="MASCULINA">Masculino</option>
                      <option value="FEMININA">Feminino</option>
                    </select>
                  </label>
                  <label className="text-xs uppercase tracking-[0.14em]">
                    RegiÃ£o
                    <select
                      className="mt-1 w-full border border-black/20 px-2 py-2 text-sm"
                      value={section07FilterDraft.regiao}
                      onChange={(event) => setSection07FilterDraft((prev) => ({ ...prev, regiao: event.target.value }))}
                    >
                      <option value="">NÃ£o definir</option>
                      {regionFilterOptions.map((option) => (
                        <option key={`edit-regiao-${option}`} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-xs uppercase tracking-[0.14em]">
                    Idioma
                    <select
                      className="mt-1 w-full border border-black/20 px-2 py-2 text-sm"
                      value={section07FilterDraft.idioma}
                      onChange={(event) => setSection07FilterDraft((prev) => ({ ...prev, idioma: event.target.value }))}
                    >
                      <option value="">NÃ£o definir</option>
                      {idiomaFilterOptions.map((option) => (
                        <option key={`edit-idioma-${option}`} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-xs uppercase tracking-[0.14em]">
                    Estilo
                    <select
                      className="mt-1 w-full border border-black/20 px-2 py-2 text-sm"
                      value={section07FilterDraft.estilo}
                      onChange={(event) => setSection07FilterDraft((prev) => ({ ...prev, estilo: event.target.value }))}
                    >
                      <option value="">NÃ£o definir</option>
                      {estiloFilterOptions.map((option) => (
                        <option key={`edit-estilo-${option}`} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              <div className="flex gap-2">
                <Button className="bg-black text-white" onClick={saveSection07TalentModal}>Salvar</Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {section07BulkModalOpen ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/55 p-4">
          <div className="mx-auto my-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-black/20 bg-white p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-secular text-lg uppercase">Locutores em Massa</h3>
              <Button onClick={() => setSection07BulkModalOpen(false)}>Fechar</Button>
            </div>
            <div className="mt-4 grid gap-3">
              <p className="text-sm text-black/70">
                Defina manualmente os filtros em sequÃªncia (gÃªnero, regiÃ£o, idioma e estilo) e importe a pasta.
              </p>

              <label className="text-xs uppercase tracking-[0.14em]">
                Pasta Base
                <select
                  className="mt-1 w-full border border-black/20 px-2 py-2 text-sm"
                  value={section07BulkDraft.sourceKey}
                  onChange={(event) =>
                    setSection07BulkDraft((prev) => ({ ...prev, sourceKey: event.target.value as VoiceFilterKey }))
                  }
                >
                  {bulkInferOptions.map((option) => (
                    <option key={`bulk-infer-${option.key}`} value={option.key}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
                <label className="text-xs uppercase tracking-[0.14em]">
                  GÃªnero
                  <select
                    className="mt-1 w-full border border-black/20 px-2 py-2 text-sm"
                    value={section07BulkDraft.manual.genero}
                    onChange={(event) =>
                      setSection07BulkDraft((prev) => ({ ...prev, manual: { ...prev.manual, genero: event.target.value } }))
                    }
                  >
                    <option value="">NÃ£o definir</option>
                    <option value="MASCULINA">Masculino</option>
                    <option value="FEMININA">Feminino</option>
                  </select>
                </label>
                <label className="text-xs uppercase tracking-[0.14em]">
                  RegiÃ£o
                  <select
                    className="mt-1 w-full border border-black/20 px-2 py-2 text-sm"
                    value={section07BulkDraft.manual.regiao}
                    onChange={(event) =>
                      setSection07BulkDraft((prev) => ({ ...prev, manual: { ...prev.manual, regiao: event.target.value } }))
                    }
                  >
                    <option value="">NÃ£o definir</option>
                    {regionFilterOptions.map((option) => (
                      <option key={`bulk-manual-regiao-${option}`} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs uppercase tracking-[0.14em]">
                  Idioma
                  <select
                    className="mt-1 w-full border border-black/20 px-2 py-2 text-sm"
                    value={section07BulkDraft.manual.idioma}
                    onChange={(event) =>
                      setSection07BulkDraft((prev) => ({ ...prev, manual: { ...prev.manual, idioma: event.target.value } }))
                    }
                  >
                    <option value="">NÃ£o definir</option>
                    {idiomaFilterOptions.map((option) => (
                      <option key={`bulk-manual-idioma-${option}`} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs uppercase tracking-[0.14em]">
                  Estilo
                  <select
                    className="mt-1 w-full border border-black/20 px-2 py-2 text-sm"
                    value={section07BulkDraft.manual.estilo}
                    onChange={(event) =>
                      setSection07BulkDraft((prev) => ({ ...prev, manual: { ...prev.manual, estilo: event.target.value } }))
                    }
                  >
                    <option value="">NÃ£o definir</option>
                    {estiloFilterOptions.map((option) => (
                      <option key={`bulk-manual-estilo-${option}`} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="text-xs uppercase tracking-[0.14em]">
                Subir pasta de Ã¡udios
                <input
                  type="file"
                  accept="audio/*"
                  multiple
                  {...({ webkitdirectory: "true", directory: "true" } as Record<string, string>)}
                  className="mt-1 w-full border border-black/20 px-2 py-2 text-sm"
                  onChange={(event) => {
                    const files = Array.from(event.target.files ?? [])
                    if (files.length > 0) {
                      const hasFolderPath = files.some((file) =>
                        ((file as File & { webkitRelativePath?: string }).webkitRelativePath ?? "").includes("/")
                      )
                      if (!hasFolderPath) {
                        window.alert("Selecione uma pasta (regiao/idioma/estilo). Arquivos soltos e .zip nao sao aceitos neste modo.")
                        event.currentTarget.value = ""
                        return
                      }
                    }
                    setSection07BulkDraft((prev) => ({ ...prev, files }))
                  }}
                />
              </label>

              {section07BulkDraft.files.length ? (
                <div className="border border-black/15 bg-black/[0.02] p-3 text-sm">
                  <div className="text-[11px] uppercase tracking-[0.14em] text-black/70 mb-2">Arquivos selecionados</div>
                  <div className="grid grid-cols-1 gap-1 md:grid-cols-2">
                    {section07BulkDraft.files.map((file, fileIndex) => {
                      const relativePath =
                        ((file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name).replace(/\\/g, "/")
                      const resolution = resolveBulkAssignmentsWithMeta(
                        file.name,
                        relativePath,
                        voiceFilters,
                        section07BulkDraft.assignments,
                        section07BulkDraft.manual,
                        section07BulkDraft.sourceKey
                      )
                      const manualAssignments = resolution.assignments
                      const sourceAssignmentKey = section07BulkDraft.sourceKey === "IDIOMA" ? "IDIOMAS" : section07BulkDraft.sourceKey
                      const sourcePaths = manualAssignments[sourceAssignmentKey] ?? []
                      const detectedValue =
                        sourcePaths[0]?.find((part) => {
                          const norm = normalizeLookup(part)
                          return norm !== "MASCULINA" && norm !== "FEMININA"
                        }) ?? ""
                      const knownValues =
                        section07BulkDraft.sourceKey === "REGIAO"
                          ? regionFilterOptions
                          : section07BulkDraft.sourceKey === "IDIOMA"
                            ? idiomaFilterOptions
                            : estiloFilterOptions
                      const isKnownValue = !detectedValue || knownValues.some((value) => normalizeLookup(value) === normalizeLookup(detectedValue))
                      const hasGenderInPath = sourcePaths.some((path) =>
                        path.some((part) => {
                          const norm = normalizeLookup(part)
                          return norm === "MASCULINA" || norm === "FEMININA"
                        })
                      )
                      const warnings: string[] = []
                      if (!sourcePaths.length) warnings.push(`Nao identificado para ${section07BulkDraft.sourceKey}`)
                      if (sourcePaths.length && !hasGenderInPath) warnings.push("Genero nao identificado no caminho")
                      if (sourcePaths.length && !isKnownValue) warnings.push(`Novo valor detectado: ${detectedValue}`)
                      return (
                        <div key={`bulk-audio-${relativePath}-${fileIndex}`} className="relative border border-black/10 bg-white p-2 pr-8 text-black/80">
                          <button
                            type="button"
                            className="absolute right-1 top-1 inline-flex h-5 w-5 items-center justify-center border border-black/25 text-[11px] leading-none text-black/70 hover:bg-black/5"
                            aria-label="Remover arquivo"
                            onClick={() =>
                              setSection07BulkDraft((prev) => ({
                                ...prev,
                                files: prev.files.filter((_, index) => index !== fileIndex),
                              }))
                            }
                          >
                            x
                          </button>
                          <div className="text-[12px]">
                            {getAssetFileName(relativePath)} Ã¢â€ â€™ {inferTalentNameFromFileName(file.name, relativePath)}
                          </div>
                          <div className="mt-1 text-[11px] text-black/65">{relativePath}</div>
                          <div className="mt-1 text-[11px]">
                            <span className="font-semibold">DiagnÃ³stico: </span>
                            <span>
                              {resolution.source === "manual"
                                ? "manual"
                                : resolution.source === "folder"
                                  ? "pasta"
                                  : resolution.source === "filename"
                                    ? "nome do arquivo"
                                    : "sem correspondÃªncia"}
                            </span>
                            {warnings.length ? (
                              <span className="text-red-700"> | {warnings.join(" | ")}</span>
                            ) : (
                              <span className="text-green-700"> | ok</span>
                            )}
                          </div>
                          <div className="mt-1 grid grid-cols-1 gap-1 text-[11px]">
                            <div>
                              <span className="font-semibold">REGIAO: </span>
                              <span>{formatAssignmentPreview(manualAssignments, "REGIAO")}</span>
                            </div>
                            <div>
                              <span className="font-semibold">IDIOMAS: </span>
                              <span>{formatAssignmentPreview(manualAssignments, "IDIOMAS")}</span>
                            </div>
                            <div>
                              <span className="font-semibold">ESTILO: </span>
                              <span>{formatAssignmentPreview(manualAssignments, "ESTILO")}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : null}

              <div className="flex gap-2">
                <Button className="bg-black text-white" onClick={saveSection07BulkModal}>
                  Importar Ãudios
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {footerMetaModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <div className="w-full max-w-xl border border-black/20 bg-white p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-secular text-lg uppercase">Editar InformaÃ§Ãµes Legais</h3>
              <Button onClick={() => setFooterMetaModalOpen(false)}>Fechar</Button>
            </div>
            <div className="mt-4 grid gap-3">
              <label className="text-xs uppercase tracking-[0.14em]">
                Copyright
                <input
                  className="mt-1 w-full border border-black/20 px-2 py-2 text-sm"
                  value={footerMetaDraft.copyrightText}
                  onChange={(event) => setFooterMetaDraft((prev) => ({ ...prev, copyrightText: event.target.value }))}
                />
              </label>
              <label className="text-xs uppercase tracking-[0.14em]">
                Cidade
                <input
                  className="mt-1 w-full border border-black/20 px-2 py-2 text-sm"
                  value={footerMetaDraft.city}
                  onChange={(event) => setFooterMetaDraft((prev) => ({ ...prev, city: event.target.value }))}
                />
              </label>
              <div className="flex gap-2">
                <Button className="bg-black text-white" onClick={saveFooterMetaModal}>Salvar</Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {showHistory ? (
        <aside className="fixed right-0 top-[68px] z-40 h-[calc(100vh-68px)] w-full max-w-md border-l border-black/15 bg-white p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-secular text-lg uppercase">HistÃ³rico</h3>
            <Button onClick={() => setShowHistory(false)}>Fechar</Button>
          </div>
          <div className="mt-3 space-y-2 overflow-y-auto max-h-[calc(100%-36px)]">
            {versions.slice().sort((a, b) => b.version_number - a.version_number).map((version) => (
              <div key={version.id} className="border border-black/15 p-3">
                <p className="text-xs uppercase tracking-[0.13em] text-black/70">VersÃ£o {version.version_number}</p>
                <p className="text-[12px] text-black/70">{new Date(version.created_at).toLocaleString()}</p>
                <Button onClick={() => revertToVersion(version)}>Reverter para esta</Button>
              </div>
            ))}
          </div>
        </aside>
      ) : null}
    </div>
  )
}

type SectionEditorProps<T extends BaseItem> = {
  title: string
  heading: string
  text: string
  onHeading: (value: string) => void
  onText: (value: string) => void
  items: T[]
  onItems: (items: T[]) => void
  template: Omit<T, keyof BaseItem>
  fields: Array<keyof Omit<T, keyof BaseItem>>
  deleteWithConfirm: (label: string, onConfirm: () => void) => void
  onSave?: () => void
  extraField?: (item: T, onPatch: (patch: Partial<T>) => void) => React.ReactNode
  allowCreate?: boolean
  showToggleDelete?: boolean
  fitContent?: boolean
  hideSaveButtons?: boolean
  fitContentClass?: string
}

function SectionEditor<T extends BaseItem>({
  title,
  heading,
  text,
  onHeading,
  onText,
  items,
  onItems,
  template,
  fields,
  deleteWithConfirm,
  onSave,
  extraField,
  allowCreate = true,
  showToggleDelete = true,
  fitContent = false,
  hideSaveButtons = false,
  fitContentClass,
}: SectionEditorProps<T>) {
  const [dragId, setDragId] = useState<string | null>(null)
  const [editingItemId, setEditingItemId] = useState<string | "new" | null>(null)
  const [itemDraft, setItemDraft] = useState<Record<string, string>>({})
  const [sectionModalOpen, setSectionModalOpen] = useState(false)
  const [sectionDraft, setSectionDraft] = useState({ heading, text })
  const activeItems = visibleItems(items)
  const topBlockWrapClass = fitContent ? "grid grid-cols-1 gap-3 md:grid-cols-2" : "flex gap-3 overflow-x-auto pb-1"
  const topBlockCardClass = fitContent ? "w-full border border-black/15 bg-white p-3" : "border border-black/15 bg-white p-3"
  const itemListClass = fitContent ? (fitContentClass ?? "grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3") : "flex gap-3 overflow-x-auto pb-1"
  const itemCardClass = fitContent ? "w-full border border-black/15 bg-white p-3 space-y-2" : "min-w-[360px] flex-none border border-black/15 bg-white p-3 space-y-2"

  const openEditItem = (item: T) => {
    const draft: Record<string, string> = {}
    for (const field of fields) {
      draft[String(field)] = String(item[field] ?? "")
    }
    setItemDraft(draft)
    setEditingItemId(item.id)
  }

  const openNewItem = () => {
    const draft: Record<string, string> = {}
    for (const field of fields) {
      draft[String(field)] = String((template as Record<string, unknown>)[String(field)] ?? "")
    }
    setItemDraft(draft)
    setEditingItemId("new")
  }

  const saveItemModal = () => {
    if (editingItemId === null) return
    if (editingItemId === "new") {
      const payload: Record<string, unknown> = {}
      for (const field of fields) payload[String(field)] = itemDraft[String(field)] ?? ""
      onItems(
        normalizeVisibleItems([
          ...items,
          { ...createBase(activeItems.length + 1), ...template, ...payload } as T,
        ])
      )
      setEditingItemId(null)
      return
    }
    const patch: Record<string, unknown> = {}
    for (const field of fields) patch[String(field)] = itemDraft[String(field)] ?? ""
    onItems(patchItem(items, editingItemId, patch as Partial<T>))
    setEditingItemId(null)
  }

  const fieldOptions: Record<string, string[] | undefined> = {
    logo: ASSET_OPTIONS.logos,
    file: ASSET_OPTIONS.audios,
    media: ASSET_OPTIONS.icons,
    icon: ASSET_OPTIONS.icons,
    bgImage: ASSET_OPTIONS.images,
    poster: ASSET_OPTIONS.images,
    videoSrc: ASSET_OPTIONS.videos,
  }

  return (
    <section className="space-y-3 border border-black/10 bg-white/60 p-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-secular text-lg uppercase">{title}</h3>
        <div className="flex gap-2">
          {(heading || text) && <Button onClick={() => { setSectionDraft({ heading, text }); setSectionModalOpen(true) }}>Editar bloco</Button>}
          {!hideSaveButtons ? <Button onClick={onSave}>Salvar</Button> : null}
        </div>
      </div>
      {heading || text ? (
        <div className={topBlockWrapClass}>
          <div className={topBlockCardClass}>
            <div className="text-[10px] uppercase tracking-[0.16em] text-black/60">TÃ­tulo</div>
            <div className="mt-1 text-sm text-black/90">{heading || "-"}</div>
          </div>
          <div className={topBlockCardClass}>
            <div className="text-[10px] uppercase tracking-[0.16em] text-black/60">Texto</div>
            <div className="mt-1 text-sm text-black/80 line-clamp-3">{text || "-"}</div>
          </div>
        </div>
      ) : null}
      <div className="flex items-center gap-2">
        {allowCreate ? <Button onClick={openNewItem}>Adicionar</Button> : null}
        {!hideSaveButtons ? <Button onClick={onSave}>Salvar</Button> : null}
      </div>
      <div className={itemListClass}>
      {activeItems.map((item) => (
        <div key={item.id} draggable onDragStart={() => setDragId(item.id)} onDragOver={(event) => event.preventDefault()} onDrop={() => dragId && onItems(reorderByIds(items, dragId, item.id))} className={itemCardClass}>
          <div className="text-[10px] uppercase tracking-[0.16em] text-black/60">Quadro</div>
          <div className="text-sm font-semibold text-black">{String(item[fields[0]] ?? "Sem tÃ­tulo")}</div>
          {fields[1] ? <div className="text-sm text-black/70 line-clamp-2">{String(item[fields[1]] ?? "-")}</div> : null}
          <div className="flex items-center justify-between gap-2">
            <CrudActions
              item={item}
              showToggle={showToggleDelete}
              showDelete={showToggleDelete}
              onToggle={() => onItems(toggleItem(items, item.id))}
              onDelete={() => deleteWithConfirm("este item", () => onItems(markDeleted(items, item.id)))}
            />
            <Button onClick={() => openEditItem(item)}>Editar</Button>
          </div>
        </div>
      ))}
      </div>

      {sectionModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <div className="w-full max-w-xl border border-black/20 bg-white p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <h4 className="font-secular text-lg uppercase">Editar Bloco</h4>
              <Button onClick={() => setSectionModalOpen(false)}>Fechar</Button>
            </div>
            <div className="mt-4 grid gap-3">
              <label className="text-xs uppercase tracking-[0.14em]">
                TÃ­tulo
                <input className="mt-1 w-full border border-black/20 px-2 py-2 text-sm" value={sectionDraft.heading} onChange={(event) => setSectionDraft((prev) => ({ ...prev, heading: event.target.value }))} />
              </label>
              <label className="text-xs uppercase tracking-[0.14em]">
                Texto
                <textarea className="mt-1 min-h-24 w-full border border-black/20 px-2 py-2 text-sm" value={sectionDraft.text} onChange={(event) => setSectionDraft((prev) => ({ ...prev, text: event.target.value }))} />
              </label>
              <div className="flex gap-2">
                <Button className="bg-black text-white" onClick={() => { onHeading(sectionDraft.heading); onText(sectionDraft.text); setSectionModalOpen(false) }}>Salvar</Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {editingItemId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <div className="w-full max-w-xl border border-black/20 bg-white p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <h4 className="font-secular text-lg uppercase">{editingItemId === "new" ? "Novo Item" : "Editar Item"}</h4>
              <Button onClick={() => setEditingItemId(null)}>Fechar</Button>
            </div>
            <div className="mt-4 grid gap-3">
              {fields.map((field) => (
                <label key={`modal-field-${String(field)}`} className="text-xs uppercase tracking-[0.14em]">
                  {String(field)}
                  {(fieldOptions[String(field)]?.length ?? 0) > 0 ? (
                    <AssetAutocompleteInput
                      value={itemDraft[String(field)] ?? ""}
                      options={fieldOptions[String(field)] ?? []}
                      onChange={(value) => setItemDraft((prev) => ({ ...prev, [String(field)]: value }))}
                    />
                  ) : (
                    <input
                      className="mt-1 w-full border border-black/20 px-2 py-2 text-sm"
                      value={itemDraft[String(field)] ?? ""}
                      onChange={(event) => setItemDraft((prev) => ({ ...prev, [String(field)]: event.target.value }))}
                    />
                  )}
                </label>
              ))}
              {editingItemId !== "new" && extraField
                ? extraField(
                    activeItems.find((entry) => entry.id === editingItemId) as T,
                    (patch) => onItems(patchItem(items, editingItemId as string, patch))
                  )
                : null}
              <div className="flex gap-2">
                <Button className="bg-black text-white" onClick={saveItemModal}>Salvar</Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
