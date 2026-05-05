# Agent Guide — content-insights

## What This App Does
Provides analytics and performance metrics for Contentful content — showing views, engagement, and other content performance data. Integrates with analytics providers (configurable) and surfaces metrics in a full-page dashboard.

## Archetype
Standard Vite app.

## Locations

| Location | File | Purpose |
|----------|------|---------|
| `LOCATION_APP_CONFIG` | `src/locations/ConfigScreen.tsx` | Configure analytics provider and credentials |
| `LOCATION_PAGE` | `src/locations/Page/` | Full-page analytics dashboard |
| `LOCATION_HOME` | `src/locations/Home/` | Home screen widget (metrics summary) |

## Key Dependencies

| Package | Role |
|---------|------|
| `@contentful/app-sdk` | App Framework SDK |
| `@contentful/f36-multiselect` | Multi-select filters |
| `@contentful/field-editor-date` | Date range picker |
| `contentful-management` | CMA for content type/entry metadata |

## Source Layout

```
src/
├── App.tsx
├── locations/        # ConfigScreen, Home, Page
├── components/       # Charts, metrics cards
├── hooks/
├── metrics/          # Metrics calculation and formatting logic
├── providers/        # Analytics provider abstraction
└── scripts/          # Build helpers
```

## Sharp Edges & Invariants

- **Analytics provider abstraction in `providers/`** — the app is designed to support multiple analytics backends. Adding a new provider means implementing the provider interface, not modifying core metrics logic.
- **`metrics/` directory** — contains the core aggregation and display logic. Changes here affect all charts and number displays.
- The Home location renders a compact metrics widget — keep it lightweight; it loads on every Contentful home screen visit.
- Analytics API credentials are in installation parameters.

## Never / Always

- **Never** call analytics APIs directly from components — use the provider abstraction in `providers/`.
- **Always** handle the case where no analytics data is available (new space, no traffic) with an informative empty state.
