# Architecture Decision Records

This directory contains Architecture Decision Records (ADRs) for `contentful/apps`. An ADR documents
a significant technical decision: the context that made it necessary, the options considered, the
choice made, and the consequences.

ADRs are written at the time of the decision and are not retroactively updated. If a decision is
reversed or superseded, a new ADR is written that references the old one.

The date-based filename is the canonical identifier — `YYYY-MM-DD-short-title.md`, using the date of
the originating commit or discussion rather than the date the ADR was written.

Because this repository is public, ADRs cite only evidence that is public in the repository itself —
commit SHAs, pull request numbers, code, and package manifests.

| Date | Status | Title |
|---|---|---|
| [2022-07-08](./2022-07-08-vite-as-standard-build-tool.md) | Accepted | Vite as the Standard App Build Tool |

## Format

```
# <Title>

## Status
Accepted | Superseded by [YYYY-MM-DD-title](./YYYY-MM-DD-title.md) | Deprecated

## Context
What problem or decision was faced? What constraints existed? What alternatives were considered?

## Decision
What was chosen and why.

## Consequences
Trade-offs accepted. What this enables. What it prevents or makes harder. Any follow-up work created.
```
