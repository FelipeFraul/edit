import { createDefaultAdminContent } from "./defaultAdminData"
import type { AdminContent, AdminSession, ContentVersion, TaxonomyNode, VoiceFilterAdmin } from "./types"
import { restRequest, supabaseConfigured } from "../lib/supabaseRest"

const ADMIN_DRAFT_KEY = "edit-admin:draft:v2"
const ADMIN_VERSIONS_KEY = "edit-admin:versions:v2"
const ADMIN_SESSION_KEY = "edit-admin:session:v2"
const ADMIN_DRAFT_ROW_ID = "default"
const ADMIN_DRAFTS_TABLE = "admin_drafts"
const ADMIN_VERSIONS_TABLE = "admin_versions"

const isStorageQuotaError = (error: unknown) =>
  error instanceof DOMException &&
  (error.name === "QuotaExceededError" ||
    error.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
    error.code === 22 ||
    error.code === 1014)

const setLocalStorageWithDraftPriority = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value)
    return
  } catch (error) {
    if (!isStorageQuotaError(error)) throw error
  }

  // Version history can contain repeated base64 images. Keep the current draft first.
  localStorage.removeItem(ADMIN_VERSIONS_KEY)
  localStorage.setItem(key, value)
}

const parseJson = <T>(raw: string | null): T | null => {
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

const normalizeKey = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9]/g, "")
    .toUpperCase()

const normalizeLookup = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim()

