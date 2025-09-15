# Amplitude Analytics Integration

A Contentful app that integrates with Amplitude Analytics to track and analyze user behavior and content performance.

## Features

- **Entry Tracking**: Automatically track when content entries are viewed or modified
- **Custom Events**: Send custom analytics events to Amplitude
- **Real-time Analytics**: View event counts and tracking status in the sidebar
- **Secure Configuration**: Secure storage of Amplitude API credentials

## Installation

1. Install the app in your Contentful space
2. Configure your Amplitude credentials:
   - API Key
   - Secret Key  
   - Project ID

## Usage

### Configuration Screen
Set up your Amplitude credentials in the app configuration screen. You'll need:
- Your Amplitude API Key
- Your Amplitude Secret Key (kept secure)
- Your Amplitude Project ID

### Sidebar Widget
The sidebar provides:
- Current event count for the session
- Manual page view tracking
- Custom event tracking
- Last event timestamp

## Console Logging

This app includes comprehensive console logging for debugging and monitoring:

- 🚀 App initialization and bootstrap process
- 📍 Location detection and component routing
- ⚙️ Configuration screen operations
- 📊 Analytics event tracking
- 🔍 Validation and error handling
- 📝 User interactions and state changes

Check your browser's developer console to see detailed logging information.

## Development

```bash
npm install
npm start
```

## Build

```bash
npm run build
```

This creates a `build` directory with the compiled app ready for deployment.
