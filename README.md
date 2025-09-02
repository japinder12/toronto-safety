# Toronto Safety

Neighborhood Safety Dashboard for Toronto and Region of Peel (Mississauga priority).

What it does: Enter a postal code → shows recent incidents (mock for now) on a map and table. Geocoding is live via Nominatim. Data routes are scaffolded for Toronto/Peel and ready to plug into city open data APIs.

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

- Copy `.env.local.example` to `.env.local` and set any of:
  - `PEEL_CRIME_FEATURE_URL` to Peel Crime Map FeatureServer layer.
    Example: `https://services2.arcgis.com/o1LYr96CpFkfsDJS/ArcGIS/rest/services/Crime_Map/FeatureServer/0`
  - `MISSISSAUGA_311_FEATURE_URL` to Mississauga 311 FeatureServer layer (optional fallback).
  - `TORONTO_MCI_FEATURE_URL` to Toronto Major Crime Indicators FeatureServer layer.
    Example: `https://services.arcgis.com/S9th0jAJ7bqgIRjw/ArcGIS/rest/services/Major_Crime_Indicators_Open_Data/FeatureServer/0`
  - If none are set, Peel falls back to mock data and Toronto returns empty.

## Notes

- Geocoding: `/api/geocode` proxies Nominatim with appropriate headers.
- Incidents: `/api/incidents` prefers Peel Crime (if `PEEL_CRIME_FEATURE_URL` is set) for region=peel, otherwise Mississauga 311 (if set), otherwise mock. For region=toronto, it uses Toronto MCI (if `TORONTO_MCI_FEATURE_URL` is set).
- Map: Leaflet with OpenStreetMap tiles.

## Next Steps (Data Wiring)

- Toronto/Peel: API now supports ArcGIS FeatureServer sources. Configure env vars to enable them.
- Add filters: more granular filters (type/category), and optional time-of-day window.
