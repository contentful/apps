# Broadcast - Voice & Video Studio

A Contentful App that generates audio voiceovers from entry text using ElevenLabs text-to-speech API. The app converts text content into MP3 audio files and automatically uploads them as Contentful Assets. It also renders social-ready MP4 videos on the client and provides a usage metrics dashboard to monitor your ElevenLabs subscription usage.

## Features

- **Text-to-Speech Generation**: Converts text from Contentful entries into high-quality MP3 audio files using ElevenLabs API
- **Usage Metrics Dashboard**: Monitor your ElevenLabs subscription usage, character limits, and billing cycle information
- **Generation Activity Logging**: Automatic logging of all generation attempts with detailed analytics including success rates, latency distribution, and usage by content type and author (supports paginated log retrieval)
- **Mock Mode**: Test audio generation without an API key using mock audio samples
- **Automatic Asset Management**: Creates, processes, and publishes audio assets directly in Contentful
- **Sidebar Integration**: Easy-to-use sidebar interface for generating audio from entry content
- **Text-to-Video Rendering**: Combines generated audio with a featured image to create an MP4 audiogram on the frontend (ffmpeg.wasm)
- **Configurable Voice**: Configure default ElevenLabs voice IDs per installation
- **Author-Based Voice Resolution**: Automatically resolve voice IDs from linked author profiles when available
- **Multi-locale Support**: Generate audio for specific locales with locale selection
- **Retry Logic**: Automatic retry handling for concurrent entry updates

## Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Components**: Forma 36 (Contentful's design system)
- **Testing**: Vitest with React Testing Library
- **Video Rendering**: ffmpeg.wasm runs in the browser to avoid serverless timeouts

### Backend
- **Runtime**: Contentful Functions (Node.js)
- **SDK**: `@contentful/node-apps-toolkit` for App Actions
- **API Integration**: ElevenLabs Text-to-Speech API and Subscription API
- **Asset Management**: Contentful Management API (CMA)
- **Architecture**: Modular function structure with separated concerns (constants, Contentful operations, ElevenLabs integration, logging)

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
- **`featuredImage`** or **`image`** (Media/Asset field): The still image used to render social videos
- **`videoAsset`** (Media/Asset field): Where the generated video asset will be stored (optional but recommended)
- **`author`** (Reference/Entry field): Optional reference to an author entry that can supply a voice override

### Author Profiles

If your content model includes an author reference, the app will attempt to resolve the linked author entry
and use its voice configuration before falling back to the installation default.

- **`voiceId`** (Text field): Optional ElevenLabs voice ID to override the default

### Generation Logging Content Type

The app automatically creates a content type (`broadcastAudioGenerationLog`) to track generation attempts. This content type includes:

- Entry ID and locale
- Character count and voice ID used
- Success/failure status
- Content type ID and author entry ID (for analytics)
- Latency measurements

This content type is created automatically on first use and is used by the usage dashboard to display generation activity analytics.

## Usage

### Generating Audio

