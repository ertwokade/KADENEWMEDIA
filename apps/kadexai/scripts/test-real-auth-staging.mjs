import { execFileSync, spawn } from 'node:child_process'
import { randomUUID } from 'node:crypto'

const projectRef = process.argv[2]
const remoteBaseUrl = process.argv[3]
if (!/^[a-z]{20}$/.test(projectRef || '')) {
  console.error('Usage: node scripts/test-real-auth-staging.mjs <project-ref> [remote-base-url]')
  process.exit(1)
}
if (remoteBaseUrl && !/^https:\/\/[^/]+$/.test(remoteBaseUrl)) {
  console.error('Remote base URL must be an HTTPS origin without a path.')
  process.exit(1)
}

function execCli(command, options = {}) {
  if (process.platform === 'win32') {
    return execFileSync(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', command], options)
  }
  const [file, ...args] = command.split(' ')
  return execFileSync(file, args, options)
}

const keyDocument = JSON.parse(execCli(
  `npx.cmd --yes supabase@latest projects api-keys --project-ref ${projectRef}`,
  { encoding: 'utf8', windowsHide: true },
))
const anonKey = keyDocument.keys.find((entry) => entry.name === 'anon')?.api_key
const serviceKey = keyDocument.keys.find((entry) => entry.name === 'service_role')?.api_key
if (!anonKey || !serviceKey) throw new Error('Required staging API key types are unavailable.')

const baseUrl = `https://${projectRef}.supabase.co`
const password = `Kade!${randomUUID().replaceAll('-', '')}aA1`
const email = `kade-browser-${Date.now()}@example.test`
let userId
let server

async function admin(path, init = {}) {
  return fetch(`${baseUrl}/auth/v1/admin${path}`, {
    ...init,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
  })
}

async function waitForHealth(url) {
  const deadline = Date.now() + 45_000
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, { redirect: 'manual' })
      if (response.status === 200 && response.headers.get('content-type')?.includes('application/json')) return
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  throw new Error('Local staging server did not become healthy in time.')
}

try {
  const createResponse = await admin('/users', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: { name: 'KADE Browser E2E' },
    }),
  })
  if (!createResponse.ok) throw new Error(`Temporary browser user creation failed (${createResponse.status}).`)
  userId = (await createResponse.json()).id
  console.log('Temporary staging browser user created.')

  const directLogin = await fetch(`${baseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  console.log(`Direct Supabase password grant status: ${directLogin.status}.`)
  if (!directLogin.ok) throw new Error('Direct Supabase password grant failed for the temporary user.')

  if (remoteBaseUrl) {
    await new Promise((resolve) => setTimeout(resolve, 1_500))
    const remoteLogin = await fetch(`${remoteBaseUrl}/kadexai/api/auth/password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', email, password }),
    })
    console.log(`Remote application password endpoint status: ${remoteLogin.status}.`)
    if (!remoteLogin.ok) throw new Error('Remote application password endpoint rejected a valid Supabase user.')
  }

  const appEnv = {
    ...process.env,
    NEXT_PUBLIC_SUPABASE_URL: baseUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKey,
    NEXT_PUBLIC_BASE_PATH: '/kadexai',
    NEXT_PUBLIC_APP_URL: 'http://127.0.0.1:3100/kadexai',
    PORT: '3100',
    HOSTNAME: '127.0.0.1',
  }

  if (!remoteBaseUrl) {
    execCli('npm.cmd run build', { env: appEnv, stdio: 'inherit', windowsHide: true })
    server = spawn(process.execPath, ['scripts/start-standalone.mjs'], {
      env: appEnv,
      stdio: 'inherit',
      windowsHide: true,
    })
    await waitForHealth('http://127.0.0.1:3100/kadexai/api/health')
  }

  execCli('npx.cmd playwright test tests/e2e/real-auth.spec.ts --project=chromium', {
    env: {
      ...appEnv,
      E2E_BASE_URL: remoteBaseUrl || 'http://127.0.0.1:3100',
      E2E_REAL_EMAIL: email,
      E2E_REAL_PASSWORD: password,
    },
    stdio: 'inherit',
    windowsHide: true,
  })
  console.log(`Real browser auth flow passed (${remoteBaseUrl ? 'remote' : 'local'}).`)
} finally {
  if (server && !server.killed) {
    server.kill('SIGTERM')
    await new Promise((resolve) => setTimeout(resolve, 1_000))
  }
  if (userId) {
    const cleanup = await admin(`/users/${userId}`, { method: 'DELETE' })
    if (!cleanup.ok) throw new Error(`Temporary browser user cleanup failed (${cleanup.status}).`)
    console.log('Temporary staging browser user deleted.')
  }
}
