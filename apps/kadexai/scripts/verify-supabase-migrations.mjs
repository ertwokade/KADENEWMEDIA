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
const publicRlsLockdown = files.find(({ name }) => name.includes('public_schema_rls_lockdown'))?.sql || ''
const securityInvokerViews = files.find(({ name }) => name.includes('security_invoker_views'))?.sql || ''
const functionExecutionLockdown = files.find(({ name }) => name.includes('function_execution_lockdown'))?.sql || ''
const privateRlsHelpers = files.find(({ name }) => name.includes('private_rls_helpers'))?.sql || ''

for (const table of ['profiles', 'workspaces', 'workspace_members', 'brands', 'user_preferences', 'integrations', 'tool_runs', 'content_calendar_items', 'content_templates', 'payment_orders', 'payment_events']) {
  const combined = `${finalRls}\n${finalGrants}`
  if (!combined.includes(`public.${table}`)) throw new Error(`Final migration coverage missing for ${table}.`)
}
if (/CREATE POLICY[^;]+FOR ALL/is.test(finalRls)) throw new Error('Final RLS migration contains a broad FOR ALL policy.')
if (!/REVOKE ALL ON public\.payment_events FROM anon, authenticated/i.test(finalRls)) throw new Error('Payment event client grants are not revoked.')
if (!/GRANT SELECT ON TABLE public\.payment_orders TO authenticated/i.test(finalGrants)) throw new Error('Payment order read grant is missing.')
if (!/REVOKE ALL ON TABLE[\s\S]+FROM anon/i.test(finalGrants)) throw new Error('Anonymous table access is not explicitly revoked.')
if (!/namespace\.nspname = 'public'/i.test(publicRlsLockdown)) throw new Error('Public schema RLS lockdown migration is missing.')
if (!/relation\.relkind IN \('r', 'p'\)/i.test(publicRlsLockdown)) throw new Error('RLS lockdown does not cover base and partitioned tables.')
if (!/ALTER TABLE %I\.%I ENABLE ROW LEVEL SECURITY/i.test(publicRlsLockdown)) throw new Error('RLS lockdown does not enable row-level security.')
if (!/RAISE EXCEPTION 'RLS lockdown failed/i.test(publicRlsLockdown)) throw new Error('RLS lockdown does not fail closed.')
if (!/ALTER VIEW public\.active_entitlements[\s\S]+security_invoker\s*=\s*true/i.test(securityInvokerViews)) {
  throw new Error('Active entitlements view is not configured as a security invoker.')
}
for (const signature of [
  'is_workspace_member\\(UUID\\)',
  'can_manage_workspace\\(UUID\\)',
  'handle_kadexai_new_user\\(\\)',
  'kade_unique_workspace_slug\\(TEXT, UUID\\)',
  'kade_set_updated_at\\(\\)',
]) {
  const revoke = new RegExp(`REVOKE ALL ON FUNCTION public\\.${signature}[\\s\\S]+FROM PUBLIC, anon, authenticated`, 'i')
  if (!revoke.test(functionExecutionLockdown)) throw new Error(`Function privilege lockdown missing for ${signature}.`)
}
if (!/GRANT EXECUTE ON FUNCTION public\.is_workspace_member\(UUID\) TO authenticated/i.test(functionExecutionLockdown)) {
  throw new Error('Workspace membership helper is not granted to signed-in users.')
}
if (!/GRANT EXECUTE ON FUNCTION public\.can_manage_workspace\(UUID\) TO authenticated/i.test(functionExecutionLockdown)) {
  throw new Error('Workspace management helper is not granted to signed-in users.')
}
if (!/ALTER FUNCTION public\.kade_set_updated_at\(\) SET search_path = ''/i.test(functionExecutionLockdown)) {
  throw new Error('Updated-at trigger function does not use an immutable search path.')
}
for (const signature of ['is_workspace_member\\(UUID\\)', 'can_manage_workspace\\(UUID\\)']) {
  if (!new RegExp(`ALTER FUNCTION public\\.${signature} SET SCHEMA private`, 'i').test(privateRlsHelpers)) {
    throw new Error(`Public RLS helper is not moved to the private schema: ${signature}.`)
  }
  if (!new RegExp(`GRANT EXECUTE ON FUNCTION private\\.${signature} TO authenticated`, 'i').test(privateRlsHelpers)) {
    throw new Error(`Private RLS helper is not available to signed-in users: ${signature}.`)
  }
}
if (!/REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated/i.test(privateRlsHelpers)) {
  throw new Error('Private helper schema is not locked down.')
}

console.log(JSON.stringify({ migrations: names, result: 'PASS', liveApply: 'BLOCKED_BY_ENVIRONMENT' }, null, 2))
