const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

const hasConfig = Boolean(supabaseUrl && supabaseAnonKey)

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE"

type RequestOptions = {
  query?: string
  body?: unknown
  jwt?: string
}

const buildHeaders = (jwt?: string) => {
  const headers: Record<string, string> = {
    apikey: supabaseAnonKey ?? "",
    Authorization: `Bearer ${jwt ?? supabaseAnonKey ?? ""}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  }
  return headers
}

export const supabaseConfigured = () => hasConfig

export const restRequest = async <T>(
  table: string,
  method: HttpMethod,
  options: RequestOptions = {}
): Promise<T> => {
  if (!hasConfig || !supabaseUrl) throw new Error("Supabase env vars are missing")
  const query = options.query ? `?${options.query}` : ""
  const response = await fetch(`${supabaseUrl}/rest/v1/${table}${query}`, {
    method,
    headers: buildHeaders(options.jwt),
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Supabase request failed (${response.status}): ${detail}`)
  }
  if (response.status === 204) return [] as T
  return (await response.json()) as T
}

