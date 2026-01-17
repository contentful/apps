# Broadcast - Voice & Video Studio

A Contentful App that generates audio voiceovers from entry text using ElevenLabs text-to-speech API. The app converts text content into MP3 audio files and automatically uploads them as Contentful Assets.

## Features

- **Text-to-Speech Generation**: Converts text from Contentful entries into high-quality MP3 audio files using ElevenLabs API
- **Mock Mode**: Test audio generation without an API key using mock audio samples
- **Automatic Asset Management**: Creates, processes, and publishes audio assets directly in Contentful
- **Sidebar Integration**: Easy-to-use sidebar interface for generating audio from entry content
- **Configurable Voice**: Configure custom ElevenLabs voice IDs per installation

## Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Components**: Forma 36 (Contentful's design system)
- **Testing**: Vitest with React Testing Library

### Backend
- **Runtime**: Contentful Functions (Node.js)
- **SDK**: `@contentful/node-apps-toolkit` for App Actions
- **API Integration**: ElevenLabs Text-to-Speech API
- **Asset Management**: Contentful Management API (CMA)

## Prerequisites

- Node.js (version specified in `.nvmrc`)
- A Contentful space with appropriate permissions
- (Optional) ElevenLabs API key for production use

## Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure the app**:
   - Run `npm start` to start the development server
   - Install the app in your Contentful space
   - Configure the app with:
     - **ElevenLabs API Key**: Your API key from [ElevenLabs](https://elevenlabs.io/app/speech-synthesis)
     - **Voice ID**: The ElevenLabs voice ID to use for generation
     - **Generate Audio Action ID**: (Optional) Specific App Action ID, or leave empty to auto-resolve
     - **Use Mock Audio Generator**: Enable to test without an API key

## Content Model Setup

The app expects entries with the following fields:

- **`body`** (Text/Long text field): The text content to convert to audio
- **`audioAsset`** (Media/Asset field): Where the generated audio asset will be stored

## Usage

1. **Open an entry** in Contentful that has the required fields (`body` and `audioAsset`)
2. **Open the Sidebar** location where the Broadcast app is installed
3. **Click "Generate Audio"** to convert the `body` field text into an audio file
4. The generated MP3 will be:
   - Uploaded to Contentful
   - Processed and published as an Asset
   - Automatically linked to the `audioAsset` field
   - Playable directly in the sidebar

## Development

### Available Scripts

- **`npm start`** or **`npm run dev`**: Start the development server with hot reload
- **`npm run build`**: Build the app for production (includes function build)
- **`npm run build:functions`**: Build only the Contentful Functions
- **`npm test`**: Run tests in watch mode
- **`npm run test:ci`**: Run tests once (for CI)
- **`npm run upload`**: Upload the built app to Contentful
- **`npm run upload-ci`**: Upload using environment variables (for CI/CD)

### CI/CD Deployment

For CI/CD pipelines, set these environment variables:

- `CONTENTFUL_ORG_ID`: Your Contentful organization ID
- `CONTENTFUL_APP_DEF_ID`: The app definition ID
- `CONTENTFUL_ACCESS_TOKEN`: A personal access token with appropriate permissions

### Project Structure

```
apps/broadcast/
├── functions/
│   └── generate-audio.ts      # App Action handler for audio generation
├── lib/
│   └── mock-audio.ts          # Mock audio generator for testing
├── src/
│   ├── locations/
│   │   ├── ConfigScreen.tsx   # App configuration UI
│   │   ├── Sidebar.tsx        # Main audio generation interface
│   │   └── ...                # Other location components
│   └── App.tsx                # Main app component
├── contentful-app-manifest.json  # Function definitions
└── package.json
```

## How It Works

1. **User triggers generation** from the Sidebar location
2. **Sidebar component** extracts text from the entry's `body` field
3. **App Action call** invokes the `generateAudio` function with:
   - Text content
   - Entry ID
   - Space/Environment IDs
   - Voice ID from configuration
4. **Function handler** (`generate-audio.ts`):
   - Calls ElevenLabs API (or uses mock audio)
   - Receives MP3 audio buffer
   - Uploads to Contentful via CMA
   - Creates an Asset with proper metadata
   - Processes and publishes the asset
   - Returns asset ID and URL
5. **Sidebar updates** the `audioAsset` field with the new asset

## Configuration

### App Installation Parameters

- **`elevenLabsApiKey`**: Your ElevenLabs API key (stored as secret)
- **`voiceId`**: The ElevenLabs voice ID to use
- **`generateAudioActionId`**: (Optional) Specific App Action ID
- **`useMockAi`**: Boolean flag to enable mock mode

### Function Configuration

The `generateAudio` function is configured in `contentful-app-manifest.json`:
- **Network Access**: Allows connections to Contentful and ElevenLabs APIs
- **Accepts**: `appaction.call` events

## Testing

The app includes test files for all location components. Run tests with:

```bash
npm test
```

Mock mode can be enabled in the configuration screen to test without an ElevenLabs API key.

## Libraries & Dependencies

- **[Forma 36](https://f36.contentful.com/)**: Contentful's design system and React components
- **[Contentful App SDK](https://www.contentful.com/developers/docs/extensibility/app-framework/sdk/)**: SDK for building Contentful apps
- **[Contentful Management API](https://www.contentful.com/developers/docs/references/content-management-api/)**: For creating and managing assets
- **[ElevenLabs API](https://elevenlabs.io/docs)**: Text-to-speech service

## Learn More

- [Contentful App Framework Documentation](https://www.contentful.com/developers/docs/extensibility/app-framework/)
- [Contentful Functions Documentation](https://www.contentful.com/developers/docs/extensibility/app-framework/functions/)
- [ElevenLabs Documentation](https://elevenlabs.io/docs)
