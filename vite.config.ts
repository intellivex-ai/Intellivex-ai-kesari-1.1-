import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { intellivexApiPlugin } from './vite-api-plugin'
import purgecss from 'vite-plugin-purgecss'

import legacy from '@vitejs/plugin-legacy'

export default defineConfig({
  plugins: [
    react(),
    legacy({
      targets: ['ios >= 12', 'chrome >= 60', 'safari >= 11'],
      additionalLegacyPolyfills: ['regenerator-runtime/runtime']
    }),
    intellivexApiPlugin(),
    purgecss({
      variables: true,
      safelist: ['dark', 'light']
    })
  ],
  build: {
    target: 'es2015',
    minify: 'terser', // Required for legacy plugin stability
  }
})
