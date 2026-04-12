import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { intellivexApiPlugin } from './vite-api-plugin'

export default defineConfig({
  plugins: [
    react(),
    intellivexApiPlugin(), // embeds /api/* routes inside the Vite dev server
  ],
})
