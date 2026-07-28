import { z } from 'zod';

const stringValue = z.string().max(1000);
const querySchema = z.record(
  z.string().regex(/^[a-zA-Z0-9_-]{1,40}$/),
  z.union([stringValue, z.array(stringValue).max(20)])
);

const allowedActions = new Set([
  'active-visitors', 'activity', 'ai-usage', 'analytics', 'analyzer-lead',
  'apply', 'change-password', 'check', 'click', 'csrf', 'file', 'ga4', 'heartbeat',
  'login', 'logout', 'newsletter', 'notes', 'pageview', 'reply',
  'send-invite', 'send-newsletter', 'sitemap', 'smtp-test', 'submit',
  'subscribers', 'session', 'unsubscribe',
  // Customer portal & Shopier
  'register', 'packages', 'add-package', 'remove-package', 'update-package', 'update-status',
]);

const allowedResources = new Set([
  'backup', 'client-errors', 'customer-profiles', 'email-templates',
  'invoices', 'onboarding', 'proposals', 'push', 'quotes',
  'subscriptions', 'surveys', 'tasks',
]);

// Geçiş döneminde bazı eski kayıtlar 24 karakterlik Mongo ObjectId, güncel
// Supabase tabloları ise UUID kullanıyor. Dispatcher yalnız ObjectId kabul
// ettiğinde handler'a ulaşmadan bütün UUID tabanlı DELETE istekleri 400 ile
// kesiliyordu (blog, partner, link profili, kısa link vb.).
const MONGO_ID_RE = /^[a-fA-F0-9]{24}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidQueryId(value) {
  return typeof value === 'string' && (MONGO_ID_RE.test(value) || UUID_RE.test(value));
}

function first(value) {
  return Array.isArray(value) ? value[0] : value;
}

export function validateQuery(req, res) {
  const query = req.query || {};
  const parsed = querySchema.safeParse(query);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid query parameter' });
    return false;
  }

  const totalLength = Object.entries(query).reduce((sum, [key, value]) => {
    const values = Array.isArray(value) ? value : [value];
    return sum + key.length + values.reduce((inner, item) => inner + String(item || '').length, 0);
  }, 0);
  if (totalLength > 8000 || Object.keys(query).length > 30) {
    res.status(400).json({ error: 'Query parameters are too long' });
    return false;
  }

  const id = first(query.id);
  if (id && !isValidQueryId(id)) {
    res.status(400).json({ error: 'Invalid ID' });
    return false;
  }

  const action = first(query.action);
  if (action && !allowedActions.has(action)) {
    res.status(400).json({ error: 'Invalid action parameter' });
    return false;
  }

  const resource = first(query.resource);
  if (resource && !allowedResources.has(resource)) {
    res.status(400).json({ error: 'Invalid resource parameter' });
    return false;
  }

  const period = first(query.period);
  if (period && !['day', 'week', 'month', 'quarter', '30d', '90d'].includes(period)) {
    res.status(400).json({ error: 'Invalid period parameter' });
    return false;
  }

  return true;
}
