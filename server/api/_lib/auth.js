import jwt from 'jsonwebtoken';
import crypto from 'crypto';

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
