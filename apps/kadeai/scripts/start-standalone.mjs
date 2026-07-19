import { cpSync, existsSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { join } from 'node:path'
import nextEnv from '@next/env'
import { validateProductionEnvironment } from './validate-env.mjs'

const { loadEnvConfig } = nextEnv

const root = process.cwd()
const standalone = join(root, '.next', 'standalone')

// The generated standalone server runs outside the Next CLI, so load the same
// server-only .env files explicitly. Existing process variables keep priority.
loadEnvConfig(root, false)
validateProductionEnvironment()

if (!existsSync(join(standalone, 'server.js'))) {
  console.error('Standalone üretim derlemesi bulunamadı. Önce `npm run build` çalıştırın.')
  process.exit(1)
}

for (const [source, target] of [
  [join(root, 'public'), join(standalone, 'public')],
  [join(root, '.next', 'static'), join(standalone, '.next', 'static')],
]) {
  if (existsSync(source)) cpSync(source, target, { recursive: true, force: true })
}

const child = spawn(process.execPath, [join(standalone, 'server.js')], {
  cwd: standalone,
  env: process.env,
  stdio: 'inherit',
})

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => child.kill(signal))
}

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal)
  else process.exit(code ?? 1)
})