const createId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`

const createTaxonomyNode = (name: string, orderIndex: number, children: TaxonomyNode[] = []): TaxonomyNode => {
  const timestamp = new Date().toISOString()
  return {
    id: createId(),
    order_index: orderIndex,
    is_active: true,
    deleted_at: null,
    created_at: timestamp,
    updated_at: timestamp,
    name,
    children,
  }
}

const createVoiceFilter = (
  name: string,
  orderIndex: number,
  subtitle: string,
  hint: string,
  items: TaxonomyNode[]
): VoiceFilterAdmin => {
  const timestamp = new Date().toISOString()
  return {
    id: createId(),
    order_index: orderIndex,
    is_active: true,
    deleted_at: null,
    created_at: timestamp,
    updated_at: timestamp,
    name,
    subtitle,
    hint,
    items,
  }
}

const withExistingMeta = <T extends TaxonomyNode | VoiceFilterAdmin>(
  source: T,
  existingByKey: Map<string, T>,
  key: string,
  orderIndex: number
): T => {
  const existing = existingByKey.get(normalizeKey(key))
  if (!existing) return source
  return {
    ...source,
    id: existing.id,
    created_at: existing.created_at,
    updated_at: new Date().toISOString(),
    order_index: orderIndex,
    is_active: existing.is_active,
    deleted_at: null,
  }
}

const buildCanonicalSection04Filters = (current: VoiceFilterAdmin[]): VoiceFilterAdmin[] => {
  const regionOptions = ["NORTE", "NORDESTE", "SUDESTE", "SUL", "CENTRO-OESTE"]
  const defaultLanguageOptions = [
    "INGLÊS",
    "ESPANHOL",
    "MANDARIM",
    "ITALIANO",
    "FRANCÊS",
    "POLONÊS",
    "ÁRABE",
    "PORTUGUÊS PORTUGAL",
  ]
  const styleOptions = ["INFANTIL", "ADOLESCENTE", "MADURA", "VOZES PRETAS"]

  const existingFiltersByKey = new Map(current.map((entry) => [normalizeKey(entry.name), entry]))
  const regionFilterCurrent = existingFiltersByKey.get("REGIAO")
  const idiomaFilterCurrent = existingFiltersByKey.get("IDIOMAS") ?? existingFiltersByKey.get("IDIOMA")
  const estiloFilterCurrent = existingFiltersByKey.get("ESTILO")

  const buildSecondLevel = (currentNodes: TaxonomyNode[] | undefined, items: string[]) => {
    const existingByKey = new Map((currentNodes ?? []).map((entry) => [normalizeKey(entry.name), entry]))
    return items.map((itemName, index) => {
      const created = createTaxonomyNode(itemName, index + 1)
      return withExistingMeta(created, existingByKey, itemName, index + 1)
    })
  }

  const buildGenderNode = (genderName: "MASCULINA" | "FEMININA", orderIndex: number, options: string[], currentNodes?: TaxonomyNode[]) => {
    const existingByKey = new Map((currentNodes ?? []).map((entry) => [normalizeKey(entry.name), entry]))
    const genderCurrent = existingByKey.get(normalizeKey(genderName))
    const children = buildSecondLevel(genderCurrent?.children, options)
    const created = createTaxonomyNode(genderName, orderIndex, children)
    return withExistingMeta(created, existingByKey, genderName, orderIndex)
  }

  const collectExistingIdiomaOptions = (nodes: TaxonomyNode[] | undefined) => {
    const collected: string[] = []
    const addOption = (raw: string) => {
      const value = raw.trim()
      const key = normalizeKey(value)
      if (!value || !key) return
      if (key === "MASCULINA" || key === "FEMININA") return
      if (!collected.some((entry) => normalizeKey(entry) === key)) collected.push(value)
    }

    for (const genderNode of nodes ?? []) {
      const children = genderNode.children ?? []
      for (const child of children) addOption(child.name)
    }
    return collected
  }

  const languageOptions = Array.from(
    new Set([
      ...defaultLanguageOptions,
      ...collectExistingIdiomaOptions(idiomaFilterCurrent?.items).map((entry) => normalizeKey(entry)),
    ])
  )

  const regionItems = [
    buildGenderNode("MASCULINA", 1, regionOptions, regionFilterCurrent?.items),
    buildGenderNode("FEMININA", 2, regionOptions, regionFilterCurrent?.items),
  ]
  const idiomaItems = [
    buildGenderNode("MASCULINA", 1, languageOptions, idiomaFilterCurrent?.items),
    buildGenderNode("FEMININA", 2, languageOptions, idiomaFilterCurrent?.items),
  ]
  const estiloExistingByKey = new Map((estiloFilterCurrent?.items ?? []).map((entry) => [normalizeKey(entry.name), entry]))
  const estiloItems = styleOptions.map((itemName, index) => {
    const created = createTaxonomyNode(itemName, index + 1)
    return withExistingMeta(created, estiloExistingByKey, itemName, index + 1)
  })

  const regionFilter = withExistingMeta(
    createVoiceFilter("REGIÃO", 1, "FILTRO ESTRUTURAL", "Filtro por gênero e macro-região.", regionItems),
    existingFiltersByKey,
    "REGIAO",
    1
  )
  const idiomaFilter = withExistingMeta(
    createVoiceFilter("IDIOMAS", 2, "FILTRO ESTRUTURAL", "Filtro por gênero e idioma.", idiomaItems),
    existingFiltersByKey,
    "IDIOMAS",
    2
  )
  const estiloFilter = withExistingMeta(
    createVoiceFilter("ESTILO", 3, "FILTRO EMOCIONAL", "Filtro por faixa de estilo vocal.", estiloItems),
    existingFiltersByKey,
    "ESTILO",
    3
  )

  return [regionFilter, idiomaFilter, estiloFilter]
}

const normalizeDraftContent = (fromStorage: AdminContent, fallback: AdminContent): AdminContent => {
  const normalizeTalentAssignments = (content: AdminContent): AdminContent => {
    const knownRegions = new Set(["NORTE", "NORDESTE", "SUDESTE", "SUL", "CENTRO OESTE", "CENTROOESTE"])
    const isGenderToken = (value: string) => {
      const key = normalizeLookup(value)
      return key === "MASCULINA" || key === "FEMININA" || key === "MASCULINO" || key === "FEMININO"
    }
    const hasIdiomaTerm = (groups: string[][]) =>
      groups.some((group) => group.some((part) => !isGenderToken(part)))

    const talents = content.section07?.talents ?? []
    return {
      ...content,
      section07: {
        ...content.section07,
        talents: talents.map((talent) => {
          const normalizedAssignments = Object.fromEntries(
            Object.entries(talent.assignments ?? {}).map(([key, value]) => {
              if (!value) return [key, []]
              const asAny = value as unknown
              if (Array.isArray(asAny) && asAny.length > 0 && Array.isArray(asAny[0])) {
                return [key, asAny]
              }
              return [key, [asAny]]
            })
          )
          const cleanedRegionGroups = ((normalizedAssignments.REGIAO as string[][] | undefined) ?? []).filter((path) =>
            path.some((part) => !isGenderToken(part))
          )
          if (cleanedRegionGroups.length > 0) normalizedAssignments.REGIAO = cleanedRegionGroups
          else delete normalizedAssignments.REGIAO

          const idiomaGroups = [
            ...((normalizedAssignments.IDIOMAS as string[][] | undefined) ?? []),
            ...((normalizedAssignments.IDIOMA as string[][] | undefined) ?? []),
          ]
          if (hasIdiomaTerm(idiomaGroups)) {
            const regionGroups = ((normalizedAssignments.REGIAO as string[][] | undefined) ?? []).filter((path) => {
              const regionTerm = path.find((part) => !isGenderToken(part)) ?? ""
              const normalizedRegion = normalizeLookup(regionTerm)
              return knownRegions.has(normalizedRegion)
            })
            if (regionGroups.length > 0) normalizedAssignments.REGIAO = regionGroups
            else delete normalizedAssignments.REGIAO
          }
          return { ...talent, assignments: normalizedAssignments }
        }),
      },
    }
  }

  return normalizeTalentAssignments({
    ...fromStorage,
    hero: {
      ...fallback.hero,
      ...fromStorage.hero,
      variants: normalizeHeroVariants(fromStorage.hero?.variants, fallback.hero.variants),
    },
    section04: {
      ...fromStorage.section04,
      filters: buildCanonicalSection04Filters(fromStorage.section04?.filters ?? fallback.section04.filters),
    },
    section05: fromStorage.section05 ?? buildEmptySection05Model(fallback),
    section07: fromStorage.section07 ?? fallback.section07,
  })
}

const createCanonicalFallbackContent = (): AdminContent => {
  const fallbackBase = createDefaultAdminContent()
  return {
    ...fallbackBase,
    section04: {
      ...fallbackBase.section04,
      filters: buildCanonicalSection04Filters(fallbackBase.section04.filters),
    },
  }
}

const normalizeAdminContent = (content: AdminContent): AdminContent => {
  const fallback = createCanonicalFallbackContent()
  return normalizeDraftContent(content, fallback)
}

const buildEmptySection05Model = (fallback: AdminContent): AdminContent["section05"] => ({
  ...fallback.section05,
  title: "TRABALHOS",
  text: "Trabalhamos com agências, produtoras de vídeo, videomakers e clientes finais para resolver áudio com qualidade e consistência.",
  brands: [],
  panels: [],
  audios: [],
})

const normalizeHeroVariants = (
  fromStorage: AdminContent["hero"]["variants"] | undefined,
  fallback: AdminContent["hero"]["variants"]
): AdminContent["hero"]["variants"] => {
  const stored = fromStorage ?? []
  if (!stored.length) return fallback

  const storedByPos = new Map(stored.map((entry) => [entry.pos, entry]))
  const fallbackByPos = new Map(fallback.map((entry) => [entry.pos, entry]))

  const merged = fallback.map((fallbackEntry) => {
    const storedEntry = storedByPos.get(fallbackEntry.pos)
    if (!storedEntry) return fallbackEntry
    return {
      ...fallbackEntry,
      ...storedEntry,
      animatedWords:
        Array.isArray(storedEntry.animatedWords) && storedEntry.animatedWords.length > 0
          ? storedEntry.animatedWords
          : fallbackEntry.animatedWords,
      modalBodyText: storedEntry.modalBodyText ?? fallbackEntry.modalBodyText ?? "",
      badgeResponsible: storedEntry.badgeResponsible ?? fallbackEntry.badgeResponsible ?? "",
      badgeAgency: storedEntry.badgeAgency ?? fallbackEntry.badgeAgency ?? "",
      badgeProdVideo: storedEntry.badgeProdVideo ?? fallbackEntry.badgeProdVideo ?? "",
      badgeProdAudio: storedEntry.badgeProdAudio ?? fallbackEntry.badgeProdAudio ?? "",
      badgeVoice: storedEntry.badgeVoice ?? fallbackEntry.badgeVoice ?? "",
      badgeOperator: storedEntry.badgeOperator ?? fallbackEntry.badgeOperator ?? "",
    }
  })

  const extras = stored.filter((entry) => !fallbackByPos.has(entry.pos))
  return [...merged, ...extras]
}

export const loadDraftContent = (): AdminContent => {
  const fallback = createCanonicalFallbackContent()
  const fromStorage = parseJson<AdminContent>(localStorage.getItem(ADMIN_DRAFT_KEY))
  if (!fromStorage) {
    return {
      ...fallback,
      section05: buildEmptySection05Model(fallback),
    }
  }
  return normalizeDraftContent(fromStorage, fallback)
}

export const saveDraftContent = (content: AdminContent) => {
  setLocalStorageWithDraftPriority(ADMIN_DRAFT_KEY, JSON.stringify(content))
}

export const loadVersions = (): ContentVersion[] => {
  const raw = parseJson<ContentVersion[]>(localStorage.getItem(ADMIN_VERSIONS_KEY)) ?? []
  return raw.map((entry) => ({
    ...entry,
    data_json: normalizeAdminContent(entry.data_json),
  }))
}

export const saveVersions = (versions: ContentVersion[]) => {
  const ordered = versions
    .slice()
    .sort((a, b) => {
      const byDate = new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      return byDate || b.version_number - a.version_number
    })
  const attempts = [ordered.slice(0, 5), ordered.slice(0, 2), ordered.slice(0, 1)]
  for (const attempt of attempts) {
    try {
      localStorage.setItem(ADMIN_VERSIONS_KEY, JSON.stringify(attempt.sort((a, b) => a.version_number - b.version_number)))
      return
    } catch (error) {
      if (!isStorageQuotaError(error)) throw error
    }
  }
  localStorage.removeItem(ADMIN_VERSIONS_KEY)
}

type DraftRow = {
  id: string
  data_json: AdminContent
  updated_at?: string
}

type PublishedSiteContentRow = {
  id: string
  status: "published"
  hero_json: unknown
  content_json: unknown
  version_number: number
  published_at: string
  published_by: string
  updated_at: string
  schema_version: number
}

const INTERNAL_PUBLIC_KEYS = new Set(["is_active", "deleted_at", "created_at", "updated_at", "order_index"])

const sanitizePublicValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value
      .filter((entry) => {
        if (!entry || typeof entry !== "object" || Array.isArray(entry)) return true
        const item = entry as { is_active?: boolean; deleted_at?: unknown }
        return item.is_active !== false && !item.deleted_at
      })
      .sort((a, b) => {
        const aOrder = a && typeof a === "object" && !Array.isArray(a) ? (a as { order_index?: number }).order_index : undefined
        const bOrder = b && typeof b === "object" && !Array.isArray(b) ? (b as { order_index?: number }).order_index : undefined
        if (typeof aOrder !== "number" || typeof bOrder !== "number") return 0
        return aOrder - bOrder
      })
      .map(sanitizePublicValue)
  }

  if (!value || typeof value !== "object") return value

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !INTERNAL_PUBLIC_KEYS.has(key))
      .map(([key, entryValue]) => [key, sanitizePublicValue(entryValue)])
  )
}

export const sanitizePublicContent = (content: AdminContent): unknown => sanitizePublicValue(content)

export const buildHeroJson = (content: AdminContent): unknown => sanitizePublicValue(content.hero)

export const loadDraftContentRemote = async (): Promise<AdminContent | null> => {
  if (!supabaseConfigured()) return null
  try {
    const rows = await restRequest<DraftRow[]>(ADMIN_DRAFTS_TABLE, "GET", {
      query: `select=id,data_json,updated_at&id=eq.${ADMIN_DRAFT_ROW_ID}&limit=1`,
    })
    if (!rows.length) {
      const fallback = createCanonicalFallbackContent()
      return {
        ...fallback,
        section05: buildEmptySection05Model(fallback),
      }
    }
    const fallback = createCanonicalFallbackContent()
    return normalizeDraftContent(rows[0].data_json, fallback)
  } catch (error) {
    console.error("Failed to load admin draft from Supabase", error)
    return null
  }
}

export const saveDraftContentRemote = async (content: AdminContent): Promise<boolean> => {
  if (!supabaseConfigured()) return true
  try {
    const updated = await restRequest<DraftRow[]>(ADMIN_DRAFTS_TABLE, "PATCH", {
      query: `id=eq.${ADMIN_DRAFT_ROW_ID}`,
      body: { data_json: content, updated_at: new Date().toISOString() },
    })
    if (updated.length) return true
    await restRequest<DraftRow[]>(ADMIN_DRAFTS_TABLE, "POST", {
      body: [{ id: ADMIN_DRAFT_ROW_ID, data_json: content, updated_at: new Date().toISOString() }],
    })
    return true
  } catch (error) {
    console.error("Failed to save admin draft to Supabase", error)
    return false
  }
}

export const loadVersionsRemote = async (): Promise<ContentVersion[] | null> => {
  if (!supabaseConfigured()) return null
  try {
    const versions = await restRequest<ContentVersion[]>(ADMIN_VERSIONS_TABLE, "GET", {
      query: "select=*&order=version_number.desc&limit=20",
    })
    return versions
      .map((entry) => ({
        ...entry,
        data_json: normalizeAdminContent(entry.data_json),
      }))
      .sort((a, b) => a.version_number - b.version_number)
  } catch (error) {
    console.error("Failed to load admin versions from Supabase", error)
    return null
  }
}

export const saveVersionRemote = async (version: ContentVersion): Promise<void> => {
  if (!supabaseConfigured()) return
  try {
    await restRequest<ContentVersion[]>(ADMIN_VERSIONS_TABLE, "POST", {
      body: [version],
    })
  } catch (error) {
    console.error("Failed to save admin version to Supabase", error)
    throw error
  }
}

export const savePublishedSiteContentRemote = async (version: ContentVersion, publishSecret: string): Promise<boolean> => {
  const timestamp = new Date().toISOString()
  const row: PublishedSiteContentRow = {
    id: ADMIN_DRAFT_ROW_ID,
    status: "published",
    hero_json: buildHeroJson(version.data_json),
    content_json: sanitizePublicContent(version.data_json),
    version_number: version.version_number,
    published_at: version.created_at,
    published_by: version.created_by,
    updated_at: timestamp,
    schema_version: 1,
  }

  try {
    const response = await fetch("/api/publish-site-content", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-publish-secret": publishSecret,
      },
      body: JSON.stringify({ row }),
    })
    return response.ok
  } catch (error) {
    console.error("Failed to save published site content through API route", error)
    return false
  }
}

export const getLatestPublished = (versions: ContentVersion[]): ContentVersion | null => {
  const published = versions.filter((entry) => entry.is_published)
  if (!published.length) return null
  return published.reduce((acc, current) => {
    const accTime = new Date(acc.created_at).getTime()
    const currentTime = new Date(current.created_at).getTime()
    if (currentTime > accTime) return current
    if (currentTime < accTime) return acc
    return current.version_number > acc.version_number ? current : acc
  })
}

export const loadAdminSession = (): AdminSession | null =>
  parseJson<AdminSession>(localStorage.getItem(ADMIN_SESSION_KEY))

export const saveAdminSession = (session: AdminSession) => {
  localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session))
}

export const clearAdminSession = () => {
  localStorage.removeItem(ADMIN_SESSION_KEY)
}
