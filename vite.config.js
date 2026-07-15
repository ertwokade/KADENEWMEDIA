import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// Dev-only: prod'daki özel statik ana sayfa rewrite'ını taklit eder.
function serveStaticLandingAtRoot() {
  return {
    name: 'serve-static-landing-at-root',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const url = (req.url || '').split('?')[0]
        // prod'daki vercel.json rewrite'larının dev karşılığı — statik editoryal sayfalar
        const staticMap = {
          '/': '/site.html',
          '/hakkimizda': '/hakkimizda.html',
          '/hizmetler': '/hizmetler.html',
          '/iletisim': '/iletisim.html',
          '/paketler': '/paketler.html',
          '/sss': '/sss.html',
          '/neden-biz': '/neden-biz.html',
          '/ekip': '/ekip.html',
          '/kariyer': '/kariyer.html',
          '/basin': '/basin.html',
          '/tesekkur': '/tesekkur.html',
        }
        if (staticMap[url]) req.url = staticMap[url]
        next()
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), serveStaticLandingAtRoot()],
  server: {
    hmr: {
      overlay: false,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      external: [/^api\//],
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three') || id.includes('node_modules/@react-three')) {
            return 'vendor-three';
          }
          if (id.includes('node_modules/framer-motion')) {
            return 'vendor-motion';
          }
          if (id.includes('node_modules/react-icons')) {
            return 'vendor-icons';
          }
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react-router-dom')) {
            return 'vendor-react';
          }
        },
      },
    },
  },
  optimizeDeps: {
    exclude: ['bcryptjs', 'jsonwebtoken', 'mongodb', 'nodemailer'],
  },
})
