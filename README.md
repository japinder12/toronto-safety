# Toronto Safety

Neighborhood Safety Dashboard for the City of Toronto.

What it does: Enter a postal code → shows recent Toronto Police Service Major Crime Indicators on a map and table.
Scope: City of Toronto only.

## Getting Started

1) Install deps (use pnpm or npm):

```bash
pnpm add leaflet
```

2) Run the dev server:

```bash
pnpm dev
```

Open http://localhost:3000.

3) Configure environment

- Copy `.env.local.example` to `.env.local` and set:
  - `TORONTO_MCI_FEATURE_URL` to Toronto Major Crime Indicators FeatureServer layer.
    Example: `https://services.arcgis.com/S9th0jAJ7bqgIRjw/ArcGIS/rest/services/Major_Crime_Indicators_Open_Data/FeatureServer/0`
  - If not set, the app falls back to local mock data.

Optional (recommended): set a descriptive geocoding User-Agent to comply with Nominatim usage policy:

```
GEOCODE_USER_AGENT="toronto-safety/0.1 (your-email@example.com)"
GEOCODE_REFERER="http://localhost:3000"
```

## Notes

- Geocoding: `/api/geocode` proxies Nominatim with appropriate headers.
- Incidents: `/api/incidents` queries Toronto MCI only and applies precise date filtering on `OCC_DATE`.
- Map: Leaflet with OpenStreetMap tiles.

## Next Steps (Data Wiring)

- UI Filters: Time range (1/3/7/14/30 days), radius 1–5 km.
