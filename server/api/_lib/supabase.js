import { createClient } from '@supabase/supabase-js';

let client = null;

export function getSupabase() {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY ortam değişkenleri tanımlı değil. Vercel Dashboard > Settings > Environment Variables kısmından ayarlayın.');
  }

  client = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return client;
}

// PostgREST hata kodları — MongoDB'deki error.code karşılıkları.
export const PG_UNIQUE_VIOLATION = '23505';
export const PG_FOREIGN_KEY_VIOLATION = '23503';

export function isUniqueViolation(error) {
  return error?.code === PG_UNIQUE_VIOLATION;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUuid(id) {
  return typeof id === 'string' && UUID_RE.test(id);
}

// `.single()` sonucu satır bulunamazsa Supabase PGRST116 döner — 404 olarak ele alınmalı,
// gerçek bir sunucu hatası değil.
export const PG_NOT_FOUND = 'PGRST116';

export function isNotFound(error) {
  return error?.code === PG_NOT_FOUND;
}

export default getSupabase;
