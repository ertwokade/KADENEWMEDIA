import { defineConfig, devices } from '@playwright/test'

// Production-benzeri dist sunucusu gerçek 404/redirect davranışını korur ve
// veri gerektirmeyen API çağrılarına deterministik yanıt verir. Admin CRUD
// akışları ilgili testte ayrıca route mock'larıyla doğrulanır; Supabase'e
// veya production analytics'e yazılmaz.
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  // Ana sayfa bir WebGL sahnesi çalıştırıyor. Varsayılan worker sayısında
  // (çekirdek/2) dört tarayıcı aynı anda GPU/CPU'yu paylaşınca sahne, ölçtüğümüz
  // CSS geçişlerini geciktiriyor ve zamanlamaya duyarlı testler yükün kendisini
  // ölçmeye başlıyordu — tek başına 3 sn süren iş paralelde 10 sn'yi aşıyordu.
  // İki worker, tek kullanıcının tarayıcı deneyimine daha yakın ve kararlı.
  workers: 2,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run legacy:build && PORT=4173 node scripts/serve-dist.mjs',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] } },
  ],
})
