const readBody = async (req) => {
  if (req.body) return typeof req.body === "string" ? JSON.parse(req.body) : req.body

  const chunks = []
  for await (const chunk of req) chunks.push(Buffer.from(chunk))
  const raw = Buffer.concat(chunks).toString("utf8")
  return raw ? JSON.parse(raw) : null
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST")
    return res.status(405).json({ error: "Method not allowed" })
  }

  const supabaseUrl = process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const publishSecret = process.env.ADMIN_PUBLISH_SECRET
  const providedSecret = req.headers["x-admin-publish-secret"]

  if (!supabaseUrl || !serviceRoleKey || !publishSecret) {
    return res.status(500).json({ error: "Publish endpoint is not configured" })
  }

  if (providedSecret !== publishSecret) {
    return res.status(401).json({ error: "Unauthorized" })
  }

  let body
  try {
    body = await readBody(req)
  } catch {
    return res.status(400).json({ error: "Invalid JSON body" })
  }

  const row = body?.row
  if (!row || row.id !== "default" || !row.hero_json || !row.content_json) {
    return res.status(400).json({ error: "Invalid published content payload" })
  }

  const payload = {
    id: "default",
    status: row.status === "published" ? "published" : "published",
    hero_json: row.hero_json,
    content_json: row.content_json,
    version_number: row.version_number ?? null,
    published_at: row.published_at,
    published_by: row.published_by ?? null,
    updated_at: row.updated_at,
    content_hash: row.content_hash ?? null,
    schema_version: row.schema_version ?? 1,
  }

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/published_site_content?on_conflict=id`, {
      method: "POST",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify([payload]),
    })

    if (!response.ok) {
      return res.status(502).json({ error: "Failed to save published content" })
    }

    return res.status(200).json({ ok: true })
  } catch {
    return res.status(502).json({ error: "Failed to reach Supabase" })
  }
}
