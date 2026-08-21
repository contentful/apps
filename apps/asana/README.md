# Asana App

Contentful Marketplace app scaffold for an automation-first Asana integration.

## Current scope

This first version provides:

- an app configuration screen,
- secure installation parameters for an Asana personal access token,
- connection validation through a Contentful app action,
- workspace and project lookup so default destinations can be stored for later actions.

Planned next steps:

- create Asana task action,
- add comment to task action,
- update task action,
- UX polish and documentation hardening.

## Local development

```bash
cd apps/asana
npm install
npm run start
```

Build functions before upload:

```bash
npm run build
```

Upsert actions after the app definition exists:

```bash
npm run upsert-actions
```

## Current auth assumption

This scaffold uses an Asana personal access token for initial local validation and configuration.
That keeps v1 small and testable. A fuller OAuth flow can be added in a later iteration without
changing the automation-oriented action architecture.
