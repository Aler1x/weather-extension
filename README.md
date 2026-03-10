# Simple Forecast

A Firefox browser extension that shows a 10-day weather forecast for one or more saved locations. Built with [WXT](https://wxt.dev) and Svelte 5.

## Features

- 10-day daily forecast (high/low temp, wind speed, weather condition)
- Multiple saved locations with quick switching
- °C / °F toggle, persisted across sessions
- Compact popup with a fixed size — no layout jumps
- Weather data from [Open-Meteo](https://open-meteo.com/) (free, no API key)

## Requirements

- [Bun](https://bun.sh) — used as the package manager and script runner
- Firefox (primary target)

## Setup

```bash
bun install
```

## Development

Run the extension in Firefox with hot reload:

```bash
bun run dev:firefox
```

This opens a temporary Firefox profile with the extension loaded. Changes to source files are reflected immediately.

## Building

Build a production bundle for Firefox:

```bash
bun run build:firefox
```

Output goes to `.output/firefox-mv2/`.

## Packaging (zip)

Create a signed-ready zip for Firefox Add-ons submission:

```bash
bun run zip:firefox
```

The patch version in `package.json` is **automatically incremented** before every zip via the `prezip:firefox` script. So `0.0.9` becomes `0.0.10` on the next run.

The zip is saved to `.output/simple-forecast-{version}-firefox.zip`.

## Project structure

```
src/
├── entrypoints/
│   └── popup/
│       ├── App.svelte      # Main popup — search screen, header, forecast
│       ├── app.css         # All popup styles
│       ├── index.html      # Popup HTML entry point
│       └── main.ts         # Svelte mount
└── lib/
    ├── WeatherCard.svelte  # Single forecast day card
    ├── weather.ts          # Open-Meteo API calls + helpers
    └── stores.ts           # WXT storage items (locations, activeIndex, unit)

scripts/
└── bump-version.js         # Increments patch version in package.json
```

## Tech stack

| | |
|---|---|
| Framework | [WXT](https://wxt.dev) (WebExtension tooling) |
| UI | [Svelte 5](https://svelte.dev) with runes |
| Storage | [@wxt-dev/storage](https://github.com/wxt-dev/wxt/tree/main/packages/storage) |
| Icons | [@lucide/svelte](https://lucide.dev) |
| Weather API | [Open-Meteo](https://open-meteo.com/) + Geocoding API |
| Package manager | [Bun](https://bun.sh) |

## Data & privacy

No account or API key is required. The extension makes direct requests to:

- `https://geocoding-api.open-meteo.com` — city name → coordinates
- `https://api.open-meteo.com` — forecast data

All saved locations and settings are stored locally in the browser via `storage.local`. Nothing is sent to any external server beyond the weather API requests.
