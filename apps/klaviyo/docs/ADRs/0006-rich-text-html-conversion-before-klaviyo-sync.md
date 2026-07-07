# ADR-0006: Rich Text Converted to HTML Before Syncing to Klaviyo

**Date:** 2026-05-05
**Status:** Accepted
**Deciders:** David Shibley, Marketplace team

## Context

Contentful stores rich text as a structured Document node tree (Contentful Document format). Klaviyo profile attributes and event properties are string or primitive values — Klaviyo does not understand the Contentful Document schema.

If rich text field values are sent to Klaviyo as-is (raw JSON Document nodes), Klaviyo templates cannot render them; they appear as opaque JSON blobs and are unusable in email or SMS content.

Two conversion targets were considered:
1. **Markdown** — a plain-text serialization that some email platforms support; Klaviyo does not have native Markdown rendering in its template editor
2. **HTML** — the standard format for email/web content; Klaviyo's template editor and content blocks accept HTML strings directly

## Decision

Rich text fields are converted to HTML strings using `@contentful/rich-text-html-renderer` (`documentToHtmlString`) before the data is sent to Klaviyo. The conversion happens in `src/utils/klaviyo-service.ts` (`processRichText` / `documentToHtmlString` calls). The same library is used in `functions/` for server-side sync via `entrySyncFunction`.

## Consequences

### Positive
- Klaviyo templates can render the HTML directly in emails and SMS messages without additional processing
- `@contentful/rich-text-html-renderer` is the officially maintained Contentful library for this conversion — no custom parser to maintain
- HTML output is predictable and testable against known Document inputs (fixtures in `src/`)

### Negative
- Rich text features without HTML equivalents (e.g., embedded entries, custom marks) require custom renderer overrides; the default renderer may produce empty output or strip content silently for unknown node types
- HTML in Klaviyo attributes means Klaviyo templates must use the `|raw` filter (or equivalent) to render without double-escaping — this is a usage constraint on the Klaviyo side
- Converting on every sync adds CPU time in App Functions; very large rich text documents (many embedded entries) may be slow

### Neutral
- `@contentful/rich-text-html-renderer` is already a dependency of several other apps in this monorepo (braze, google-docs) — no new dependency class is introduced
- Custom node renderers (for embedded assets, embedded entries) must be added in `klaviyo-service.ts` if default output is insufficient for a given content model
