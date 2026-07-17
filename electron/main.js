const { app, BrowserWindow, shell, ipcMain, dialog, safeStorage } = require('electron')
const path = require('path')
const { spawn } = require('child_process')
const fs = require('fs')

const PORT = 3100
let mainWindow
let serverProcess
let serverReady = false
const ALLOWED_CONFIG_KEYS = new Set([
  'GROQ_API_KEY',
  'OPENROUTER_API_KEY',
  'CEREBRAS_API_KEY',
  'MISTRAL_API_KEY',
  'ANTHROPIC_API_KEY',
  'OPENAI_API_KEY',
  'GEMINI_API_KEY',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
])

// ─── Config (API keys stored in userData) ─────────────────────────────────────
function getConfigPath() {
  return path.join(app.getPath('userData'), 'config.json')
}

function loadConfig() {
  try {
    const raw = fs.readFileSync(getConfigPath(), 'utf8')
    const parsed = JSON.parse(raw)
    if (parsed?.version === 1 && parsed?.encrypted && typeof parsed.encrypted === 'object') {
      if (!safeStorage.isEncryptionAvailable()) return {}
      return Object.fromEntries(
        Object.entries(parsed.encrypted).flatMap(([key, value]) => {
          if (!ALLOWED_CONFIG_KEYS.has(key) || typeof value !== 'string') return []
          try {
            return [[key, safeStorage.decryptString(Buffer.from(value, 'base64'))]]
          } catch {
            return []
          }
        })
      )
    }

    // One-time migration from the legacy plaintext format.
    const legacy = Object.fromEntries(
      Object.entries(parsed || {}).filter(([key, value]) => ALLOWED_CONFIG_KEYS.has(key) && typeof value === 'string')
    )
    if (Object.keys(legacy).length && safeStorage.isEncryptionAvailable()) saveConfig(legacy)
    return legacy
  } catch {
    return {}
  }
}

function saveConfig(data) {
  if (!safeStorage.isEncryptionAvailable()) throw new Error('Secure storage is unavailable')
  const encrypted = Object.fromEntries(
    Object.entries(data).flatMap(([key, value]) => {
      if (!ALLOWED_CONFIG_KEYS.has(key) || typeof value !== 'string' || !value) return []
      return [[key, safeStorage.encryptString(value).toString('base64')]]
    })
  )
  fs.writeFileSync(getConfigPath(), JSON.stringify({ version: 1, encrypted }, null, 2), { mode: 0o600 })
}

// ─── Next.js Standalone Server ────────────────────────────────────────────────
function resolveAppRoot() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'app')
  }
  return path.join(__dirname, '..')
}

function spawnNextServer() {
  const appRoot = resolveAppRoot()
  const serverScript = path.join(appRoot, '.next', 'standalone', 'server.js')

  if (!fs.existsSync(serverScript)) {
    dialog.showErrorBox(
      'Build Eksik',
      'Next.js build bulunamadı. Terminalde "npm run build" çalıştırın.'
    )
    app.quit()
    return
  }

  const config = loadConfig()
  const env = {
    ...process.env,
    PORT: String(PORT),
    NODE_ENV: 'production',
    HOSTNAME: '127.0.0.1',
    // Inject stored API keys
    ...(config.ANTHROPIC_API_KEY && { ANTHROPIC_API_KEY: config.ANTHROPIC_API_KEY }),
    ...(config.OPENAI_API_KEY && { OPENAI_API_KEY: config.OPENAI_API_KEY }),
    ...(config.GEMINI_API_KEY && { GEMINI_API_KEY: config.GEMINI_API_KEY }),
    ...(config.NEXT_PUBLIC_SUPABASE_URL && { NEXT_PUBLIC_SUPABASE_URL: config.NEXT_PUBLIC_SUPABASE_URL }),
    ...(config.NEXT_PUBLIC_SUPABASE_ANON_KEY && { NEXT_PUBLIC_SUPABASE_ANON_KEY: config.NEXT_PUBLIC_SUPABASE_ANON_KEY }),
  }

  serverProcess = spawn(process.execPath, [serverScript], {
    cwd: path.join(appRoot, '.next', 'standalone'),
    env,
    stdio: 'pipe',
  })

  serverProcess.stdout.on('data', (data) => {
    const msg = data.toString()
    console.log('[Next.js]', msg.trim())
    if (msg.includes('ready') || msg.includes('started') || msg.includes(String(PORT))) {
      serverReady = true
    }
  })

  serverProcess.stderr.on('data', (data) => console.error('[Next.js Error]', data.toString().trim()))
  serverProcess.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.error('[Next.js] Server exited with code', code)
    }
  })
}

// ─── Wait for server ──────────────────────────────────────────────────────────
async function waitForServer(maxMs = 30000) {
  const url = `http://127.0.0.1:${PORT}/kadeai/api/health`
  const start = Date.now()
  while (Date.now() - start < maxMs) {
    try {
      const res = await fetch(url)
      if (res.ok || res.status < 500) return true
    } catch {}
    await new Promise((r) => setTimeout(r, 400))
  }
  return false
}

// ─── Create Window ────────────────────────────────────────────────────────────
async function createWindow() {
  const { width, height } = require('electron').screen.getPrimaryDisplay().workAreaSize

  mainWindow = new BrowserWindow({
    width: Math.min(1400, width),
    height: Math.min(900, height),
    minWidth: 900,
    minHeight: 600,
    show: false,
    backgroundColor: '#09090b',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    icon: path.join(resolveAppRoot(), 'public', 'icons', 'icon-512.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  // Open external links in browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url)
    return { action: 'deny' }
  })
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(`http://127.0.0.1:${PORT}/`)) event.preventDefault()
  })

  // Loading screen
  mainWindow.loadFile(path.join(__dirname, 'loading.html'))
  mainWindow.show()

  // Wait for server then navigate
  const ok = await waitForServer()
  if (ok) {
    mainWindow.loadURL(`http://127.0.0.1:${PORT}/kadeai/dashboard`)
  } else {
    mainWindow.loadFile(path.join(__dirname, 'error.html'))
  }
}

// ─── IPC: Config management ───────────────────────────────────────────────────
ipcMain.handle('config:status', () => {
  const config = loadConfig()
  return {
    configured: Object.fromEntries([...ALLOWED_CONFIG_KEYS].map((key) => [key, Boolean(config[key])])),
    path: getConfigPath(),
    encryptionAvailable: safeStorage.isEncryptionAvailable(),
  }
})
ipcMain.handle('config:set', (_, changes) => {
  if (!changes || typeof changes !== 'object' || Array.isArray(changes)) return { ok: false }
  try {
    const next = { ...loadConfig() }
    for (const [key, rawValue] of Object.entries(changes)) {
      if (!ALLOWED_CONFIG_KEYS.has(key) || typeof rawValue !== 'string' || rawValue.length > 4096) continue
      const value = rawValue.trim()
      if (value) next[key] = value
      else delete next[key]
    }
    saveConfig(next)
    return { ok: true }
  } catch {
    return { ok: false }
  }
})

// ─── App lifecycle ────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  spawnNextServer()
  await createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (serverProcess) { serverProcess.kill(); serverProcess = null }
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  if (serverProcess) { serverProcess.kill(); serverProcess = null }
})
