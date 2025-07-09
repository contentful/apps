/// <reference types="jest" />

import { createClient } from 'contentful-management';
import inquirer from 'inquirer';
import chalk from 'chalk';
import {
  Organization,
  OrganizationConfig,
  OrganizationError,
  fetchOrganizations,
  selectOrganizationInteractively,
  promptForManualOrganizationId,
  handleSingleOrganization,
  getOrganizationId,
  isValidOrganizationIdFormat,
  findOrganizationById
} from '../../src/utils/organizations';
import { AuthConfig } from '../../src/utils/auth';

// Mock dependencies
jest.mock('contentful-management');
jest.mock('inquirer');
jest.mock('chalk', () => ({
  blue: jest.fn((text) => text),
  green: jest.fn((text) => text),
  yellow: jest.fn((text) => text),
  red: jest.fn((text) => text)
}));

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;
const mockInquirer = inquirer as jest.Mocked<typeof inquirer>;

describe('Organization Utilities', () => {
  let consoleSpy: jest.SpyInstance;

  const mockAuthConfig: AuthConfig = {
    token: 'test-token',
    user: {
      sys: {
        id: 'user-id',
        type: 'User',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      },
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      activated: true,
      confirmed: true,
      signInCount: 1
    }
  };

  const mockOrganizations: Organization[] = [
    {
      sys: {
        id: 'org-1',
        type: 'Organization',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      },
      name: 'Acme Corp'
    },
    {
      sys: {
        id: 'org-2',
        type: 'Organization',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      },
      name: 'Dev Team'
    }
  ];

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('fetchOrganizations', () => {
    it('should fetch organizations successfully', async () => {
      const mockClient = {
        getOrganizations: jest.fn().mockResolvedValue({
          items: mockOrganizations
        })
      };
      
      mockCreateClient.mockReturnValue(mockClient as any);

      const result = await fetchOrganizations(mockAuthConfig);

      expect(createClient).toHaveBeenCalledWith({
        accessToken: 'test-token'
      });
      expect(mockClient.getOrganizations).toHaveBeenCalled();
      expect(result).toEqual(mockOrganizations);
    });

    it('should handle 401 authentication error', async () => {
      const mockClient = {
        getOrganizations: jest.fn().mockRejectedValue({
          response: { status: 401 }
        })
      };
      
      mockCreateClient.mockReturnValue(mockClient as any);

      await expect(fetchOrganizations(mockAuthConfig)).rejects.toThrow(
        'Invalid or expired token. Cannot fetch organizations.'
      );
    });

    it('should handle 403 permission error', async () => {
      const mockClient = {
        getOrganizations: jest.fn().mockRejectedValue({
          response: { status: 403 }
        })
      };
      
      mockCreateClient.mockReturnValue(mockClient as any);

      await expect(fetchOrganizations(mockAuthConfig)).rejects.toThrow(
        'Token does not have sufficient permissions to access organizations.'
      );
    });

    it('should handle network error', async () => {
      const mockClient = {
        getOrganizations: jest.fn().mockRejectedValue({
          code: 'ENOTFOUND'
        })
      };
      
      mockCreateClient.mockReturnValue(mockClient as any);

      await expect(fetchOrganizations(mockAuthConfig)).rejects.toThrow(
        'Network error. Please check your internet connection.'
      );
    });
  });

  describe('selectOrganizationInteractively', () => {
    it('should select organization by number', async () => {
      mockInquirer.prompt.mockResolvedValue({
        selection: '1'
      });

      const result = await selectOrganizationInteractively(mockOrganizations);

      expect(mockInquirer.prompt).toHaveBeenCalledWith([
        {
          type: 'input',
          name: 'selection',
          message: 'Select organization (1-2):',
          validate: expect.any(Function)
        }
      ]);
      expect(result).toEqual(mockOrganizations[0]);
    });

    it('should validate selection input', async () => {
      mockInquirer.prompt.mockResolvedValue({
        selection: '1'
      });

      await selectOrganizationInteractively(mockOrganizations);

      const promptCall = mockInquirer.prompt.mock.calls[0][0] as any;
      const validateFn = promptCall[0].validate;

      // Test valid input
      expect(validateFn('1')).toBe(true);
      expect(validateFn('2')).toBe(true);
      
      // Test invalid inputs
      expect(validateFn('0')).toBe('Please enter a number between 1 and 2');
      expect(validateFn('3')).toBe('Please enter a number between 1 and 2');
      expect(validateFn('abc')).toBe('Please enter a number between 1 and 2');
    });
  });

  describe('promptForManualOrganizationId', () => {
    it('should prompt for manual organization ID', async () => {
      mockInquirer.prompt.mockResolvedValue({
        organizationId: 'manual-org-id'
      });

      const result = await promptForManualOrganizationId();

      expect(mockInquirer.prompt).toHaveBeenCalledWith([
        {
          type: 'input',
          name: 'organizationId',
          message: 'Enter organization ID manually:',
          validate: expect.any(Function)
        }
      ]);
      expect(result).toBe('manual-org-id');
    });

    it('should validate organization ID input', async () => {
      mockInquirer.prompt.mockResolvedValue({
        organizationId: 'valid-id'
      });

      await promptForManualOrganizationId();

      const promptCall = mockInquirer.prompt.mock.calls[0][0] as any;
      const validateFn = promptCall[0].validate;

      // Test valid input
      expect(validateFn('valid-id')).toBe(true);
      expect(validateFn('valid_id')).toBe(true);
      expect(validateFn('valid-id-123')).toBe(true);
      
      // Test invalid inputs
      expect(validateFn('')).toBe('Organization ID cannot be empty');
      expect(validateFn('   ')).toBe('Organization ID cannot be empty');
      expect(validateFn('invalid@id')).toBe('Organization ID contains invalid characters');
    });
  });

  describe('handleSingleOrganization', () => {
    it('should confirm and return organization', async () => {
      mockInquirer.prompt.mockResolvedValue({
        confirm: true
      });

      const result = await handleSingleOrganization(mockOrganizations[0]);

      expect(mockInquirer.prompt).toHaveBeenCalledWith([
        {
          type: 'confirm',
          name: 'confirm',
          message: 'Use this organization?',
          default: true
        }
      ]);
      expect(result).toEqual(mockOrganizations[0]);
    });

    it('should throw error if user cancels', async () => {
      mockInquirer.prompt.mockResolvedValue({
        confirm: false
      });

      await expect(handleSingleOrganization(mockOrganizations[0])).rejects.toThrow(
        'Organization selection cancelled by user'
      );
    });
  });

  describe('getOrganizationId', () => {
    it('should handle single organization auto-selection', async () => {
      const mockClient = {
        getOrganizations: jest.fn().mockResolvedValue({
          items: [mockOrganizations[0]]
        })
      };
      
      mockCreateClient.mockReturnValue(mockClient as any);
      mockInquirer.prompt.mockResolvedValue({
        confirm: true
      });

      const result = await getOrganizationId(mockAuthConfig);

      expect(result).toEqual({
        organizationId: 'org-1',
        organization: mockOrganizations[0]
      });
    });

    it('should handle multiple organizations with list selection', async () => {
      const mockClient = {
        getOrganizations: jest.fn().mockResolvedValue({
          items: mockOrganizations
        })
      };
      
      mockCreateClient.mockReturnValue(mockClient as any);
      mockInquirer.prompt
        .mockResolvedValueOnce({ choice: 'select' })
        .mockResolvedValueOnce({ selection: '2' });

      const result = await getOrganizationId(mockAuthConfig);

      expect(result).toEqual({
        organizationId: 'org-2',
        organization: mockOrganizations[1]
      });
    });

    it('should handle multiple organizations with manual ID entry', async () => {
      const mockClient = {
        getOrganizations: jest.fn().mockResolvedValue({
          items: mockOrganizations
        })
      };
      
      mockCreateClient.mockReturnValue(mockClient as any);
      mockInquirer.prompt
        .mockResolvedValueOnce({ choice: 'manual' })
        .mockResolvedValueOnce({ organizationId: 'org-1' });

      const result = await getOrganizationId(mockAuthConfig);

      expect(result).toEqual({
        organizationId: 'org-1',
        organization: mockOrganizations[0]
      });
    });

    it('should handle manual ID not found in available organizations', async () => {
      const mockClient = {
        getOrganizations: jest.fn().mockResolvedValue({
          items: mockOrganizations
        })
      };
      
      mockCreateClient.mockReturnValue(mockClient as any);
      mockInquirer.prompt
        .mockResolvedValueOnce({ choice: 'manual' })
        .mockResolvedValueOnce({ organizationId: 'unknown-org' });

      const result = await getOrganizationId(mockAuthConfig);

      expect(result).toEqual({
        organizationId: 'unknown-org',
        organization: {
          sys: {
            id: 'unknown-org',
            type: 'Organization',
            createdAt: '',
            updatedAt: ''
          },
          name: 'Manual Entry'
        }
      });
    });

    it('should throw error if no organizations found', async () => {
      const mockClient = {
        getOrganizations: jest.fn().mockResolvedValue({
          items: []
        })
      };
      
      mockCreateClient.mockReturnValue(mockClient as any);

      await expect(getOrganizationId(mockAuthConfig)).rejects.toThrow(
        'No organizations found. Please check your account permissions.'
      );
    });
  });

  describe('isValidOrganizationIdFormat', () => {
    it('should validate organization ID format', () => {
      // Valid formats
      expect(isValidOrganizationIdFormat('valid-id')).toBe(true);
      expect(isValidOrganizationIdFormat('valid_id')).toBe(true);
      expect(isValidOrganizationIdFormat('valid123')).toBe(true);
      expect(isValidOrganizationIdFormat('valid-id-123')).toBe(true);
      
      // Invalid formats
      expect(isValidOrganizationIdFormat('')).toBe(false);
      expect(isValidOrganizationIdFormat('invalid@id')).toBe(false);
      expect(isValidOrganizationIdFormat('invalid#id')).toBe(false);
      expect(isValidOrganizationIdFormat('invalid.id')).toBe(false);
    });
  });

  describe('findOrganizationById', () => {
    it('should find organization by ID', () => {
      const result = findOrganizationById(mockOrganizations, 'org-1');
      expect(result).toEqual(mockOrganizations[0]);
    });

    it('should return undefined if organization not found', () => {
      const result = findOrganizationById(mockOrganizations, 'nonexistent');
      expect(result).toBeUndefined();
    });
  });
}); 