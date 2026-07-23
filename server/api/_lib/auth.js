import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { getSupabase, isValidUuid, isNotFound } from './supabase.js';

export const AUTH_COOKIE_NAME = 'kade_admin_session';
export const CSRF_COOKIE_NAME = 'kade_csrf';
const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;

function getSecret() {
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32) return process.env.JWT_SECRET;
  throw new Error('JWT_SECRET environment variable must be set to a random value of at least 32 characters');
}

export function createToken(payload) {
  return jwt.sign(payload, getSecret(), { expiresIn: `${SESSION_MAX_AGE_SECONDS}s` });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, getSecret());
  } catch {
    return null;
  }
}

function parseCookieHeader(header) {
  return String(header || '')
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((cookies, part) => {
      const eq = part.indexOf('=');
      if (eq === -1) return cookies;
      const key = part.slice(0, eq);
      const value = part.slice(eq + 1);
      try {
        cookies[key] = decodeURIComponent(value);
      } catch {
        cookies[key] = value;
      }
      return cookies;
    }, {});
}

export function getCookie(req, name) {
  return parseCookieHeader(req.headers?.cookie)[name] || null;
}

function appendSetCookie(res, cookie) {
  const existing = res.getHeader?.('Set-Cookie');
  if (!existing) {
    res.setHeader('Set-Cookie', cookie);
  } else if (Array.isArray(existing)) {
    res.setHeader('Set-Cookie', [...existing, cookie]);
  } else {
    res.setHeader('Set-Cookie', [existing, cookie]);
  }
}

function shouldUseSecureCookie(req) {
  const forwardedProto = String(req.headers?.['x-forwarded-proto'] || '').split(',')[0].trim();
  if (forwardedProto) return forwardedProto === 'https';

  const host = String(req.headers?.host || '').split(':')[0].toLowerCase();
  if (host === 'localhost' || host === '127.0.0.1' || host === '::1') return false;

  return process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
}

function serializeCookie(req, name, value, options = {}) {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    'Path=/',
    `Max-Age=${options.maxAge ?? SESSION_MAX_AGE_SECONDS}`,
    'SameSite=Strict',
  ];
  if (options.httpOnly) parts.push('HttpOnly');
  if (shouldUseSecureCookie(req)) parts.push('Secure');
  return parts.join('; ');
}

function clearCookie(req, name, httpOnly = false) {
  return serializeCookie(req, name, '', { maxAge: 0, httpOnly });
}

function signCsrfNonce(nonce) {
  return crypto.createHmac('sha256', getSecret()).update(nonce).digest('hex');
}

export function createCsrfToken() {
  const nonce = crypto.randomBytes(32).toString('hex');
  return `${nonce}.${signCsrfNonce(nonce)}`;
}

