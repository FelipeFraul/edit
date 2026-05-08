import { createClient } from "@supabase/supabase-js"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabaseAuthConfigured = () => Boolean(supabaseUrl && supabaseAnonKey)

export const supabaseAuth = supabaseAuthConfigured()
  ? createClient(supabaseUrl as string, supabaseAnonKey as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    })
  : null

export const signInAdminWithPassword = async (email: string, password: string) => {
  if (!supabaseAuth) throw new Error("Supabase Auth nao esta configurado.")
  const { data, error } = await supabaseAuth.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data.user
}

export const getCurrentAdminAuthUser = async () => {
  if (!supabaseAuth) return null
  const { data, error } = await supabaseAuth.auth.getUser()
  if (error) return null
  return data.user
}

export const signOutAdmin = async () => {
  if (!supabaseAuth) return
  await supabaseAuth.auth.signOut()
}
