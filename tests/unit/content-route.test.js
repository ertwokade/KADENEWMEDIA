import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import { publicStats } from '../../server/api/_lib/public-content.js'

// Execute the real handler with isolated DB/auth/network dependencies.
function setup({ permitted = false, reportFails = false, tokenFails = false, configured = false, placeholder = false } = {}) {
  const calls = [];
  const networkCalls = [];
  const builder = {
    select() { return this; }, eq() { return this; },
    async maybeSingle() { return { data: { data: { notes: 'private', rakamlar: [{ sayi: 0, etiket: 'Kampanya' }] } } }; },
  };
  const code = readFileSync(new URL('../../server/api/content.js', import.meta.url), 'utf8')
    .replace(/^import .*;\r?$/gm, '').replace(/export default /g, '').replace(/export /g, '');
  const context = vm.createContext({
    publicStats, URL, console: { error() {} },
    process: { env: configured
      ? {
          GA4_PROPERTY_ID: placeholder ? '123456789' : '987654321',
          GA4_CLIENT_EMAIL: placeholder ? 'service-account@example-project.iam.gserviceaccount.com' : 'analytics-reader@kade-production.iam.gserviceaccount.com',
          GA4_PRIVATE_KEY: placeholder
            ? '-----BEGIN PRIVATE KEY-----\\nREPLACE_ME\\n-----END PRIVATE KEY-----'
            : `-----BEGIN PRIVATE KEY-----\\n${'a'.repeat(120)}\\n-----END PRIVATE KEY-----`,
        }
      : {} },
    jwt: { sign: () => 'test-jwt' }, cors: () => false,
    getSupabase: () => ({ from(table) { calls.push(table); return builder; } }),
    requirePermission: async (_req, res) => { if (!permitted) res.status(401).json({ error: 'Giriş gerekli' }); return permitted; },
    fetch: async url => {
      networkCalls.push(url);
      if (url.includes('oauth2')) return tokenFails ? Response.json({}, { status: 401 }) : Response.json({ access_token: 'test-token', expires_in: 3600 });
      return reportFails ? Response.json({ error: 'private provider detail' }, { status: 503 }) : Response.json({ rows: [] });
    },
  });
  vm.runInContext(code, context);
  return { calls, networkCalls, async request(query, method = 'GET') {
    const res = { statusCode: 200, body: null, status(code) { this.statusCode = code; return this; }, json(data) { this.body = JSON.parse(JSON.stringify(data)); return this; } };
    await context.handler({ method, query, body: { section: 'nedenBiz', data: {} } }, res);
    return res;
  } };
}

test('anonymous stats projection exposes only published stat fields', async () => {
  const { request } = setup();
  const res = await request({ section: 'nedenBiz', view: 'public-stats' });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body.data, { rakamlar: [{ sayi: '0', etiket: 'Kampanya', ikon: '' }] });
});

test('public-stats flag cannot bypass private section, full listing or write guards', async () => {
  const { request, calls } = setup();
  for (const section of ['nedenBiz', 'calendar', 'site-settings', undefined]) {
    const res = await request({ section, ...(section === 'nedenBiz' ? {} : { view: 'public-stats' }) });
    assert.equal(res.statusCode, 401);
  }
  assert.equal((await request({ section: 'nedenBiz', view: 'public-stats' }, 'PUT')).statusCode, 401);
  assert.deepEqual(calls, []);
});

test('failed GA4 report or token cannot become successful zero analytics', async () => {
  for (const failures of [{ reportFails: true }, { tokenFails: true }]) {
    const res = await setup({ permitted: true, configured: true, ...failures }).request({ action: 'ga4' });
    assert.equal(res.statusCode, 500);
    assert.equal(res.body.totalVisits, undefined);
    assert.doesNotMatch(JSON.stringify(res.body), /private provider/);
  }
});

test('unconfigured GA4 and real empty GA4 results remain distinct', async () => {
  const missing = await setup({ permitted: true }).request({ action: 'ga4' });
  assert.equal(missing.body.configured, false);
  const empty = await setup({ permitted: true, configured: true }).request({ action: 'ga4' });
  assert.equal(empty.statusCode, 200);
  assert.equal(empty.body.configured, true);
  assert.equal(empty.body.totalVisits, 0);
});

test('GA4 placeholder values are treated as unconfigured without contacting Google', async () => {
  const app = setup({ permitted: true, configured: true, placeholder: true });
  const res = await app.request({ action: 'ga4' });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.configured, false);
  assert.deepEqual(app.networkCalls, []);
});
