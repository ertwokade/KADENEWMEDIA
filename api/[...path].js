import auth from '../server/api/auth.js'
import blog from '../server/api/blog.js'
import customerAuth from '../server/api/customer-auth.js'
import customerPortal from '../server/api/customer-portal.js'
import customers from '../server/api/customers.js'
import shopier from '../server/api/shopier.js'
import calendarInvite from '../server/api/calendar-invite.js'
import chat from '../server/api/chat.js'
import client from '../server/api/client.js'
import contact from '../server/api/contact.js'
import content from '../server/api/content.js'
import crm from '../server/api/crm.js'
import linkProfiles from '../server/api/linkProfiles.js'
import media from '../server/api/media.js'
import messages from '../server/api/messages.js'
import notifications from '../server/api/notifications.js'
import ops from '../server/api/ops.js'
import partners from '../server/api/partners.js'
import proposals from '../server/api/proposals.js'
import referrals from '../server/api/referrals.js'
import reminders from '../server/api/reminders.js'
import seed from '../server/api/seed.js'
import shortLinks from '../server/api/shortLinks.js'
import sitemap from '../server/api/sitemap.js'
import subscriptions from '../server/api/subscriptions.js'
import surveys from '../server/api/surveys.js'
import tasks from '../server/api/tasks.js'
import users from '../server/api/users.js'
import { validateCsrf } from '../server/api/_lib/csrf.js'
import { validateQuery } from '../server/api/_lib/validation.js'
import { validateRequestBodySize } from '../server/api/_lib/requestLimits.js'

const handlers = {
  auth,
  blog,
  'customer-auth': customerAuth,
  'customer-portal': customerPortal,
  customers,
  shopier,
  'calendar-invite': calendarInvite,
  chat,
  client,
  contact,
  content,
  crm,
  linkprofiles: linkProfiles,
  media,
  messages,
  notifications,
  ops,
  partners,
  proposals,
  referrals,
  reminders,
  seed,
  shortlinks: shortLinks,
  sitemap,
  subscriptions,
  surveys,
  tasks,
  users,
}

function getRouteKey(req) {
  const queryPath = req.routePath ?? req.query?.path
  if (Array.isArray(queryPath)) return queryPath.join('/')
  if (typeof queryPath === 'string' && queryPath.length > 0) return queryPath

  const rawUrl = req.originalUrl || req.url || ''
  const pathOnly = rawUrl.split('?')[0]
  return pathOnly.replace(/^\/api\/?/, '').replace(/^\/+|\/+$/g, '')
}

function normalizeRoute(req) {
  const routeKey = getRouteKey(req)

  if (routeKey === 'auth/login') return 'auth'
  if (routeKey === 'auth/change-password') {
    req.query = { ...(req.query || {}), action: 'change-password' }
    return 'auth'
  }

  if (routeKey === 'newsletter') {
    req.query = { ...(req.query || {}), action: 'newsletter' }
    return 'contact'
  }

  return routeKey.split('/')[0]
}

// Public POST endpoints that don't require CSRF (no authenticated session)
const PUBLIC_ACTIONS = new Set([
  'newsletter', 'apply', 'analyzer-lead', 'submit',
])

function isPublicPost(req) {
  if (String(req.method || '').toUpperCase() !== 'POST') return false
  const route = normalizeRoute(req)
  const action = req.query?.action
  // Login starts an unauthenticated session and rotates the CSRF cookie after
  // successful authentication, so requiring a pre-existing CSRF cookie here can
  // lock admins out when the bootstrap cookie was dropped or expired.
  if (route === 'auth' && (!action || action === 'login')) return true
  // Customer register/login — unauthenticated by definition
  if (route === 'customer-auth' && (!action || action === 'login' || action === 'register')) return true
  // Shopier webhook — external POST with its own signature verification.
  // Admin reconciliation is intentionally excluded and uses cookie auth + CSRF.
  if (route === 'shopier' && !req.query?.action) return true
  // Public contact actions
  if (route === 'contact' && (!action || PUBLIC_ACTIONS.has(action))) return true
  // Public survey response
  if (route === 'surveys' && action === 'submit') return true
  return false
}

const ALLOWED_KEY_RE = /^[a-zA-Z0-9_-]{1,40}$/;

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0')
  res.setHeader('Pragma', 'no-cache')
  // Strip Vercel's internal routing param and any unrecognised keys
  // (Vercel's infrastructure may inject dotted or internal params that would fail validation)
  const rawQuery = req.query || {};
  req.routePath = rawQuery.path;
  const sanitizedQuery = {};
  for (const [key, value] of Object.entries(rawQuery)) {
    if (key !== 'path' && ALLOWED_KEY_RE.test(key)) {
      sanitizedQuery[key] = value;
    }
  }
  req.query = sanitizedQuery;

  if (!validateQuery(req, res)) return
  const route = normalizeRoute(req)
  if (!validateRequestBodySize(req, res, route)) return
  if (!isPublicPost(req) && !validateCsrf(req, res)) return

  const routeHandler = handlers[route]

  if (!routeHandler) {
    return res.status(404).json({ error: 'API endpoint not found' })
  }

  return routeHandler(req, res)
}
