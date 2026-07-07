# Google Analytics 4 Reviewer Validation Guide

This document explains how to validate the Google Analytics 4 app changes in a repeatable way.

## What This PR Adds

This branch adds support for:

- advanced matching
- matching against `page path + query string`
- `Flexible pattern` matching
- multiple rules per content type
- multiple page properties per rule
- expanded preset date ranges
- custom date range selection
- `Unique views`
- clearer footer behavior when multiple rules contribute to one sidebar result

## Recommended Validation Path

The easiest path for reviewers is:

1. Use the hosted staging app in a shared Contentful space.
2. Configure the app against a GA4 property that already has test traffic.
3. Open seeded entries and verify the sidebar output.

## Hosted App

Hosted staging app definition:

- `Google Analytics 4 (staging)`
- app definition id: `42yub8HtSmIclUlVBHpHHP`

Suggested validation spaces:

- `u59a656msupb`
- `c661d7sie16h`

If you are validating in a different space, use the content model and entry setup described below.

## GA4 Setup

Shared GA4 property used during development:

- property name: `Contentful GA4 Test`
- property id: `properties/531110338`
- measurement id: `G-8YHK83TB7T`

Shared service account metadata:

- service account email: `contentful-ga4-reader@contentful-ga4-test.iam.gserviceaccount.com`
- Google Cloud project: `contentful-ga4-test`

Do not commit the raw service-account JSON into the repo or PR.

For validation, use one of these options:

- use your own GA4 service-account JSON that has `Viewer` access to the same property
- get the shared JSON through a secure channel and paste it into the app config locally

The JSON used during development is intentionally not stored in this repository because it contains a live private key.

## Test Website

The validation site used during development is a small static site under:

- `/Users/zachary.yankiver/Documents/Marketplace Apps/ga4-test-site`

If you have that sibling directory locally, you can run it with:

```bash
cd /Users/zachary.yankiver/Documents/Marketplace\ Apps/ga4-test-site
node scripts/serve-static.mjs
```

Expected local URL:

- `http://localhost:4173`

If you do not have that sibling directory, you can recreate the same website by making a simple static site with the routes listed below and adding your GA4 Measurement ID to each page.

## Test Routes

These are the routes used during development:

- `/`
- `/en-us/home/`
- `/de-de/home/`
- `/blog/my-post/`
- `/solutions/platform/`
- `/search/?category=platform`
- `/article/?articleId=360054483454`
- `/article/?articleId=360054483455`
- `/category/my-post/`
- `/interviews/my-post/`
- `/news/my-post/`
- `/guides/market-insights/`
- `/north-america/denver/luxury-homes/`

Suggested full local URLs to hit before validating the app:

- `http://localhost:4173/en-us/home/`
- `http://localhost:4173/de-de/home/`
- `http://localhost:4173/blog/my-post/`
- `http://localhost:4173/solutions/platform/`
- `http://localhost:4173/search/?category=platform`
- `http://localhost:4173/article/?articleId=360054483454`
- `http://localhost:4173/category/my-post/`
- `http://localhost:4173/interviews/my-post/`
- `http://localhost:4173/news/my-post/`
- `http://localhost:4173/guides/market-insights/`
- `http://localhost:4173/north-america/denver/luxury-homes/`

Notes:

- GA4 Realtime usually updates first.
- Standard GA4 reports and the app sidebar can lag behind Realtime.
- The `article` route is useful for exact query-string matching.
- The `category`, `interviews`, and `news` routes are useful for multiple-rule and `Flexible Post` validation.
- The `guides` and `north-america/denver` routes are useful for multiple-page-property validation.

## Seeding Contentful Fixtures

If you want to reproduce the same content model and entries in your own space, use the helper scripts from the test-site folder.

### Standard Fixtures

```bash
cd /Users/zachary.yankiver/Documents/Marketplace\ Apps/ga4-test-site
node scripts/seed-contentful-ga4-spaces.mjs <spaceId>
```

This creates:

- `Page EN`
- `Page DE`
- `Blog Post`
- `Solution Page`
- `Search Page`

And entries:

- `English Home`
- `German Home`
- `Example Blog Article`
- `Platform Solution`
- `Search Results`

### Flexible Pattern Fixture

```bash
cd /Users/zachary.yankiver/Documents/Marketplace\ Apps/ga4-test-site
node scripts/seed-flexible-post-contentful-space.mjs <spaceId>
```

This creates:

- `Flexible Post`

And entry:

- `Flexible Pattern Demo`

### Multi-Field Fixtures

```bash
cd /Users/zachary.yankiver/Documents/Marketplace\ Apps/ga4-test-site
node scripts/seed-multifield-contentful-ga4-space.mjs <spaceId>
```

This creates:

- `Composed Article`
- `Regional Listing`

And entries:

- `Guides Market Insights`
- `Denver Luxury Homes`

## Manual Content Model Setup

If you prefer to create the fixtures by hand instead of running the scripts, create these content types and entries.

### Standard Content Types

`Page EN`

- fields:
  - `Title`
  - `Slug`
- display field:
  - `Title`
- example entry:
  - title: `English Home`
  - slug: `home`

`Page DE`

- fields:
  - `Title`
  - `Slug`
- display field:
  - `Title`
- example entry:
  - title: `German Home`
  - slug: `home`

`Blog Post`

- fields:
  - `Title`
  - `Slug`
- display field:
  - `Title`
