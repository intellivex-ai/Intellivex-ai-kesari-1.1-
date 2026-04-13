import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { intellivexApiPlugin } from './vite-api-plugin'
import purgecss from 'vite-plugin-purgecss'

export default defineConfig({
  plugins: [
    react(),
    intellivexApiPlugin(), // embeds /api/* routes inside the Vite dev server
    purgecss({
      variables: true, // Also prune unused CSS variables
      safelist: ['dark', 'light'] // Ensure theme classes are never purged
    })
  ],
})
