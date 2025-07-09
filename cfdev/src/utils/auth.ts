import { createClient } from 'contentful-management';
import inquirer from 'inquirer';
import chalk from 'chalk';

// TypeScript interfaces for API responses
export interface User {
  sys: {
    id: string;
    type: string;
    createdAt: string;
    updatedAt: string;
  };
  firstName: string;
  lastName: string;
  email: string;
  activated: boolean;
  confirmed: boolean;
  signInCount: number;
}

export interface AuthConfig {
  token: string;
  user?: User;
}

export interface AuthError extends Error {
  code?: string;
  status?: number;
  details?: any;
}

// Environment variable detection
export function getTokenFromEnvironment(): string | undefined {
  return process.env.CONTENTFUL_ACCESS_TOKEN;
}

// Secure token prompt function
export async function promptForToken(): Promise<string> {
  const answers = await inquirer.prompt([
    {
      type: 'password',
      name: 'token',
      message: 'Please enter your Contentful Management API token:',
      mask: '*',
      validate: (input: string) => {
        if (!input || input.trim().length === 0) {
          return 'Token cannot be empty';
        }
        if (input.length < 40) {
          return 'Token appears to be too short. Please check and try again.';
        }
        return true;
      }
    }
  ]);
  
  return answers.token.trim();
}

// Token validation with /users/me endpoint
export async function validateToken(token: string): Promise<User> {
  try {
    const client = createClient({
      accessToken: token
    });

    // Call /users/me endpoint to validate token
    const userProps = await client.getCurrentUser();
    
    // Convert to our User interface, handling missing optional properties
    const user: User = {
      sys: {
        id: userProps.sys.id,
        type: userProps.sys.type,
        createdAt: userProps.sys.createdAt,
        updatedAt: userProps.sys.updatedAt
      },
      firstName: userProps.firstName,
      lastName: userProps.lastName,
      email: userProps.email,
      activated: userProps.activated,
      confirmed: userProps.confirmed,
      signInCount: userProps.signInCount,

    };
    
    return user;
  } catch (error: any) {
    // Create detailed error for different scenarios
    const authError: AuthError = new Error('Token validation failed');
    
    if (error.response?.status === 401) {
      authError.message = 'Invalid or expired token. Please check your Contentful Management API token.';
      authError.code = 'INVALID_TOKEN';
      authError.status = 401;
    } else if (error.response?.status === 403) {
      authError.message = 'Token does not have sufficient permissions.';
      authError.code = 'INSUFFICIENT_PERMISSIONS';
      authError.status = 403;
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      authError.message = 'Network error. Please check your internet connection.';
      authError.code = 'NETWORK_ERROR';
    } else {
      authError.message = `Authentication failed: ${error.message}`;
      authError.code = 'AUTH_ERROR';
    }
    
    authError.details = error;
    throw authError;
  }
}

// Main authentication function that handles the complete flow
export async function authenticateUser(): Promise<AuthConfig> {
  let token: string | undefined;
  
  // First, try to get token from environment
  token = getTokenFromEnvironment();
  
  if (token) {
    console.log(chalk.blue('Found token in environment variable CONTENTFUL_ACCESS_TOKEN'));
    try {
      const user = await validateToken(token);
      console.log(chalk.green(`✓ Authenticated as ${user.firstName} ${user.lastName} (${user.email})`));
      return { token, user };
    } catch (error) {
      console.log(chalk.yellow('⚠ Environment token is invalid, prompting for new token...'));
      // Continue to prompt for token
    }
  }
  
  // If no environment token or it's invalid, prompt for token
  while (true) {
    try {
      token = await promptForToken();
      const user = await validateToken(token);
      console.log(chalk.green(`✓ Authenticated as ${user.firstName} ${user.lastName} (${user.email})`));
      return { token, user };
    } catch (error) {
      const authError = error as AuthError;
      console.log(chalk.red(`✗ ${authError.message}`));
      
      // Ask if user wants to try again
      const { retry } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'retry',
          message: 'Would you like to try entering the token again?',
          default: true
        }
      ]);
      
      if (!retry) {
        throw new Error('Authentication cancelled by user');
      }
    }
  }
}

// Helper function to check if token format looks valid
export function isValidTokenFormat(token: string): boolean {
  // Contentful tokens are typically 64 characters long and contain alphanumeric characters and hyphens
  const tokenRegex = /^[a-zA-Z0-9_-]{40,}$/;
  return tokenRegex.test(token);
}

// Helper function to mask token for display purposes
export function maskToken(token: string): string {
  if (token.length <= 8) {
    return '*'.repeat(token.length);
  }
  return token.substring(0, 4) + '*'.repeat(token.length - 8) + token.substring(token.length - 4);
} 