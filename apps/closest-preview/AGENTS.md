# Agent Guide — closest-preview

## What This App Does
Shows a preview link in the Entry Sidebar for the "closest" published ancestor entry that references the current entry. Useful when a page entry is unpublished but a parent page references it — the sidebar surfaces the parent page's preview URL.

## Archetype
Standard Vite app.

## Locations

| Location | File | Purpose |
|----------|------|---------|
| `LOCATION_APP_CONFIG` | `src/locations/ConfigScreen.tsx` | Configure preview URL patterns per content type |
| `LOCATION_ENTRY_SIDEBAR` | `src/locations/Sidebar.tsx` | Shows the resolved preview link for the nearest published ancestor |

## Key Dependencies

| Package | Role |
|---------|------|
| `@contentful/app-sdk` | App Framework SDK |
| `@contentful/f36-multiselect` | Multi-select for content type config |
| `contentful-management` | CMA for traversing the entry reference graph |

## Source Layout

```
src/
├── App.tsx
├── locations/       # ConfigScreen, Sidebar
├── components/
└── utils/           # Entry graph traversal logic
```

## Sharp Edges & Invariants

- **Reference graph traversal**: the core logic walks up the entry reference graph to find the nearest published ancestor. This is potentially expensive — the existing code limits traversal depth. Do not increase depth limits without testing against deeply nested content models.
- **CMA calls per render**: the Sidebar makes CMA calls on mount to traverse references. These are not cached between renders — adding caching requires care to avoid stale data when entries are published/unpublished.
- **Preview URL pattern** is stored in installation parameters as a template (e.g. `https://mysite.com/preview/{slug}`). The token replacement logic lives in `utils/`.

## Never / Always

- **Never** traverse the reference graph without a depth cap — circular references in content models will cause infinite loops.
- **Always** use `useAutoResizer()` in the Sidebar.
