# Toronto Safety

Neighbourhood Safety Dashboard: explore recent Toronto Police Service Major Crime Indicators (MCI) near any address.

## Features

- Search by postal code; centers map and lists nearby incidents
- Time range: Last 3 months / 6 months / 1 year
- Color legend by crime type; matching map pins and table dots
- Eastern Time display (EST/EDT)
- “About the data” modal with last-updated timestamp

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS 4
- Leaflet + OpenStreetMap tiles
- Data: Toronto Police Service MCI (ArcGIS FeatureServer)

## Repository Map

- `src/app/page.tsx` — main UI (search, map, table, legend)
- `src/app/api/incidents/route.ts` — incidents API (Toronto MCI only)
- `src/app/api/geocode/route.ts` — geocoding via Nominatim
- `src/app/api/meta/route.ts` — data source metadata
- `src/components/*` — UI components (MapView, Legend, AboutData, Table)
- `src/lib/colors.ts` — type normalization + color mapping

## Quick Start (Local)

1) Install deps

```bash
pnpm install
```

2) Configure environment

- Copy `.env.local.example` to `.env.local` and set:
  - `TORONTO_MCI_FEATURE_URL` (required)
    Example: `https://services.arcgis.com/S9th0jAJ7bqgIRjw/ArcGIS/rest/services/Major_Crime_Indicators_Open_Data/FeatureServer/0`

3) Run

```bash
pnpm dev
```

Open http://localhost:3000
