# Translation Companion

> **Internal tool**
> This app exists solely to hold an App Identity for Translation product services that need to
> call the Content Management API without a user in the loop (webhook-driven syncs, scheduled
> reconciliation jobs). It is not published to the Contentful Marketplace and should not be
> treated as a customer-facing product.

## Why this app exists

Some Translation product services run without any end user in the loop -- for example, a
service keeping a content index fresh via webhooks and a periodic reconciliation job has no
request-scoped bearer token available for either call site. Contentful's App Framework solves
this with **App Identity**: an App Definition with App Keys can mint short-lived App Access
Tokens independent of any user session.

This app is deliberately minimal. Installing it into a space + environment gives that
installation an App Identity; a consuming service (not this app) signs a JWT with the resulting
private key and exchanges it for an App Access Token to call the CMA.

This app is a companion to the `translation-api` service, and is intentionally **not** scoped to
a single feature of that service -- any future Translation feature needing unattended CMA access
can reuse this same App Definition rather than provisioning a new one.

## What this app is not

- Not a place for feature-specific logic. It has no App Actions, no Functions, no Lambda -- just
  a config screen confirming the installation exists. All CMA-calling logic lives in the
  consuming service.

## Local development

```bash
npm install
npm start
```

`npm start` creates or updates the App Definition in your configured Contentful organization and
runs the app locally. See `AGENTS.md` for how App Identity/App Keys and CMA scopes are
provisioned -- none of that happens through this app's code or `npm start`.

## Deployment

```bash
npm run build
npm run deploy       # production
npm run deploy:test  # test/staging
```

Requires `DEFINITIONS_ORG_ID`/`DEV_TESTING_ORG_ID` and a CMA token in the environment, matching
every other app in this repo. The `--definition-id` values in `package.json`'s `deploy`/
`deploy:test` scripts are placeholders until the App Definition is actually provisioned (see
`AGENTS.md`).
