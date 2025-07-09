# Contentful CLI Tool - Technical Requirements

## Overview
Convert the existing Contentful space setup script into a user-friendly CLI tool for marketplace developers who are testing new apps. The tool should provide both automated setup workflows and granular management commands.

## Target Users
- **Primary**: Marketplace team developers testing new Contentful apps
- **Secondary**: Internal developers setting up development environments

## Core Requirements

### 1. User Interface Design
- **Interactive Prompts**: CLI tool prompts users for required parameters
- **Parameter Validation**: Validate inputs before making API calls
- **Error Handling**: Clear, actionable error messages
- **Progress Indicators**: Show progress for long-running operations

### 2. Required Parameters
The tool must collect these parameters from users:
- **Access Token**: Contentful management API token (from env var or prompt)
- **Organization ID**: Target Contentful organization (auto-fetched or manual entry)
- **App Name**: Name for the app definition and spaces
- **Team ID**: Team to assign admin privileges (auto-fetched or manual entry)
- **Environment ID**: Target environment (default: 'master')

### 3. Token Management and ID Fetching

#### Access Token Handling
1. **Environment Variable**: Check for `CONTENTFUL_ACCESS_TOKEN` first
2. **Interactive Prompt**: If env var not found, prompt user securely
3. **Token Validation**: Validate token by making a test API call
4. **Error Handling**: Clear error messages for invalid/expired tokens

#### Organization ID Fetching
1. **Auto-fetch**: Use access token to retrieve available organizations
2. **Interactive Selection**: Present numbered list of organizations
   ```
   Available Organizations:
   1. Acme Corp (6B7UvF9RgdtICSBSvSIUMY)
   2. Dev Team (8X2WqM5ThdpJFTBRuRJVLZ)
   ? Select organization (1-2): 
   ```
3. **Manual Override**: Option to enter organization ID manually
4. **Single Org**: If only one org available, auto-select with confirmation

#### Team ID Fetching
1. **Auto-fetch**: Use access token + org ID to retrieve available teams
2. **Interactive Selection**: Present numbered list of teams
   ```
   Available Teams in Acme Corp:
   1. Marketplace Team (3LQ6MMsQXIfb1oCg2W1RZ3)
   2. Engineering Team (9N4TpR7VkjqMGUCSwTKXM8)
   ? Select team (1-2):
   ```
3. **Manual Override**: Option to enter team ID manually
4. **Error Handling**: Handle cases where no teams are available

#### API Endpoints for Fetching
- **Organizations**: `GET /organizations`
- **Teams**: `GET /organizations/{organizationId}/teams`
- **Token Validation**: `GET /users/me` (validates token and gets user info)

### 4. Command Structure

#### Setup Commands

##### `cfdev setup`
**Description**: Complete automated setup workflow
**Actions**:
1. Create app definition for staging environment
2. Create app definition for production environment  
3. Create staging space: `{appName} (staging)`
4. Create production space: `{appName} (production)`
5. Add team to both spaces with admin privileges
6. Install app in both spaces
7. Display configuration links for both environments

**Output**: 
- Progress updates for each step
- Final configuration URLs for app definitions
- Summary of created resources

#### Management Commands

##### `cfdev create-app-definition`
**Description**: Create a new app definition
**Options**:
- Environment selection (staging/production/both)
- Custom app name override

##### `cfdev create-space`
**Description**: Create a new Contentful space
**Options**:
- Environment selection (staging/production/custom)
- Custom space name override

##### `cfdev add-team`
**Description**: Add team to existing space with admin privileges
**Requirements**:
- Space ID or space name selection
- Team ID

##### `cfdev install-app`
**Description**: Install app definition in existing space
**Requirements**:
- Space ID or space name selection
- App definition ID or app name selection

##### `cfdev delete-space`
**Description**: Delete a Contentful space
**Requirements**:
- Space ID or space name selection
- Confirmation prompt

##### `cfdev delete-app-definition`
**Description**: Delete an app definition
**Requirements**:
- App definition ID or app name selection
- Confirmation prompt

##### `cfdev uninstall-app`
**Description**: Uninstall app from space
**Requirements**:
- Space ID or space name selection
- App definition ID or app name selection

##### `cfdev remove-team`
**Description**: Remove team from space
**Requirements**:
- Space ID or space name selection
- Team ID
- Confirmation prompt

#### Utility Commands

##### `cfdev teardown`
**Description**: Delete all resources created by setup command
**Requirements**:
- App name to identify resources
- Confirmation prompt
- Option to delete selectively (spaces only, apps only, etc.)

##### `cfdev list`
**Description**: List existing resources
**Options**:
- `--spaces`: List all spaces in organization
- `--apps`: List all app definitions
- `--teams`: List all teams

##### `cfdev status`
**Description**: Check status of app setup
**Requirements**:
- App name
- Show which components exist/don't exist

## Technical Requirements

### 5. Configuration Management
- **Environment Variables**: Support `CONTENTFUL_ACCESS_TOKEN` for token
- **Session Memory**: Remember inputs during single CLI session
- **Secure Handling**: Never log or persist access tokens
- **Auto-fetching**: Retrieve available orgs/teams to reduce manual input

### 6. Error Handling
- **Token Validation**: Validate token before proceeding with operations
- **API Failures**: Handle network issues when fetching organizations/teams
- **Resource conflicts**: Handle existing spaces/apps gracefully
  - Prompt user to choose: skip, overwrite, or cancel
- **API errors**: Translate Contentful API errors to user-friendly messages
- **Network issues**: Retry logic with exponential backoff
- **Validation errors**: Pre-validate all inputs before API calls

### 7. User Experience
- **Progress indicators**: Show spinner/progress bars for API calls
- **Color coding**: Success (green), warnings (yellow), errors (red)
- **Confirmation prompts**: For destructive operations
- **Help system**: `--help` flag for all commands
- **Verbose mode**: `--verbose` flag for detailed output
- **Smart defaults**: Auto-select when only one option available

### 8. Output Format
- **Standard output**: Human-readable progress and results
- **JSON output**: `--json` flag for machine-readable output
- **Log levels**: Support for different verbosity levels
- **Configuration links**: Always display final setup URLs

## Implementation Considerations

### 9. Technology Stack
- **Runtime**: Node.js (compatible with existing codebase)
- **CLI Framework**: Commander.js or similar
- **Dependencies**: Reuse existing contentful-management library
- **Prompts**: Inquirer.js for interactive prompts

### 10. Distribution
- **Package manager**: npm (installable via `npm install -g cfdev`)
- **Binary name**: `cfdev`
- **Version management**: Semantic versioning

### 11. Code Organization
- **Modular design**: Reuse existing action files from `scripts/actions/`
- **Command separation**: Each command in separate file
- **Shared utilities**: Common functions for prompts, validation, output
- **Error boundaries**: Centralized error handling
- **Auth utilities**: Separate module for token management and ID fetching

## Success Criteria
1. **Ease of use**: Non-technical users can run setup without documentation
2. **Reliability**: Handles edge cases and API failures gracefully
3. **Speed**: Faster than manual setup through Contentful UI
4. **Discoverability**: Self-documenting with helpful error messages
5. **Maintainability**: Easy to add new commands and modify existing ones

## Future Enhancements
- Configuration file support for repeated use
- Integration with CI/CD pipelines
- Template system for different app types
- Batch operations for multiple apps
- Export/import functionality for space configurations 