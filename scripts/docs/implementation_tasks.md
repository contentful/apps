# cfdev CLI Tool - Implementation Tasks

## Project Overview
Convert the existing Contentful space setup script into a CLI tool called `cfdev` with automated setup workflows and granular management commands.

**Tech Stack**: TypeScript, Node.js, Commander.js

## Phase 1: Project Foundation & Setup

### Task 1.1: Project Structure Setup
- [x] Create new directory structure for CLI tool
- [x] Initialize `package.json` with proper metadata
- [x] Set up TypeScript configuration (`tsconfig.json`)
- [x] Configure build scripts for TypeScript compilation
- [x] Create `.gitignore` for node_modules, logs, dist, etc.
- [x] Set up basic CLI entry point (`bin/cfdev.js` → compiled from `src/cli.ts`)

### Task 1.2: Core Dependencies
- [x] Install TypeScript and @types packages
- [x] Install Commander.js for CLI framework
- [x] Install Inquirer.js for interactive prompts
- [x] Install chalk for colored output
- [x] Install ora for progress spinners
- [x] Install existing contentful-management library
- [x] Install @types for all dependencies
- [x] Configure package.json bin field for global installation

### Task 1.3: Basic CLI Framework
- [x] Create main CLI entry point with Commander.js (TypeScript)
- [x] Set up basic command structure and help system
- [x] Implement `--version` flag
- [x] Create stub commands for all planned features
- [x] Set up build pipeline (TypeScript → JavaScript)
- [x] Test global installation with `npm link`

### Task 1.4: Unit Tests for CLI Framework
- [x] Set up Jest with TypeScript support for CLI testing
- [x] Create test utilities for CLI command testing
- [x] Write tests for CLI entry point (`src/cli.ts`)
- [x] Write tests for command setup function (`src/index.ts`)
- [x] Write tests for version flag functionality
- [x] Write tests for help system and command descriptions
- [x] Write tests for command parsing and execution
- [x] Write tests for all stub commands (setup, create-*, delete-*, etc.)
- [x] Add test coverage reporting
- [x] Set up test scripts in package.json

## Phase 2: Authentication & ID Fetching

### Task 2.1: Token Management Utilities
- [ ] Create `utils/auth.ts` module with proper TypeScript types
- [ ] Implement environment variable detection (`CONTENTFUL_ACCESS_TOKEN`)
- [ ] Create secure token prompt function
- [ ] Implement token validation with `/users/me` endpoint
- [ ] Add error handling for invalid/expired tokens
- [ ] Define TypeScript interfaces for API responses

### Task 2.2: Organization ID Fetching
- [ ] Create function to fetch available organizations with types
- [ ] Implement interactive organization selection with numbered list
- [ ] Add manual organization ID override option
- [ ] Handle single organization auto-selection
- [ ] Add error handling for API failures
- [ ] Define Organization interface/types

### Task 2.3: Team ID Fetching
- [ ] Create function to fetch teams for selected organization
- [ ] Implement interactive team selection with numbered list
- [ ] Add manual team ID override option
- [ ] Handle cases with no available teams
- [ ] Add error handling for API failures
- [ ] Define Team interface/types

### Task 2.4: Parameter Collection Flow
- [ ] Create unified parameter collection function with TypeScript
- [ ] Implement session memory for collected parameters
- [ ] Add parameter validation before API operations
- [ ] Create parameter display/confirmation step
- [ ] Define Config interface for all parameters

## Phase 3: Core Action Functions

### Task 3.1: Refactor Existing Actions
- [ ] Convert existing actions to TypeScript
- [ ] Update `actions/createAppDefinition.ts` for CLI use
- [ ] Update `actions/createSpace.ts` for CLI use
- [ ] Update `actions/addTeamToSpace.ts` for CLI use
- [ ] Update `actions/installApp.ts` for CLI use
- [ ] Add consistent error handling to all actions
- [ ] Add progress reporting to all actions
- [ ] Add proper TypeScript return types

### Task 3.2: Delete Operations
- [ ] Convert to TypeScript: `actions/deleteSpace.ts`
- [ ] Convert to TypeScript: `actions/deleteAppDefinition.ts`
- [ ] Convert to TypeScript: `actions/uninstallApp.ts`
- [ ] Convert to TypeScript: `actions/deleteTeamSpaceMembership.ts`
- [ ] Add confirmation prompts for destructive operations
- [ ] Add proper TypeScript typing

