import { APP_BASE_PATH } from '@/lib/appConfig'

export const supabaseCookieOptions = {
  path: APP_BASE_PATH || '/',
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
}
