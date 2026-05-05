# Agent Guide — cloudinary

## What This App Does
Integrates Cloudinary Digital Asset Management with Contentful. Lets editors select and manage Cloudinary media assets from Contentful field editors.

> **Important**: Cloudinary has moved to the [marketplace-partner-apps](https://github.com/contentful/marketplace-partner-apps) repo. This directory may contain only a README stub. Confirm the current state before making changes.

## Archetype
Likely **DAM base app** pattern (if source is present). Verify with `ls apps/cloudinary/`.

## Sharp Edges & Invariants

- Check whether active source code exists here — the README notes that Cloudinary, Bynder, and Shopify have moved to `marketplace-partner-apps`.
- If code is present: Cloudinary uses its own Media Library widget (loaded via script tag) as the asset picker.

## Never / Always

- **Never** make changes here without first confirming the canonical source is not in `marketplace-partner-apps`.