### Task 3.3: Utility Functions
- [ ] Create functions to list spaces, apps, teams (TypeScript)
- [ ] Create status checking functions
- [ ] Add resource lookup by name (not just ID)
- [ ] Implement resource filtering and searching
- [ ] Define interfaces for all resource types

## Phase 4: Command Implementation

### Task 4.1: Setup Command
- [ ] Implement `cfdev setup` command in TypeScript
- [ ] Add parameter collection flow
- [ ] Create staging and production app definitions
- [ ] Create staging and production spaces
- [ ] Add teams to both spaces
- [ ] Install apps in both spaces
- [ ] Display final configuration URLs
- [ ] Add comprehensive error handling and rollback

### Task 4.2: Management Commands
- [ ] Implement `cfdev create-app-definition` command (TypeScript)
- [ ] Implement `cfdev create-space` command (TypeScript)
- [ ] Implement `cfdev add-team` command (TypeScript)
- [ ] Implement `cfdev install-app` command (TypeScript)
- [ ] Add environment selection options (staging/production/both)
- [ ] Add custom name override options

### Task 4.3: Delete Commands
- [ ] Implement `cfdev delete-space` command with confirmation (TypeScript)
- [ ] Implement `cfdev delete-app-definition` command with confirmation (TypeScript)
- [ ] Implement `cfdev uninstall-app` command (TypeScript)
- [ ] Implement `cfdev remove-team` command with confirmation (TypeScript)
- [ ] Add safety checks and warnings

### Task 4.4: Utility Commands
- [ ] Implement `cfdev list` command with filtering options (TypeScript)
- [ ] Implement `cfdev status` command (TypeScript)
- [ ] Implement `cfdev teardown` command with selective deletion (TypeScript)
- [ ] Add resource status indicators and summaries

## Phase 5: User Experience & Polish

### Task 5.1: Progress Indicators
- [ ] Add spinners for API calls using ora
- [ ] Implement progress bars for multi-step operations
- [ ] Add step-by-step progress reporting
- [ ] Create consistent loading states

### Task 5.2: Output Formatting
- [ ] Implement colored output with chalk
- [ ] Add success/warning/error color coding
- [ ] Create consistent output formatting
- [ ] Add `--json` flag for machine-readable output
- [ ] Implement verbose mode with `--verbose` flag

### Task 5.3: Error Handling & Recovery
- [ ] Create centralized error handling system
- [ ] Implement user-friendly error messages
- [ ] Add API error translation
- [ ] Create retry logic with exponential backoff
- [ ] Add graceful handling of resource conflicts

### Task 5.4: Input Validation
- [ ] Add token format validation
- [ ] Implement ID format validation
- [ ] Add app name validation (length, characters)
- [ ] Create pre-flight checks before operations
- [ ] Add confirmation for destructive operations

## Phase 6: Testing & Quality

### Task 6.1: Unit Testing
- [ ] Set up Jest with TypeScript support
- [ ] Write tests for authentication utilities
- [ ] Write tests for all action functions
- [ ] Write tests for parameter validation
- [ ] Write tests for error handling scenarios

### Task 6.2: Integration Testing
- [ ] Create test Contentful organization for testing
- [ ] Write end-to-end tests for setup command
- [ ] Write tests for all management commands
- [ ] Write tests for teardown and cleanup
- [ ] Add API mocking for isolated tests

### Task 6.3: Documentation
- [ ] Write comprehensive README.md
- [ ] Create usage examples and tutorials
- [ ] Document all command options and flags
- [ ] Add troubleshooting guide
- [ ] Create developer contributing guide

## Phase 7: Distribution & Deployment

### Task 7.1: Package Preparation
- [ ] Configure TypeScript build for production
- [ ] Optimize package.json for npm publishing
- [ ] Create proper .npmignore file
- [ ] Add license file (MIT recommended)
- [ ] Create proper semver versioning strategy
- [ ] Add keywords and description for npm discovery


## Maintenance & Future Enhancements

### Task 9.1: Monitoring & Support
- [ ] Set up error tracking/monitoring
- [ ] Create support documentation


## TypeScript Configuration Notes

- **Target**: ES2020 or later for modern Node.js features
- **Module**: CommonJS for Node.js compatibility
- **Strict Mode**: Enabled for better type safety
- **Source Maps**: Enabled for debugging
- **Declaration Files**: Generated for potential library use
- **Build Output**: `dist/` directory for compiled JavaScript 