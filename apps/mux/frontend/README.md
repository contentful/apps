# Development

## Local env setup

1. From root directory: `npm install`
1. From root directory: `npm run bootstrap` (if this fails because of something related to `typeform-frontend` then `rm -rf apps/typeform`)
1. Go to this project: `cd apps/mux` (no need to npm install again, because bootstrap already did that via lerna)
1. `npm start` - now the mux app is running on http://localhost:3000

**Notes**: `@contentful/dam-app-base` gets installed by lerna when running `npm run bootstrap` from the root directory. If you're getting errors related to this you should probably `rm -rf node_modules` from this project, cd back into the root and run `npm i && npm run bootstrap` again.

## Contentful app setup

- Use the Mux (dev) contentful app and make sure it is pointed to http://localhost:3000 for development
- Create a development app in Contentful. Try to only select the resources needed.
- You will have to go into your browser settings and disable mixed content warnings for this to work
- Contentful uses Conventional Commits.
- Squash commit history.
- Use Node 14.
- Use Prettier for formatting.

## Existing Videos and Captions

Captions and subtitles (using the terms interchangeably here) are bundled and delivered with the video during playback, and is ultimately the source of truth. For other UI uses, the captions are included in the data object so the video manifest does not have to be downloaded. For existing videos, workflows may have already added captions on some videos, and will continue to work in players even if they are not reflected in data stored in Contentful. To update the Contentful data on the video, press the "resync" button to sync to the latest state of the video.

## Deploy

- This gets deployed and hosted by Contentful

## Object Version

Updates to the stored field data should increase the version.
Parameters that come directly from the Mux API response are snake-case.

```json
{
  "version": 3,
  "uploadId": string,
  "assetId": string,
  "signedPlaybackId": string, // If signed playback enabled.
  "playbackId": string,
  "ready": boolean,
  "ratio": string,
  "max_stored_resolution": string,
  "max_stored_frame_rate": number,
  "duration": number,
  "audioOnly": boolean,
  "created_at": number,
  "live_stream_id": string,
  "is_live": boolean,
  "captions": [
    {
      "type": string,
      "text_type": string,
      "text_source": string,
      "status": string,
      "name": string,
      "language_code": string,
      "id": string,
      "closed_captions": boolean
    }
  ]
}
```

### v2

```json
{
  "version": 2,
  "uploadId": string,
  "assetId": string,
  "signedPlaybackId": string, // If signed playback enabled.
  "playbackId": string,
  "ready": boolean,
  "ratio": string,
  "max_stored_resolution": string,
  "max_stored_frame_rate": number,
  "duration": number,
  "audioOnly": boolean
}
```

### v1

```json
{
  "uploadId": string,
  "assetId": string,
  "signedPlaybackId": string, // If signed playback enabled.
  "playbackId": string,
  "ready": boolean,
  "ratio": string,
}
```
