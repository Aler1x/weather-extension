import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-svelte'],
  manifest: {
    name: 'Weather',
    permissions: ['storage'],
    host_permissions: [
      'https://geocoding-api.open-meteo.com/*',
      'https://api.open-meteo.com/*',
    ],
  },
});
