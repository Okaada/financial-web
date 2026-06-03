import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Same-origin strategy (see design.md, D1): in production the app and the API are
// served from the same origin (`app.dominio` + `app.dominio/api/*` via a Pages
// Function), so the HTTP client only ever uses the relative `/api` prefix and there is
// no CORS. In dev we reproduce that by proxying `/api` to the local backend — the
// client code does not change between dev and prod.
//
// Point the proxy at the local Finance API via VITE_API_PROXY_TARGET; defaults to
// http://localhost:8787 (the typical Wrangler dev port).
const apiTarget = process.env.VITE_API_PROXY_TARGET ?? 'http://localhost:8787'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
        // Strip the `/api` prefix so the relative client paths map onto the
        // backend's real routes (e.g. `/api/auth/login` -> `/auth/login`).
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
