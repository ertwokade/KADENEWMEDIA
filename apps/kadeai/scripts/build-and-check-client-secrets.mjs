import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'

const canaries = {
  SECRET_CANARY_ROOT: 'audit-root-server-canary-7d4f4f1a',
  SECRET_CANARY_KADEAI: 'audit-kadeai-server-canary-9a2e6c3b',
  SECRET_CANARY_FASTAPI: 'audit-fastapi-server-canary-5c8b1d7e',
}
const environment = {
  ...process.env,
  ...canaries,
  JWT_SECRET: canaries.SECRET_CANARY_ROOT,
  OPENAI_API_KEY: canaries.SECRET_CANARY_KADEAI,
  KADE_BACKEND_TOKEN: canaries.SECRET_CANARY_FASTAPI,
}

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, env: environment, stdio: 'inherit' })
  if (result.status !== 0) process.exit(result.status ?? 1)
}

const root = resolve(process.cwd(), '..', '..')
run('npm', ['run', 'legacy:build'], root)
run('npm', ['run', 'build'], process.cwd())
run(process.execPath, ['scripts/check-client-secrets.mjs'], process.cwd())
