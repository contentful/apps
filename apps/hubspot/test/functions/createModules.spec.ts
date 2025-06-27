import { describe, test, expect, vi, beforeEach } from 'vitest';
import { handler } from '../../functions/createModules';
import type { SdkField } from '../../src/utils';

// Mock fetch globally
global.fetch = vi.fn();

describe('createModules', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully create a module for a text field', async () => {
    // Mock successful fetch responses
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    } as Response);

    const mockField: SdkField = {
      type: 'Text',
      id: 'test-field-id',
      uniqueId: 'test-module',
      name: 'Test Field',
      supported: true,
      value: 'Hello World',
    };

    const mockEvent = {
      body: {
        fields: JSON.stringify([mockField]),
      },
    };

    const mockContext = {
      appInstallationParameters: {
        hubspotAccessToken: 'test-token',
      },
    };

    const result = await handler(mockEvent as any, mockContext as any);

    // Verify the result
    expect(result).toEqual({
      success: [mockField],
      failed: [],
    });

    // Verify fetch was called 3 times (once for each file: meta.json, fields.json, module.html)
    expect(mockFetch).toHaveBeenCalledTimes(3);

    // Verify the first call (meta.json)
    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      'https://api.hubapi.com/cms/v3/source-code/published/content/test-module.module/meta.json',
      expect.objectContaining({
        method: 'PUT',
        headers: {
          Authorization: 'Bearer test-token',
        },
      })
    );

    // Verify the second call (fields.json)
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      'https://api.hubapi.com/cms/v3/source-code/published/content/test-module.module/fields.json',
      expect.objectContaining({
        method: 'PUT',
        headers: {
          Authorization: 'Bearer test-token',
        },
      })
    );

    // Verify the third call (module.html)
    expect(mockFetch).toHaveBeenNthCalledWith(
      3,
      'https://api.hubapi.com/cms/v3/source-code/published/content/test-module.module/module.html',
      expect.objectContaining({
        method: 'PUT',
        headers: {
          Authorization: 'Bearer test-token',
        },
      })
    );
  });

  it('should handle API errors and return failed fields', async () => {
    // Mock failed fetch response
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      text: () => Promise.resolve('Invalid token'),
    } as Response);

    const mockField: SdkField = {
      type: 'Text',
      id: 'test-field-id',
      uniqueId: 'test-module',
      name: 'Test Field',
      supported: true,
      value: 'Hello World',
    };

    const mockEvent = {
      body: {
        fields: JSON.stringify([mockField]),
      },
    };

    const mockContext = {
      appInstallationParameters: {
        hubspotAccessToken: 'invalid-token',
      },
    };

    const result = await handler(mockEvent as any, mockContext as any);

    // Verify the result
    expect(result).toEqual({
      success: [],
      failed: [mockField],
    });

    // Verify fetch was called once (fails on first call)
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Verify the error call
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.hubapi.com/cms/v3/source-code/published/content/test-module.module/meta.json',
      expect.objectContaining({
        method: 'PUT',
        headers: {
          Authorization: 'Bearer invalid-token',
        },
      })
    );
  });
});
