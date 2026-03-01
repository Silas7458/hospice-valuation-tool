import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: process.env.GITHUB_PAGES ? '/hospice-valuation-tool/' : '/',
  build: {
    rollupOptions: {
      // Safety net: ensure engine IP files never end up in the client bundle.
      // formatting.js is intentionally allowed (display-only, no IP).
      external: (id) => {
        if (id.includes('engine/calculations') ||
            id.includes('engine/tiers') ||
            id.includes('engine/sensitivity')) {
          return true;
        }
      },
    },
  },
})