- example entry:
  - title: `Example Blog Article`
  - slug: `my-post`

`Solution Page`

- fields:
  - `Title`
  - `Slug`
- display field:
  - `Title`
- example entry:
  - title: `Platform Solution`
  - slug: `platform`

`Search Page`

- fields:
  - `Title`
  - `Slug`
  - `Category`
- display field:
  - `Title`
- example entry:
  - title: `Search Results`
  - slug: `platform`
  - category: `platform`

### Flexible Pattern Content Type

`Flexible Post`

- fields:
  - `Title`
  - `Slug`
- display field:
  - `Title`
- example entry:
  - title: `Flexible Pattern Demo`
  - slug: `my-post`

### Multi-Field Content Types

`Composed Article`

- fields:
  - `Title`
  - `Section slug`
  - `Slug`
- display field:
  - `Title`
- example entry:
  - title: `Guides Market Insights`
  - section slug: `guides`
  - slug: `market-insights`

`Regional Listing`

- fields:
  - `Title`
  - `Region slug`
  - `City slug`
  - `Slug`
- display field:
  - `Title`
- example entry:
  - title: `Denver Luxury Homes`
  - region slug: `north-america`
  - city slug: `denver`
  - slug: `luxury-homes`

## App Configuration

### API Access

1. Paste a GA4 service-account JSON that has access to the shared property.
2. Select:
   - `Contentful GA4 Test (531110338)`
3. Save the config before validating the content-type rules.

### Global Setting

- enable `Use trailing slash for all page paths`

### Standard Rules

`Page EN`

- standard mode
- slug field: `Slug`
- URL prefix: `/en-us/`

`Page DE`

- standard mode
- slug field: `Slug`
- URL prefix: `/de-de/`

`Blog Post`

- standard mode
- slug field: `Slug`
- URL prefix: `/blog/`

`Solution Page`

- standard mode
- slug field: `Slug`
- URL prefix: `/solutions/`

### Query String Rule

`Search Page`

- advanced mode: on
- slug field: `Slug`
- pattern: `/search/?category={slug}`
- match against: `Page path + query string`
- matching mode: `Literal`

### Multiple Rules Per Content Type

Create three separate rules for `Flexible Post`:

Rule 1

- advanced mode: on
- slug field: `Slug`
- pattern: `/category/{slug}/`
- match against: `Page path`
- matching mode: `Literal`

Rule 2

- advanced mode: on
- slug field: `Slug`
- pattern: `/interviews/{slug}/`
- match against: `Page path`
- matching mode: `Literal`

Rule 3

- advanced mode: on
- slug field: `Slug`
- pattern: `/news/{slug}/`
- match against: `Page path`
- matching mode: `Literal`

Note: Do not use a single flexible-pattern rule if you want to validate the new multi-rule footer summary. The multi-rule footer only appears when the same content type is configured as multiple separate rules.

### Multiple Page Properties Per Rule

`Composed Article`

- advanced mode: on
- slug field: `Slug`
- additional page properties: `Section slug`
- pattern: `/{sectionSlug}/{slug}`
- match against: `Page path`
- matching mode: `Literal`

`Regional Listing`

- advanced mode: on
- slug field: `Slug`
- additional page properties:
  - `Region slug`
  - `City slug`
- pattern: `/{regionSlug}/{citySlug}/{slug}`
- match against: `Page path`
- matching mode: `Literal`

## Expected Sidebar Results

`English Home`

- resolved path: `/en-us/home/`

`German Home`

- resolved path: `/de-de/home/`

`Example Blog Article`

- resolved path: `/blog/my-post/`

`Platform Solution`

- resolved path: `/solutions/platform/`

`Search Results`

- resolved path: `/search/?category=platform`

`Flexible Pattern Demo`

- should aggregate three rules
- footer should show:
  - `Included paths (3)`
  - `/category/my-post/`
  - `/interviews/my-post/`
  - `/news/my-post/`

`Guides Market Insights`

- resolved path: `/guides/market-insights/`

`Denver Luxury Homes`

- resolved path: `/north-america/denver/luxury-homes/`

## Metrics To Validate

Validate both metrics:

- `Total views`
- `Unique views`

Also validate:

- preset ranges:
  - `Last 24 hours`
  - `Last 7 days`
  - `Last 28 days`
  - `Last 90 days`
  - `Last 12 months`
- `Custom range`

## Optional Local App Development Setup

If you want to run the app locally instead of validating only through the hosted staging app:

Frontend:

```bash
cd /Users/zachary.yankiver/Documents/Marketplace\ Apps/apps/apps/google-analytics-4/frontend
HOST=localhost npm start
```

Backend:

```bash
cd /Users/zachary.yankiver/Documents/Marketplace\ Apps/apps/apps/google-analytics-4/lambda
docker compose up --build
```

Expected local URLs:

- app frontend: `http://localhost:3000`
- backend: `http://localhost:8080/dev`
- static test site: `http://localhost:4173`

Note: If you use a local app definition, make sure its request-verification secret matches the local backend configuration.

## Reviewer Checklist

- Can the app save API access and property configuration successfully?
- Do standard URL-prefix rules still work?
- Does query-string matching work?
- Does one content type support multiple rules?
- Does one rule support multiple page properties?
- Do `Total views` and `Unique views` both render correctly?
- Do preset ranges and custom ranges work without layout glitches?
- Does the footer summarize multi-rule entries clearly?