export function verifyCsrfToken(token) {
  if (typeof token !== 'string') return false;
  const [nonce, signature] = token.split('.');
  if (!nonce || !signature || !/^[a-f0-9]{64}$/i.test(nonce) || !/^[a-f0-9]{64}$/i.test(signature)) {
    return false;
  }
  const expected = signCsrfNonce(nonce);
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

export function setAuthCookies(req, res, token, csrfToken = createCsrfToken()) {
  appendSetCookie(res, serializeCookie(req, AUTH_COOKIE_NAME, token, { httpOnly: true }));
  appendSetCookie(res, serializeCookie(req, CSRF_COOKIE_NAME, csrfToken, { httpOnly: false }));
  return csrfToken;
}

export function setCsrfCookie(req, res, csrfToken = createCsrfToken()) {
  appendSetCookie(res, serializeCookie(req, CSRF_COOKIE_NAME, csrfToken, { httpOnly: false, maxAge: 24 * 60 * 60 }));
  return csrfToken;
}

export function clearAuthCookies(req, res) {
  appendSetCookie(res, clearCookie(req, AUTH_COOKIE_NAME, true));
  appendSetCookie(res, clearCookie(req, CSRF_COOKIE_NAME, false));
}

export function getTokenFromRequest(req) {
  const cookieToken = getCookie(req, AUTH_COOKIE_NAME);
  if (cookieToken) return cookieToken;
  return null;
}

export function requireAuth(req) {
  const token = getTokenFromRequest(req);
  if (!token) {
    return null;
  }
  return verifyToken(token);
}

const DEFAULT_ROLE_PERMISSIONS = {
  admin: {
    dashboard: true,
    analytics: true,
    blog: true,
    content: true,
    partners: true,
    portfolio: true,
    linkProfiles: true,
    shortLinks: true,
    messages: true,
    calendar: true,
    reminders: true,
    users: true,
    settings: true,
    activity: true,
    systemHealth: true,
    backup: true,
    media: true,
    crm: true,
    proposals: true,
    quoteLeads: true,
    portalCustomers: true,
    customerProfiles: true,
    invoices: true,
    coupons: true,
    tasks: true,
    subscriptions: true,
    surveys: true,
    referrals: true,
    onboarding: true,
    report: true,
    emailTemplates: true,
    aiContent: true,
  },
  editor: {
    dashboard: true,
    analytics: true,
    blog: true,
    content: true,
    partners: true,
    portfolio: true,
    linkProfiles: true,
    shortLinks: true,
    messages: true,
    calendar: true,
    reminders: true,
    users: false,
    settings: false,
    activity: true,
    systemHealth: false,
    backup: false,
    media: true,
    crm: true,
    proposals: true,
    quoteLeads: true,
    portalCustomers: true,
    customerProfiles: true,
    invoices: true,
    coupons: true,
    tasks: true,
    subscriptions: true,
    surveys: true,
    referrals: true,
    onboarding: true,
    report: true,
    emailTemplates: true,
    aiContent: true,
  },
  viewer: {
    dashboard: true,
    analytics: true,
    blog: false,
    content: false,
    partners: false,
    portfolio: false,
    linkProfiles: false,
    shortLinks: false,
    messages: true,
    calendar: false,
    reminders: false,
    users: false,
    settings: false,
    activity: false,
    systemHealth: false,
    backup: false,
    media: false,
    crm: false,
    proposals: false,
    quoteLeads: false,
    portalCustomers: false,
    customerProfiles: false,
    invoices: false,
    coupons: false,
    tasks: false,
    subscriptions: false,
    surveys: false,
    referrals: false,
    onboarding: false,
    report: false,
    emailTemplates: false,
    aiContent: false,
  },
};

export function getDefaultPermissions(role = 'viewer') {
  return { ...(DEFAULT_ROLE_PERMISSIONS[role] || DEFAULT_ROLE_PERMISSIONS.viewer) };
}

export function sessionVersionMatches(tokenVersion, storedVersion) {
  return Number(tokenVersion || 0) === Number(storedVersion || 0);
}

function hasPermission(user, permission, { write = false } = {}) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (write && user.role === 'viewer') return false;

  const permissions = Array.isArray(permission) ? permission : [permission];
  const defaults = getDefaultPermissions(user.role);
  return permissions.some((key) => {
    if (!key) return false;
    if (typeof user.permissions?.[key] === 'boolean') return user.permissions[key];
    return defaults[key] === true;
  });
}

export async function getAuthorizedUser(req) {
  const sessionUser = requireAuth(req);
  if (!sessionUser) return null;

  const supabase = getSupabase();
  let query = supabase
    .from('kade_users')
    .select('id, username, email, role, permissions, session_version, created_at, updated_at');

  if (isValidUuid(sessionUser.id)) {
    query = query.eq('id', sessionUser.id);
  } else if (sessionUser.username) {
    query = query.eq('username', sessionUser.username);
  } else {
    return null;
  }

  const { data: dbUser, error } = await query.maybeSingle();
  if (error && !isNotFound(error)) throw error;
  if (!dbUser) return null;
  if (!sessionVersionMatches(sessionUser.sessionVersion, dbUser.session_version)) return null;

  return {
    ...sessionUser,
    ...dbUser,
    id: dbUser.id,
    username: dbUser.username || sessionUser.username,
    role: dbUser.role || sessionUser.role || 'viewer',
    permissions: dbUser.permissions || getDefaultPermissions(dbUser.role || sessionUser.role || 'viewer'),
  };
}

export async function requirePermission(req, res, permission, options = {}) {
  const user = await getAuthorizedUser(req);
  if (!user) {
    res.status(401).json({ error: 'Yetkisiz erişim' });
    return null;
  }
  if (!hasPermission(user, permission, options)) {
    res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
    return null;
  }
  return user;
}

export async function requireAdmin(req, res) {
  const user = await getAuthorizedUser(req);
  if (!user) {
    res.status(401).json({ error: 'Yetkisiz erişim' });
    return null;
  }
  if (user.role !== 'admin') {
    res.status(403).json({ error: 'Bu işlem için admin yetkisi gerekli' });
    return null;
  }
  return user;
}
