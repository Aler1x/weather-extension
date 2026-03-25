# Material Weather

Material Weather is a compact browser extension popup for checking weather across multiple saved locations. It is built with [WXT](https://wxt.dev), Svelte 5, and the [Open-Meteo](https://open-meteo.com/) APIs.

## Features

- Current conditions plus hourly and multi-day forecast
- Multiple saved locations with quick switching
- Location management with add, remove, and manual reordering
- Persisted `°C` / `°F` preference
- Persisted light/dark theme toggle for the popup
- Local forecast caching to avoid unnecessary repeat requests
- Weather data from Open-Meteo with no API key required

## Requirements

- [Bun](https://bun.sh)
- Firefox or a Chromium-based browser for local testing

## Setup

```bash
bun install
```

## Development

Start the Firefox version with hot reload:

```bash
bun run dev:firefox
```

Start the Chromium version:

```bash
bun run dev
```

Both commands open a temporary browser profile with the extension loaded.

## Validation

Run the Svelte and TypeScript checks:

```bash
bun run check
```

## Building

Build a production bundle for Firefox:

```bash
bun run build:firefox
```

Build a production bundle for Chromium:

```bash
bun run build
```

Build output is written to `.output/`.

## Packaging

Create a Firefox zip for distribution:

```bash
bun run zip:firefox
```

Create a Chromium zip:

```bash
bun run zip
```

Generated archives are written to `.output/`.

## Project structure

```text
src/
├── assets/
│   └── tailwind.css         # Tailwind entry and popup theme tokens
├── entrypoints/
│   └── popup/
│       ├── App.svelte       # Popup router bootstrap
│       └── main.ts          # Popup entry and theme setup
└── lib/
    ├── pages/
    │   ├── landing.svelte   # First-run location setup
    │   ├── locations.svelte # Saved locations management
    │   └── weather.svelte   # Forecast view
    ├── routes.ts            # Popup route map
    ├── stores.ts            # WXT storage items
    ├── theme.ts             # Theme helpers
    ├── types/               # Shared TypeScript types
    └── weather.ts           # Open-Meteo API calls and weather helpers
```

## Tech stack

|                  |                                                                               |
| ---------------- | ----------------------------------------------------------------------------- |
| Framework        | [WXT](https://wxt.dev)                                                        |
| UI               | [Svelte 5](https://svelte.dev) with runes                                     |
| Styling          | [Tailwind CSS](https://tailwindcss.com/)                                      |
| Storage          | [@wxt-dev/storage](https://github.com/wxt-dev/wxt/tree/main/packages/storage) |
| Icons            | [@lucide/svelte](https://lucide.dev)                                          |
| Weather API      | [Open-Meteo](https://open-meteo.com/) + Geocoding API                         |
| Weather icon set | [Google weather icons](https://github.com/bignutty/google-weather-icons)      |
| Package manager  | [Bun](https://bun.sh)                                                         |

## Data & privacy

No account or API key is required. The extension makes direct requests to:

- `https://geocoding-api.open-meteo.com` for city search
- `https://api.open-meteo.com` for forecast data

Saved locations, popup settings, and forecast cache entries are stored locally in the browser via `storage.local`. No user account data is collected and nothing is sent anywhere except the weather API requests above.
