import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { requireServerConfigValue } from './runtime-config'

let cachedClient: SupabaseClient | null = null

export function getSupabaseAuthClient() {
  if (cachedClient) {
    return cachedClient
  }

  const url = requireServerConfigValue('supabaseUrl')
  const anonKey = requireServerConfigValue('supabaseAnonKey')

  cachedClient = createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false
    }
  })

  return cachedClient
}
