import auth from '../server/api/auth.js'
import blog from '../server/api/blog.js'
import calendarInvite from '../server/api/calendar-invite.js'
import chat from '../server/api/chat.js'
import client from '../server/api/client.js'
import contact from '../server/api/contact.js'
import content from '../server/api/content.js'
import crm from '../server/api/crm.js'
import media from '../server/api/media.js'
import messages from '../server/api/messages.js'
import notifications from '../server/api/notifications.js'
import ops from '../server/api/ops.js'
import partners from '../server/api/partners.js'
import proposals from '../server/api/proposals.js'
import referrals from '../server/api/referrals.js'
import reminders from '../server/api/reminders.js'
import seed from '../server/api/seed.js'
import subscriptions from '../server/api/subscriptions.js'
import surveys from '../server/api/surveys.js'
import tasks from '../server/api/tasks.js'
import users from '../server/api/users.js'
import { validateCsrf } from '../server/api/_lib/csrf.js'
import { validateQuery } from '../server/api/_lib/validation.js'

const handlers = {
  auth,
  blog,
  'calendar-invite': calendarInvite,
  chat,
  client,
  contact,
  content,
  crm,
  media,
  messages,
  notifications,
  ops,
  partners,
  proposals,
  referrals,
  reminders,
  seed,
  subscriptions,
  surveys,
  tasks,
  users,
}

function getRouteKey(req) {
  const queryPath = req.query?.path
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

export default async function handler(req, res) {
  if (!validateQuery(req, res)) return
  if (!validateCsrf(req, res)) return

  const route = normalizeRoute(req)
  const routeHandler = handlers[route]

  if (!routeHandler) {
    return res.status(404).json({ error: 'API endpoint not found' })
  }

  return routeHandler(req, res)
}
