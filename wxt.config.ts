import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite'

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-svelte'],
  vite: () => ({
    plugins: [tailwindcss()]
  }),
  manifest: {
    name: 'Material Weather',
    permissions: ['storage'],
    host_permissions: [
      'https://geocoding-api.open-meteo.com/*',
      'https://api.open-meteo.com/*',
    ],
    browser_specific_settings: {
      gecko: {
        // Kept for Firefox AMO update continuity (display name is Material Weather).
        id: 'simple-forecast@alerix.dev',
      },
    },
  },
});
