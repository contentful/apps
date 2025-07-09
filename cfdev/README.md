# cfdev CLI Tool

A TypeScript-based CLI tool for Contentful app development and space management.

## Features

- 🔐 **Authentication**: Secure token management with environment variable support
- 🏗️ **Setup Workflow**: Complete automated setup for app definitions and spaces
- 📱 **App Management**: Create, install, and manage app definitions
- 🏠 **Space Management**: Create, configure, and manage Contentful spaces
- 👥 **Team Management**: Add and manage team access to spaces
- 🔧 **Developer Tools**: Status checking, listing, and teardown commands

## Installation

```bash
npm install -g cfdev
```

Or run directly with npx:

```bash
npx cfdev --help
```

## Development

### Prerequisites

- Node.js 14.0.0 or higher
- npm or yarn
- Contentful Management API token

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

4. Run tests:
   ```bash
   npm test
   ```

### Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm run build:watch` - Watch mode compilation
- `npm run start` - Build and run the CLI
- `npm run dev` - Development mode with watch
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run lint` - Run ESLint
- `npm run clean` - Clean build artifacts

## Usage

### Authentication

The CLI supports multiple authentication methods:

1. **Environment Variable** (recommended):
   ```bash
   export CONTENTFUL_ACCESS_TOKEN=your_token_here
   cfdev setup
   ```

2. **Interactive Prompt**:
   ```bash
   cfdev setup
   # You'll be prompted for your token
   ```

### Available Commands

- `cfdev setup` - Complete automated setup workflow
- `cfdev create-app-definition` - Create a new app definition
- `cfdev create-space` - Create a new Contentful space
- `cfdev add-team` - Add team to existing space
- `cfdev install-app` - Install app definition in space
- `cfdev delete-space` - Delete a Contentful space
- `cfdev delete-app-definition` - Delete an app definition
- `cfdev uninstall-app` - Uninstall app from space
- `cfdev remove-team` - Remove team from space
- `cfdev teardown` - Delete all resources created by setup
- `cfdev list` - List existing resources
- `cfdev status` - Check status of app setup

### Examples

```bash
# Complete setup workflow
cfdev setup

# List all spaces
cfdev list --spaces

# Create a new space
cfdev create-space

# Check status
cfdev status
```

## Project Structure

```
cfdev/
├── src/
│   ├── cli.ts          # CLI entry point
│   ├── index.ts        # Command setup
│   └── utils/
│       └── auth.ts     # Authentication utilities
├── tests/
│   ├── cli.test.ts     # CLI tests
│   ├── commands.test.ts # Command tests
│   └── utils/
│       └── auth.test.ts # Auth tests
├── dist/               # Compiled JavaScript
├── coverage/           # Test coverage reports
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

MIT

## Support

For issues and questions, please open an issue on the GitHub repository. 