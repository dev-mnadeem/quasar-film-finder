import process from 'node:process'
import { fileURLToPath, URL } from 'node:url'

import { quasar, transformAssetUrls } from '@quasar/vite-plugin'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'

/**
 * The Vue DevTools overlay is opt-in: it floats a button over the bottom of the
 * page, which lands on top of the results grid in screenshots and end-to-end runs.
 * Turn it on with `VITE_DEVTOOLS=1 npm run dev`.
 */
const devToolsEnabled = process.env.VITE_DEVTOOLS === '1'

export default defineConfig({
  plugins: [
    vue({
      template: { transformAssetUrls },
    }),
    vueJsx(),
    ...(devToolsEnabled ? [vueDevTools()] : []),
    quasar({
      sassVariables: false,
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
