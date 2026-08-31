import { readdir, readFile } from 'node:fs/promises'

const directory = new URL('../supabase/migrations/', import.meta.url)
const names = (await readdir(directory)).filter((name) => name.endsWith('.sql')).sort()
if (names.length < 4) throw new Error('Expected Supabase migrations are missing.')
if (new Set(names.map((name) => name.slice(0, 12))).size !== names.length) {
  throw new Error('Migration ordering prefix is duplicated.')
}

const files = await Promise.all(names.map(async (name) => ({ name, sql: await readFile(new URL(name, directory), 'utf8') })))
const finalRls = files.find(({ name }) => name.includes('explicit_rls_and_payments'))?.sql || ''
const finalGrants = files.find(({ name }) => name.includes('explicit_table_grants'))?.sql || ''

for (const table of ['profiles', 'workspaces', 'workspace_members', 'brands', 'user_preferences', 'integrations', 'tool_runs', 'content_calendar_items', 'content_templates', 'payment_orders', 'payment_events']) {
  const combined = `${finalRls}\n${finalGrants}`
  if (!combined.includes(`public.${table}`)) throw new Error(`Final migration coverage missing for ${table}.`)
}
if (/CREATE POLICY[^;]+FOR ALL/is.test(finalRls)) throw new Error('Final RLS migration contains a broad FOR ALL policy.')
if (!/REVOKE ALL ON public\.payment_events FROM anon, authenticated/i.test(finalRls)) throw new Error('Payment event client grants are not revoked.')
if (!/GRANT SELECT ON TABLE public\.payment_orders TO authenticated/i.test(finalGrants)) throw new Error('Payment order read grant is missing.')
if (!/REVOKE ALL ON TABLE[\s\S]+FROM anon/i.test(finalGrants)) throw new Error('Anonymous table access is not explicitly revoked.')

console.log(JSON.stringify({ migrations: names, result: 'PASS', liveApply: 'BLOCKED_BY_ENVIRONMENT' }, null, 2))
