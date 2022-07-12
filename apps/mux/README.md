# Development

## Local env setup

1. From root directory: `npm install`
1. From root directory: `npm run bootstrap` (if this fails because of something related to `typeform-frontend` then `rm -rf apps/typeform`)
1. Go to this project: `cd apps/mux` (no need to npm install again, because bootstrap already did that via lerna)
1. `npm start` - now the mux app is running on http://localhost:3000

**Notes**: `@contentful/dam-app-base` gets installed by lerna when running `npm run bootstrap` from the root directory. If you're getting errors related to this you should probably `rm -rf node_modules` from this project, cd back into the root and run `npm i && npm run bootstrap` again.

## Contentful app setup

* Use the Mux (dev) contentful app and make sure it is pointed to http://localhost:3000 for development
* Create a development app in Contentful. Try to only select the resources needed.
* You will have to go into your browser settings and disable mixed content warnings for this to work
* Contentful uses Conventional Commits.
* Squash commit history.
* Use Node 14, not the current LTS as the docs say.
* Use prettier for formatting.

## Deploy

* This gets deployed and hosted by Contentful

## Object Version

Updates to the stored field data should increase the version.

### v2

```json
{
    "version": 2,
    "uploadId": string,
    "assetId": string,
    "signedPlaybackId": string, // If signed playback enabled.
    "playbackId": string,
    "ready": bool,
    "ratio": string,
    "max_stored_resolution": string,
    "max_stored_frame_rate": number,
    "duration": number,
    "audioOnly": bool
}
```

### v1

```json
{
    "uploadId": string,
    "assetId": string,
    "signedPlaybackId": string, // If signed playback enabled.
    "playbackId": string,
    "ready": bool,
    "ratio": string,
}
```
