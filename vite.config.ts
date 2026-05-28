import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Capacitor serves the built assets from file:// inside the APK, so asset URLs
// must be relative (base: './'). The dev server is used for browser testing.
// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    host: true, // expose on LAN so the Z Fold can hit `npm run dev` during dev
    port: 5173,
  },
})
