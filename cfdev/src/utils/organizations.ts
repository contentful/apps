import { createClient } from 'contentful-management';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { AuthConfig } from './auth.js';

// TypeScript interfaces for Organization API responses
export interface Organization {
  sys: {
    id: string;
    type: string;
    createdAt: string;
    updatedAt: string;
  };
  name: string;
}

export interface OrganizationCollection {
  sys: {
    type: string;
  };
  total: number;
  skip: number;
  limit: number;
  items: Organization[];
}

export interface OrganizationConfig {
  organizationId: string;
  organization?: Organization;
}

export interface OrganizationError extends Error {
  code?: string;
  status?: number;
  details?: any;
}

// Function to fetch available organizations
export async function fetchOrganizations(authConfig: AuthConfig): Promise<Organization[]> {
  try {
    const client = createClient({
      accessToken: authConfig.token
    });

    // Call the organizations endpoint
    const organizationCollection = await client.getOrganizations();
    
    // Return the organizations array
    return organizationCollection.items;
  } catch (error: any) {
    // Create detailed error for different scenarios
    const orgError: OrganizationError = new Error('Failed to fetch organizations');
    
    if (error.response?.status === 401) {
      orgError.message = 'Invalid or expired token. Cannot fetch organizations.';
      orgError.code = 'INVALID_TOKEN';
      orgError.status = 401;
    } else if (error.response?.status === 403) {
      orgError.message = 'Token does not have sufficient permissions to access organizations.';
      orgError.code = 'INSUFFICIENT_PERMISSIONS';
      orgError.status = 403;
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      orgError.message = 'Network error. Please check your internet connection.';
      orgError.code = 'NETWORK_ERROR';
    } else {
      orgError.message = `Failed to fetch organizations: ${error.message}`;
      orgError.code = 'FETCH_ERROR';
    }
    
    orgError.details = error;
    throw orgError;
  }
}

// Interactive organization selection with numbered list
export async function selectOrganizationInteractively(organizations: Organization[]): Promise<Organization> {
  console.log(chalk.blue('\nAvailable Organizations:'));
  
  // Display numbered list of organizations
  organizations.forEach((org, index) => {
    console.log(`${index + 1}. ${org.name} (${org.sys.id})`);
  });
  
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'selection',
      message: `Select organization (1-${organizations.length}):`,
      validate: (input: string) => {
        const num = parseInt(input, 10);
        if (isNaN(num) || num < 1 || num > organizations.length) {
          return `Please enter a number between 1 and ${organizations.length}`;
        }
        return true;
      }
    }
  ]);
  
  const selectedIndex = parseInt(answers.selection, 10) - 1;
  return organizations[selectedIndex];
}

// Manual organization ID override option
export async function promptForManualOrganizationId(): Promise<string> {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'organizationId',
      message: 'Enter organization ID manually:',
      validate: (input: string) => {
        if (!input || input.trim().length === 0) {
          return 'Organization ID cannot be empty';
        }
        // Basic validation for Contentful ID format (alphanumeric and hyphens)
        const idRegex = /^[a-zA-Z0-9_-]+$/;
        if (!idRegex.test(input.trim())) {
          return 'Organization ID contains invalid characters';
        }
        return true;
      }
    }
  ]);
  
  return answers.organizationId.trim();
}

// Handle single organization auto-selection
export async function handleSingleOrganization(organization: Organization): Promise<Organization> {
  console.log(chalk.green(`\nFound single organization: ${organization.name} (${organization.sys.id})`));
  
  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Use this organization?',
      default: true
    }
  ]);
  
  if (!confirm) {
    throw new Error('Organization selection cancelled by user');
  }
  
  return organization;
}

// Main function to get organization ID with all the logic
export async function getOrganizationId(authConfig: AuthConfig): Promise<OrganizationConfig> {
  try {
    console.log(chalk.blue('Fetching available organizations...'));
    const organizations = await fetchOrganizations(authConfig);
    
    if (organizations.length === 0) {
      throw new Error('No organizations found. Please check your account permissions.');
    }
    
    let selectedOrganization: Organization;
    
    if (organizations.length === 1) {
      // Handle single organization auto-selection
      selectedOrganization = await handleSingleOrganization(organizations[0]);
    } else {
      // Present selection options
      console.log(chalk.yellow('\nMultiple organizations found.'));
      
      const { choice } = await inquirer.prompt([
        {
          type: 'list',
          name: 'choice',
          message: 'How would you like to select an organization?',
          choices: [
            { name: 'Select from list', value: 'select' },
            { name: 'Enter organization ID manually', value: 'manual' }
          ]
        }
      ]);
      
      if (choice === 'select') {
        selectedOrganization = await selectOrganizationInteractively(organizations);
      } else {
        // Manual override
        const manualId = await promptForManualOrganizationId();
        
        // Check if manually entered ID exists in the fetched organizations
        const manualOrg = organizations.find(org => org.sys.id === manualId);
        if (manualOrg) {
          selectedOrganization = manualOrg;
        } else {
          console.log(chalk.yellow(`Organization ID ${manualId} not found in your available organizations.`));
          console.log(chalk.yellow('Proceeding with manual ID (this may fail if the ID is invalid).'));
          
          // Create a minimal organization object for the manual ID
          selectedOrganization = {
            sys: {
              id: manualId,
              type: 'Organization',
              createdAt: '',
              updatedAt: ''
            },
            name: 'Manual Entry'
          };
        }
      }
    }
    
    console.log(chalk.green(`✓ Selected organization: ${selectedOrganization.name} (${selectedOrganization.sys.id})`));
    
    return {
      organizationId: selectedOrganization.sys.id,
      organization: selectedOrganization
    };
    
  } catch (error) {
    const orgError = error as OrganizationError;
    console.log(chalk.red(`✗ ${orgError.message}`));
    throw orgError;
  }
}

// Helper function to validate organization ID format
export function isValidOrganizationIdFormat(organizationId: string): boolean {
  // Contentful organization IDs are typically alphanumeric with hyphens and underscores
  const idRegex = /^[a-zA-Z0-9_-]+$/;
  return idRegex.test(organizationId) && organizationId.length > 0;
}

// Helper function to get organization by ID from a list
export function findOrganizationById(organizations: Organization[], organizationId: string): Organization | undefined {
  return organizations.find(org => org.sys.id === organizationId);
} 