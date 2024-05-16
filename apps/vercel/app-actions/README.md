# Vercel App Actions

## get-preview-envs

Builds configurations, including preview urls, based on selected content types and returns a platform provided preview environment for content previews.

[get-preview-envs.ts](src/actions/get-preview-envs.ts)

# Testing backend actions

1. Run

```sh
npm run build:dev
```

2. Deploy to sandbox:

```sh
DEV_TESTING_ORG_ID=<org_id> TEST_CMA_TOKEN=<cma_token> npm run deploy:sandbox
```

3. Call app action:

```sh
ACCESS_TOKEN=<access token> npm run call-app-action -- -a <app action ID> -s <space ID> -p <params list>
```
