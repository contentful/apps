# Agent Guide — link-checker

## What This App Does
Scans Contentful entries for broken hyperlinks in rich-text and text fields, reporting which links return non-200 HTTP responses. Helps editors maintain content quality.

## Archetype
Standard Vite app. No locations directory — location routing is likely handled directly in `App.tsx`.

## Structure

```
src/
├── App.tsx            # Entry + location router (no locations/ dir)
└── index.tsx
```

## Key Dependencies

| Package | Role |
|---------|------|
| `@contentful/app-sdk` | App Framework SDK |
| `@contentful/f36-multiselect` | Multi-select for content type selection |
| `@contentful/node-apps-toolkit` | Shared utilities |
| `@contentful/react-apps-toolkit` | `useSDK()` |

## Sharp Edges & Invariants

- **Link checking via frontend**: HTTP requests to external URLs are made from the browser. CORS restrictions on third-party URLs will cause many links to appear broken even when they are not — a 4xx CORS error is indistinguishable from a real 404 at the browser level without a backend proxy. This is a known limitation.
- **Rate limiting**: the app must throttle outbound link check requests — checking every link in a large space simultaneously will rate-limit both the CMA (for fetching entries) and the target servers.
- No `src/locations/` directory — if adding a new location, add the routing in `App.tsx` following the standard pattern.

## Never / Always

- **Never** fire unconstrained parallel link checks — always queue/throttle.
- **Never** treat a CORS error as definitive proof of a broken link — surface it as "unverifiable" to the user.
