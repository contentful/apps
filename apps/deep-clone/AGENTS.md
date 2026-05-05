# Agent Guide — deep-clone

## What This App Does
Clones a Contentful entry and all of its referenced child entries recursively. Editors use it from the Entry Sidebar to duplicate a complex nested entry tree without manually recreating each linked entry.

## Archetype
Standard Vite app.

## Locations

| Location | File | Purpose |
|----------|------|---------|
| `LOCATION_APP_CONFIG` | `src/locations/ConfigScreen.tsx` | Configure which content types are clonable and clone behavior |
| `LOCATION_ENTRY_SIDEBAR` | `src/locations/Sidebar.tsx` | Trigger clone operation; shows progress |
| `LOCATION_DIALOG` | `src/locations/ReferenceSelectionDialog.tsx` | Lets user choose which referenced entries to include in the clone |

## Key Dependencies

| Package | Role |
|---------|------|
| `@contentful/app-sdk` | App Framework SDK |
| `@contentful/f36-multiselect` | Multi-select for reference selection |
| `@contentful/react-apps-toolkit` | `useSDK()`, `useCMA()` |
| `contentful-management` | CMA for reading entries and creating clones |

## Source Layout

```
src/
├── App.tsx
├── locations/       # ConfigScreen, Sidebar, ReferenceSelectionDialog
├── components/
└── utils/           # Entry graph traversal and clone logic
```

## Sharp Edges & Invariants

- **Reference graph traversal**: the clone walks the reference graph recursively. This is the most complex logic in the app — it lives in `utils/`. Do not modify without understanding the full traversal algorithm.
- **Circular reference handling**: content models can have circular references (e.g. `Page` references `Section` references `Page`). The traversal must detect and break cycles — this is already implemented; do not remove cycle detection.
- **Clone order matters**: entries must be created bottom-up (leaf nodes first) so parent entries can link to already-created children. Changing the creation order will cause `422 Unresolvable link` errors.
- **CMA rate limits**: a deep clone can make dozens of CMA calls. The existing code batches operations — do not replace batching with sequential unconstrained calls.
- Asset references: assets are linked, not cloned — deep-clone does not duplicate assets, only entries.

## Never / Always

- **Never** remove cycle detection from the reference traversal — it will loop infinitely on circular content models.
- **Never** clone assets — only entries should be cloned; asset links should be preserved by reference.
- **Always** show progress to the user during long clone operations.
