import { CSRF_COOKIE_NAME, getCookie, setCsrfCookie, verifyCsrfToken } from './auth.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function isUnsafeMethod(method) {
  return !SAFE_METHODS.has(String(method || 'GET').toUpperCase());
}

export function issueCsrf(req, res) {
  const token = setCsrfCookie(req, res);
  return token;
}

export function validateCsrf(req, res) {
  if (!isUnsafeMethod(req.method)) return true;

  const headerToken =
    req.headers['x-csrf-token'] ||
    req.headers['x-xsrf-token'] ||
    req.headers['csrf-token'];
  const cookieToken = getCookie(req, CSRF_COOKIE_NAME);

  if (
    typeof headerToken !== 'string' ||
    typeof cookieToken !== 'string' ||
    headerToken !== cookieToken ||
    !verifyCsrfToken(headerToken)
  ) {
    res.status(403).json({ error: 'CSRF doğrulaması başarısız' });
    return false;
  }

  return true;
}

