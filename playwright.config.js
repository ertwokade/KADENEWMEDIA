import { defineConfig, devices } from '@playwright/test'

// Canlı Supabase kredensiyali olmadan çalıştırılır — bu yüzden testler
// "sayfa çöküyor mu / yetkisiz erişim engelleniyor mu / mobilde yatay
// taşma var mı" gibi backend-veri-bağımsız senaryolara odaklanır.
// Gerçek veri gerektiren (ödeme, admin CRUD sonucu) senaryolar canlı
// ortamda ayrıca test edilmeli (bkz. docs/BLOCKERS_TR.md #1).
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'retain-on-failure',
  },
  // vite preview YERİNE dev server kullanılıyor: prod'daki `/` → site.html
  // rewrite'ı yalnızca vite.config.js'teki serveStaticLandingAtRoot dev
  // middleware'inde taklit ediliyor, `vite preview` bunu bilmiyor (denendi,
  // preview modunda `/` 404 veriyordu çünkü build sonrası dist/index.html
  // app.html olarak yeniden adlandırılıyor).
  webServer: {
    command: 'npx vite --port 4173',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] } },
  ],
})
