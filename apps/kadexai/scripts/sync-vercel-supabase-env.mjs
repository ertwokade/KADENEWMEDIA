import { execFileSync, spawnSync } from 'node:child_process'

const [projectRef, environment = 'production'] = process.argv.slice(2)
if (!/^[a-z]{20}$/.test(projectRef || '')) {
  console.error('Usage: node scripts/sync-vercel-supabase-env.mjs <project-ref> [production|preview|development]')
  process.exit(1)
}
if (!['production', 'preview', 'development'].includes(environment)) {
  console.error('Invalid Vercel environment.')
  process.exit(1)
}

function runCmd(command, options = {}) {
  const result = spawnSync(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', command], {
    windowsHide: true,
    ...options,
  })
  if (result.status !== 0) throw new Error(`Command failed (${result.status}): ${command}`)
  return result
}

const keyJson = execFileSync(process.env.ComSpec || 'cmd.exe', [
  '/d', '/s', '/c', `npx.cmd --yes supabase@latest projects api-keys --project-ref ${projectRef}`,
], { encoding: 'utf8', windowsHide: true })
const keyDocument = JSON.parse(keyJson)
const anonKey = keyDocument.keys.find((entry) => entry.name === 'anon')?.api_key
const serviceKey = keyDocument.keys.find((entry) => entry.name === 'service_role')?.api_key
if (!anonKey || !serviceKey) throw new Error('Required Supabase API key types are unavailable.')

runCmd(
  `vercel.cmd env add NEXT_PUBLIC_SUPABASE_URL ${environment} --force --no-sensitive --value https://${projectRef}.supabase.co --yes`,
  { stdio: 'inherit' },
)
runCmd(
  `vercel.cmd env add NEXT_PUBLIC_SUPABASE_ANON_KEY ${environment} --force --no-sensitive --yes`,
  { input: Buffer.from(anonKey, 'utf8'), stdio: ['pipe', 'inherit', 'inherit'] },
)
if (environment === 'production') {
  runCmd(
    'vercel.cmd env add SUPABASE_SERVICE_ROLE_KEY production --force --sensitive --yes',
    { input: Buffer.from(serviceKey, 'utf8'), stdio: ['pipe', 'inherit', 'inherit'] },
  )
}

console.log(`Supabase environment synchronized to Vercel ${environment} without BOM.`)