1. **Open an entry** in Contentful that has the required fields (`body` and `audioAsset`)
2. **Open the Sidebar** location where the Broadcast app is installed
3. **Select the target locale** from the dropdown (defaults to the space's default locale)
4. **Click "Generate Audio"** to convert the `body` field text into an audio file
5. The generated MP3 will be:
   - Uploaded to Contentful
   - Processed and published as an Asset
   - Automatically linked to the `audioAsset` field for the selected locale
   - Playable directly in the sidebar

### Generating Social Video

1. **Ensure fields exist**: `audioAsset` (generated), `featuredImage` or `image`, and `videoAsset`
2. **Open the Sidebar** and scroll to the Social Video section
3. **Click "Generate Social Video"**
4. The app will:
   - Download the published audio asset and image
   - Render an MP4 in the browser with ffmpeg.wasm
   - Upload, process, and publish the video asset
   - Link the result to `videoAsset` (if the field exists)

Note: The audio and image assets must be published and accessible by the browser (CORS). If assets are unpublished or private, rendering will fail.

### Viewing Usage Metrics

1. **Navigate to the Page location** where the Broadcast app is installed
2. View your ElevenLabs subscription metrics including:
   - Current character usage vs. limit
   - Usage percentage with visual progress bar
   - Subscription tier
   - Next billing cycle reset date
   - Detailed metrics table
3. **View generation activity** with analytics including:
- Total attempts, success/failure counts, and success rate
- Average latency and latency distribution buckets
- Top content types by character usage
- Top authors by character usage
- Filter by time period: Current billing cycle, Last 30 days, or All time
- Log pagination beyond the first 1,000 entries (up to 5,000 per view)

## Development

### Available Scripts

- **`npm start`** or **`npm run dev`**: Start the development server with hot reload
- **`npm run build`**: Build the app for production (includes function build)
- **`npm run build:functions`**: Build only the Contentful Functions
- **`npm run preview`**: Preview the production build locally
- **`npm test`**: Run tests in watch mode
- **`npm run test:ci`**: Run tests once (for CI)
- **`npm run upload`**: Upload the built app to Contentful
- **`npm run upload-ci`**: Upload using environment variables (for CI/CD)
- **`npm run create-app-definition`**: Create a new app definition in Contentful
- **`npm run add-locations`**: Add new locations to the app

### CI/CD Deployment

For CI/CD pipelines, set these environment variables:

- `CONTENTFUL_ORG_ID`: Your Contentful organization ID
- `CONTENTFUL_APP_DEF_ID`: The app definition ID
- `CONTENTFUL_ACCESS_TOKEN`: A personal access token with appropriate permissions

### Project Structure

```
apps/broadcast/
├── functions/
│   ├── generate-audio.ts      # Main App Action handler for audio generation
│   ├── generate-audio/        # Modular helper modules
│   │   ├── constants.ts       # Field IDs and content type constants
│   │   ├── contentful.ts      # Contentful CMA operations and field resolution
│   │   ├── elevenlabs.ts      # ElevenLabs API integration
│   │   ├── logging.ts         # Generation attempt logging to Contentful
│   │   └── types.ts           # TypeScript type definitions
│   ├── get-usage-metrics.ts   # App Action handler for usage metrics
│   └── tsconfig.json          # TypeScript config for functions
├── lib/
│   └── mock-audio.ts          # Mock audio generator for testing
├── src/
│   ├── hooks/
│   │   └── useVideoGenerator.ts # ffmpeg.wasm video renderer
│   ├── lib/
│   │   └── contentful-upload.ts # CMA upload helper for video assets
│   ├── components/
│   │   ├── ProgressBar.tsx    # Usage progress bar component
│   │   └── LocalhostWarning.tsx
│   ├── locations/
│   │   ├── ConfigScreen.tsx   # App configuration UI
│   │   ├── Sidebar.tsx        # Main audio generation interface
│   │   ├── Page.tsx           # Usage metrics dashboard with activity logs
│   │   ├── EntryEditor.tsx    # Entry editor location (placeholder, not registered)
│   │   ├── Home.tsx           # Home location (placeholder, not registered)
│   │   ├── Field.tsx          # Field location (placeholder, not registered)
│   │   ├── Dialog.tsx         # Dialog location (placeholder, not registered)
│   │   └── *.spec.tsx         # Test files for components
│   ├── App.tsx                # Main app component with location routing
│   ├── index.tsx              # App entry point
│   └── setupTests.ts          # Test setup configuration
├── test/
│   └── mocks/                 # Test mocks for SDK and CMA
├── public/
│   └── ffmpeg-core.worker.js  # Stub worker (single-threaded ffmpeg-core)
├── contentful-app-manifest.json  # App manifest with functions and actions
├── vite.config.mts            # Vite configuration
├── tsconfig.json              # TypeScript configuration
└── package.json
```

**Note**: Only `ConfigScreen`, `Sidebar`, and `Page` locations are registered in the manifest and actively used. Other location components (`EntryEditor`, `Home`, `Field`, `Dialog`) exist in the codebase but are not registered in the manifest.

## How It Works

### Audio Generation Flow

1. **User triggers generation** from the Sidebar location
2. **Sidebar component** extracts text from the entry's `body` field for the selected locale
3. **App Action call** invokes the `generateAudio` function with:
   - Entry ID
   - Target field ID (`audioAsset`)
   - Target locale
   - Voice ID from configuration (optional override)
4. **Function handler** (`generate-audio.ts`):
   - Validates required parameters and locale availability
   - Retrieves the entry and content type metadata
   - Resolves field localization settings for `body` and `audioAsset` fields
   - Resolves the linked author entry (if present) and reads its `voiceId` field
   - Determines effective voice ID (author override > request > installation default)
   - Extracts localized text from the `body` field with fallback logic
   - Calls ElevenLabs API (or uses mock audio if enabled)
   - Receives MP3 audio buffer
   - Uploads to Contentful via CMA
   - Creates or updates an Asset with proper metadata (handles existing assets)
   - Processes and publishes the asset
   - Links the asset to the entry's `audioAsset` field for the target locale with retry logic for concurrent updates
   - Logs the generation attempt (success or failure) to Contentful
   - Returns asset ID and URL
5. **Sidebar displays** the generated audio player and opens the entry

### Usage Metrics Flow

1. **User navigates** to the Page location
2. **Page component** automatically fetches usage metrics on load
3. **App Action call** invokes the `getUsageMetrics` function
4. **Function handler** (`get-usage-metrics.ts`):
   - Calls ElevenLabs Subscription API
   - Retrieves character usage, limits, tier, and reset date
   - Returns formatted metrics data
5. **Page component** also fetches generation logs:
   - Queries the `broadcastAudioGenerationLog` content type
   - Filters by selected time period (current cycle, last 30 days, or all time)
   - Resolves content type and author names for display
   - Calculates statistics: success rate, latency distribution, top content types, top authors
6. **Page displays** metrics with visual progress indicators, detailed tables, and generation activity analytics

### Video Generation Flow

1. **User triggers video render** from the Sidebar
2. **Sidebar resolves assets** for the selected locale:
   - Audio from `audioAsset` (must be published and CORS-accessible)
   - Image from `featuredImage` or `image` (must be published and CORS-accessible)
3. **Frontend downloads assets** via fetch with CORS mode
4. **Frontend renders MP4** with ffmpeg.wasm:
   - Uses single-threaded core (`ffmpeg-core.wasm`) for iframe compatibility (avoids SharedArrayBuffer requirements)
   - Generates audio waveform visualization overlay
   - Applies Ken Burns zoom effect (if enabled) to the still image
   - Combines audio and image into MP4 video
5. **Upload helper** (`contentful-upload.ts`) creates, processes, and publishes a new video Asset via CMA
6. **Entry update** links the Asset to `videoAsset` field when present (shows warning if field is missing)

## Configuration

### App Installation Parameters

- **`elevenLabsApiKey`**: Your ElevenLabs API key (stored as secret)
- **`voiceId`**: The ElevenLabs voice ID to use
- **`generateAudioActionId`**: (Optional) Specific App Action ID
- **`useMockAi`**: Boolean flag to enable mock mode
- **`waveformColor`**: Hex color for the waveform overlay (default: `white`, example: `#FFFFFF`)
- **`waveformOpacity`**: Opacity for the waveform overlay (default: `0.9`, range: 0-1)
- **`kenBurnsEnabled`**: Toggle the Ken Burns zoom effect for video rendering (default: `false`)
- **`kenBurnsZoomIncrement`**: Per-frame zoom increment (default: `0.0005`)
- **`kenBurnsMaxZoom`**: Maximum zoom level (default: `1.5`)

### Function Configuration

Both functions are configured in `contentful-app-manifest.json`:

**`generateAudio` function:**
- **Network Access**: Allows connections to Contentful, ElevenLabs, and GitHub APIs
- **Accepts**: `appaction.call` events
- **Parameters**: `entryId`, `fieldId`, `targetLocale`, `voiceId` (optional)
- **Features**: 
  - Automatic content type creation for generation logs
  - Retry logic for concurrent entry updates
  - Comprehensive error handling and logging
  - Author-based voice resolution with fallback chain

**`getUsageMetricsFn` function:**
- **Network Access**: Allows connections to ElevenLabs API
- **Accepts**: `appaction.call` events
- **Parameters**: None (uses installation parameters)
- **Error Handling**: Gracefully handles missing API keys and provider errors

## Testing

The app includes comprehensive test files for all location components using Vitest and React Testing Library. Run tests with:

```bash
npm test          # Run tests in watch mode
npm run test:ci   # Run tests once (for CI)
```

Test files are located alongside their components:
- `src/locations/*.spec.tsx` - Component tests
- `test/mocks/` - Mock implementations for SDK and CMA

Mock mode can be enabled in the configuration screen to test audio generation without an ElevenLabs API key. Note that usage metrics require a valid API key with appropriate permissions (Administration > User > Read for restricted keys).

The app includes comprehensive test coverage for all active location components (`ConfigScreen`, `Sidebar`, `Page`) using Vitest and React Testing Library. Test files are co-located with their components (`.spec.tsx` files).

## Libraries & Dependencies

- **[Forma 36](https://f36.contentful.com/)**: Contentful's design system and React components (`@contentful/f36-components`, `@contentful/f36-tokens`, `@contentful/f36-icons`)
- **[Contentful App SDK](https://www.contentful.com/developers/docs/extensibility/app-framework/sdk/)**: SDK for building Contentful apps (`@contentful/app-sdk`)
- **[Contentful React Apps Toolkit](https://www.npmjs.com/package/@contentful/react-apps-toolkit)**: React hooks and utilities for Contentful apps
- **[Contentful Management API](https://www.contentful.com/developers/docs/references/content-management-api/)**: For creating and managing assets (`contentful-management`)
- **[Contentful Node Apps Toolkit](https://www.npmjs.com/package/@contentful/node-apps-toolkit)**: For building Contentful Functions
- **[ElevenLabs API](https://elevenlabs.io/docs)**: Text-to-speech service and subscription management
- **[ffmpeg.wasm](https://ffmpegwasm.netlify.app/)**: WebAssembly-based video processing (`@ffmpeg/ffmpeg`, `@ffmpeg/core`)
- **[Vite](https://vitejs.dev/)**: Build tool and development server
- **[Vitest](https://vitest.dev/)**: Testing framework with React Testing Library

## Learn More

- [Contentful App Framework Documentation](https://www.contentful.com/developers/docs/extensibility/app-framework/)
- [Contentful Functions Documentation](https://www.contentful.com/developers/docs/extensibility/app-framework/functions/)
- [ElevenLabs Documentation](https://elevenlabs.io/docs)
