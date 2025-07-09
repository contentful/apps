/// <reference types="jest" />

import { 
  getTokenFromEnvironment,
  promptForToken,
  validateToken,
  authenticateUser,
  isValidTokenFormat,
  maskToken,
  User,
  AuthConfig,
  AuthError
} from '../../src/utils/auth';
import { createClient } from 'contentful-management';
import inquirer from 'inquirer';

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

describe('Auth Module', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    delete process.env.CONTENTFUL_ACCESS_TOKEN;
  });

  describe('getTokenFromEnvironment', () => {
    it('should return token from environment variable', () => {
      process.env.CONTENTFUL_ACCESS_TOKEN = 'test-token-123';
      const result = getTokenFromEnvironment();
      expect(result).toBe('test-token-123');
    });

    it('should return undefined when environment variable is not set', () => {
      delete process.env.CONTENTFUL_ACCESS_TOKEN;
      const result = getTokenFromEnvironment();
      expect(result).toBeUndefined();
    });

    it('should return empty string when environment variable is empty', () => {
      process.env.CONTENTFUL_ACCESS_TOKEN = '';
      const result = getTokenFromEnvironment();
      expect(result).toBe('');
    });
  });

  describe('promptForToken', () => {
    it('should prompt for token and return trimmed value', async () => {
      const mockToken = ' test-token-with-spaces ';
      mockInquirer.prompt.mockResolvedValue({ token: mockToken });

      const result = await promptForToken();

      expect(result).toBe('test-token-with-spaces');
      expect(mockInquirer.prompt).toHaveBeenCalledWith([
        {
          type: 'password',
          name: 'token',
          message: 'Please enter your Contentful Management API token:',
          mask: '*',
          validate: expect.any(Function)
        }
      ]);
    });

    it('should validate token input - reject empty token', async () => {
      mockInquirer.prompt.mockResolvedValue({ token: 'valid-token' });
      
      await promptForToken();
      
      const promptCall = mockInquirer.prompt.mock.calls[0][0] as any;
      const validateFn = promptCall[0].validate;
      expect(validateFn('')).toBe('Token cannot be empty');
      expect(validateFn('   ')).toBe('Token cannot be empty');
    });

    it('should validate token input - reject short token', async () => {
      mockInquirer.prompt.mockResolvedValue({ token: 'valid-token' });
      
      await promptForToken();
      
      const promptCall = mockInquirer.prompt.mock.calls[0][0] as any;
      const validateFn = promptCall[0].validate;
      expect(validateFn('short')).toBe('Token appears to be too short. Please check and try again.');
    });

    it('should validate token input - accept valid token', async () => {
      mockInquirer.prompt.mockResolvedValue({ token: 'valid-token' });
      
      await promptForToken();
      
      const promptCall = mockInquirer.prompt.mock.calls[0][0] as any;
      const validateFn = promptCall[0].validate;
      expect(validateFn('a'.repeat(40))).toBe(true);
    });
  });

  describe('validateToken', () => {
    const mockUser: User = {
      sys: {
        id: 'user-id',
        type: 'User',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z'
      },
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      activated: true,
      confirmed: true,
      signInCount: 5
    };

    it('should validate token and return user data', async () => {
      const mockClient = {
        getCurrentUser: jest.fn().mockResolvedValue(mockUser)
      };
      mockCreateClient.mockReturnValue(mockClient as any);

      const result = await validateToken('valid-token');

      expect(result).toEqual(mockUser);
      expect(mockCreateClient).toHaveBeenCalledWith({
        accessToken: 'valid-token'
      });
      expect(mockClient.getCurrentUser).toHaveBeenCalled();
    });

    it('should handle 401 unauthorized error', async () => {
      const mockClient = {
        getCurrentUser: jest.fn().mockRejectedValue({
          response: { status: 401 }
        })
      };
      mockCreateClient.mockReturnValue(mockClient as any);

      await expect(validateToken('invalid-token')).rejects.toMatchObject({
        message: 'Invalid or expired token. Please check your Contentful Management API token.',
        code: 'INVALID_TOKEN',
        status: 401
      });
    });

    it('should handle 403 forbidden error', async () => {
      const mockClient = {
        getCurrentUser: jest.fn().mockRejectedValue({
          response: { status: 403 }
        })
      };
      mockCreateClient.mockReturnValue(mockClient as any);

      await expect(validateToken('insufficient-permissions-token')).rejects.toMatchObject({
        message: 'Token does not have sufficient permissions.',
        code: 'INSUFFICIENT_PERMISSIONS',
        status: 403
      });
    });

    it('should handle network errors', async () => {
      const mockClient = {
        getCurrentUser: jest.fn().mockRejectedValue({
          code: 'ENOTFOUND'
        })
      };
      mockCreateClient.mockReturnValue(mockClient as any);

      await expect(validateToken('network-error-token')).rejects.toMatchObject({
        message: 'Network error. Please check your internet connection.',
        code: 'NETWORK_ERROR'
      });
    });

    it('should handle connection refused errors', async () => {
      const mockClient = {
        getCurrentUser: jest.fn().mockRejectedValue({
          code: 'ECONNREFUSED'
        })
      };
      mockCreateClient.mockReturnValue(mockClient as any);

      await expect(validateToken('connection-refused-token')).rejects.toMatchObject({
        message: 'Network error. Please check your internet connection.',
        code: 'NETWORK_ERROR'
      });
    });

    it('should handle generic errors', async () => {
      const mockClient = {
        getCurrentUser: jest.fn().mockRejectedValue({
          message: 'Generic error'
        })
      };
      mockCreateClient.mockReturnValue(mockClient as any);

      await expect(validateToken('generic-error-token')).rejects.toMatchObject({
        message: 'Authentication failed: Generic error',
        code: 'AUTH_ERROR'
      });
    });
  });

  describe('authenticateUser', () => {
    const mockUser: User = {
      sys: {
        id: 'user-id',
        type: 'User',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z'
      },
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      activated: true,
      confirmed: true,
      signInCount: 5
    };

    it('should authenticate using environment token', async () => {
      process.env.CONTENTFUL_ACCESS_TOKEN = 'env-token';
      
      const mockClient = {
        getCurrentUser: jest.fn().mockResolvedValue(mockUser)
      };
      mockCreateClient.mockReturnValue(mockClient as any);

      const result = await authenticateUser();

      expect(result).toEqual({
        token: 'env-token',
        user: mockUser
      });
      expect(consoleSpy).toHaveBeenCalledWith('Found token in environment variable CONTENTFUL_ACCESS_TOKEN');
      expect(consoleSpy).toHaveBeenCalledWith('✓ Authenticated as John Doe (john.doe@example.com)');
    });

    it('should prompt for token when environment token is invalid', async () => {
      process.env.CONTENTFUL_ACCESS_TOKEN = 'invalid-env-token';
      
      const mockClient = {
        getCurrentUser: jest.fn()
          .mockRejectedValueOnce({ response: { status: 401 } })
          .mockResolvedValueOnce(mockUser)
      };
      mockCreateClient.mockReturnValue(mockClient as any);
      
      mockInquirer.prompt.mockResolvedValue({ token: 'valid-prompted-token' });

      const result = await authenticateUser();

      expect(result).toEqual({
        token: 'valid-prompted-token',
        user: mockUser
      });
      expect(consoleSpy).toHaveBeenCalledWith('⚠ Environment token is invalid, prompting for new token...');
    });

    it('should prompt for token when no environment token', async () => {
      delete process.env.CONTENTFUL_ACCESS_TOKEN;
      
      const mockClient = {
        getCurrentUser: jest.fn().mockResolvedValue(mockUser)
      };
      mockCreateClient.mockReturnValue(mockClient as any);
      
      mockInquirer.prompt.mockResolvedValue({ token: 'prompted-token' });

      const result = await authenticateUser();

      expect(result).toEqual({
        token: 'prompted-token',
        user: mockUser
      });
      expect(consoleSpy).toHaveBeenCalledWith('✓ Authenticated as John Doe (john.doe@example.com)');
    });

    it('should retry on invalid prompted token', async () => {
      delete process.env.CONTENTFUL_ACCESS_TOKEN;
      
      const mockClient = {
        getCurrentUser: jest.fn()
          .mockRejectedValueOnce({ response: { status: 401 } })
          .mockResolvedValueOnce(mockUser)
      };
      mockCreateClient.mockReturnValue(mockClient as any);
      
      mockInquirer.prompt
        .mockResolvedValueOnce({ token: 'invalid-token' })
        .mockResolvedValueOnce({ retry: true })
        .mockResolvedValueOnce({ token: 'valid-token' });

      const result = await authenticateUser();

      expect(result).toEqual({
        token: 'valid-token',
        user: mockUser
      });
      expect(consoleSpy).toHaveBeenCalledWith('✗ Invalid or expired token. Please check your Contentful Management API token.');
    });

    it('should throw error when user cancels authentication', async () => {
      delete process.env.CONTENTFUL_ACCESS_TOKEN;
      
      const mockClient = {
        getCurrentUser: jest.fn().mockRejectedValue({ response: { status: 401 } })
      };
      mockCreateClient.mockReturnValue(mockClient as any);
      
      mockInquirer.prompt
        .mockResolvedValueOnce({ token: 'invalid-token' })
        .mockResolvedValueOnce({ retry: false });

      await expect(authenticateUser()).rejects.toThrow('Authentication cancelled by user');
    });
  });

  describe('isValidTokenFormat', () => {
    it('should return true for valid token format', () => {
      const validToken = 'a'.repeat(40);
      expect(isValidTokenFormat(validToken)).toBe(true);
    });

    it('should return true for token with hyphens and underscores', () => {
      const validToken = 'abc-def_123'.repeat(5);
      expect(isValidTokenFormat(validToken)).toBe(true);
    });

    it('should return false for short token', () => {
      const shortToken = 'short';
      expect(isValidTokenFormat(shortToken)).toBe(false);
    });

    it('should return false for token with invalid characters', () => {
      const invalidToken = 'a'.repeat(40) + '@';
      expect(isValidTokenFormat(invalidToken)).toBe(false);
    });

    it('should return false for empty token', () => {
      expect(isValidTokenFormat('')).toBe(false);
    });
  });

  describe('maskToken', () => {
    it('should mask long tokens showing first 4 and last 4 characters', () => {
      const token = 'abcdefghijklmnopqrstuvwxyz';
      const result = maskToken(token);
      expect(result).toBe('abcd******************wxyz');
    });

    it('should mask short tokens completely', () => {
      const token = 'short';
      const result = maskToken(token);
      expect(result).toBe('*****');
    });

    it('should mask tokens with exactly 8 characters completely', () => {
      const token = 'exactly8';
      const result = maskToken(token);
      expect(result).toBe('********');
    });

    it('should handle empty token', () => {
      const token = '';
      const result = maskToken(token);
      expect(result).toBe('');
    });
  });
}); 