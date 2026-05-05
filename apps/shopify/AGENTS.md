# Agent Guide — shopify

## What This App Does
Integrates Shopify with Contentful as an e-commerce product picker. Lets editors select Shopify products and collections for use in Contentful fields.

> **Important**: Shopify has moved to the [marketplace-partner-apps](https://github.com/contentful/marketplace-partner-apps) repo. This directory may contain only a README stub. Confirm the current state before making changes.

## Archetype
Likely **Ecommerce base app** pattern (if source is present). Verify with `ls apps/shopify/`.

## Sharp Edges & Invariants

- Check whether active source code exists here — the README notes that Shopify, Cloudinary, and Bynder have moved to `marketplace-partner-apps`.
- If code is present: Shopify uses its own Storefront API or Admin API for product fetching. Shopify API credentials (storefront access token or custom app credentials) are sensitive.

## Never / Always

- **Never** make changes here without first confirming the canonical source is not in `marketplace-partner-apps`.
- **Never** expose Shopify API credentials in frontend code.
