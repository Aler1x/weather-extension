import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-svelte'],
  manifest: {
    name: 'Simple Forecast',
    permissions: ['storage'],
    host_permissions: [
      'https://geocoding-api.open-meteo.com/*',
      'https://api.open-meteo.com/*',
    ],
    browser_specific_settings: {
      gecko: {
        id: "simple-forecast@alerix.dev",
      },
    },
  },
});
