import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { requireServerConfigValue } from './runtime-config'

let cachedClient: SupabaseClient | null = null

/**
 * The browser never talks to Supabase directly in this MVP. Every database and
 * storage operation goes through the service role client below.
 */
export function getSupabaseAdminClient() {
  if (cachedClient) {
    return cachedClient
  }

  const url = requireServerConfigValue('supabaseUrl')
  const serviceRoleKey = requireServerConfigValue('supabaseServiceRoleKey')

  cachedClient = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  return cachedClient
}
