# Agent Guide — sap-commerce-cloud-with-air

## What This App Does
Variant of `sap-commerce-cloud` that also integrates with SAP's AIR (Advanced Integration Runtime). Adds support for SAP AIR's extended catalog and product management capabilities.

## Archetype
**Legacy Lambda + Frontend** app.

## Structure

```
apps/sap-commerce-cloud-with-air/
├── frontend/          # React app
└── lambda/            # AWS Lambda handlers
```

> No `package.json` found at the root level at audit time. Check for `frontend/package.json` and `lambda/package.json` separately.

## Sharp Edges & Invariants

- **Lambda, not App Actions** — unlike `sap-commerce-cloud` (which uses App Actions), this variant uses AWS Lambda for its backend. Do not conflate the two.
- SAP AIR credentials and endpoints are in installation parameters (via Lambda environment variables).
- **Relationship with `sap-commerce-cloud`**: both apps handle SAP Commerce product picking. The difference is the AIR integration layer. If fixing a shared bug, check both apps.

## Never / Always

- **Never** call SAP Commerce or AIR APIs directly from the frontend.
- **Always** verify which SAP authentication mechanism (OAuth vs. basic auth) this app uses before modifying the Lambda auth logic — AIR may use a different auth flow than the standard SAP Commerce API.
