import { handler } from '../../functions/createModules';
import type { SdkField } from '../../src/utils/utils';
import {
  META_JSON_TEMPLATE,
  TEXT_FIELD_TEMPLATE,
  TEXT_MODULE_TEMPLATE,
  RICH_TEXT_FIELD_TEMPLATE,
  RICH_TEXT_MODULE_TEMPLATE,
  NUMBER_FIELD_TEMPLATE,
  NUMBER_MODULE_TEMPLATE,
  DATE_FIELD_TEMPLATE,
  DATE_MODULE_TEMPLATE,
  DATETIME_FIELD_TEMPLATE,
  DATETIME_MODULE_TEMPLATE,
  IMAGE_FIELD_TEMPLATE,
  IMAGE_MODULE_TEMPLATE,
} from '../../functions/templates';
import { documentToHtmlString } from '@contentful/rich-text-html-renderer';

// Mock fetch globally
global.fetch = vi.fn();

describe('createModules', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create three files for a module', async () => {
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
        entryTitle: 'test-entry-title',
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
      'https://api.hubapi.com/cms/v3/source-code/published/content/test-entry-title-test-module.module/meta.json',
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
      'https://api.hubapi.com/cms/v3/source-code/published/content/test-entry-title-test-module.module/fields.json',
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
      'https://api.hubapi.com/cms/v3/source-code/published/content/test-entry-title-test-module.module/module.html',
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
        entryTitle: 'test-entry-title',
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
      'https://api.hubapi.com/cms/v3/source-code/published/content/test-entry-title-test-module.module/meta.json',
      expect.objectContaining({
        method: 'PUT',
        headers: {
          Authorization: 'Bearer invalid-token',
        },
      })
    );
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
        entryTitle: 'test-entry-title',
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

    // Verify the file contents being sent
    const firstCall = mockFetch.mock.calls[0];
    const secondCall = mockFetch.mock.calls[1];
    const thirdCall = mockFetch.mock.calls[2];

    // Check meta.json content
    const firstFormData = firstCall[1]?.body as FormData;
    const firstFile = firstFormData.get('file') as Blob;
    expect(firstFile.type).toBe('application/json');
    const firstContent = await firstFile.text();
    expect(JSON.parse(firstContent)).toEqual(META_JSON_TEMPLATE);

    // Check fields.json content
    const secondFormData = secondCall[1]?.body as FormData;
    const secondFile = secondFormData.get('file') as Blob;
    expect(secondFile.type).toBe('application/json');
    const secondContent = await secondFile.text();
    const expectedFields = structuredClone(TEXT_FIELD_TEMPLATE);
    expectedFields[0].default = 'Hello World';
    expect(JSON.parse(secondContent)).toEqual(expectedFields);

    // Check module.html content
    const thirdFormData = thirdCall[1]?.body as FormData;
    const thirdFile = thirdFormData.get('file') as Blob;
    expect(thirdFile.type).toBe('text/html');
    const thirdContent = await thirdFile.text();
    expect(thirdContent).toBe(TEXT_MODULE_TEMPLATE);
  });

  it('should successfully create a module for a text field without a value', async () => {
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
      value: undefined,
    };

    const mockEvent = {
      body: {
        entryTitle: 'test-entry-title',
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

    // Verify the file contents being sent
    const secondCall = mockFetch.mock.calls[1];

    // Check fields.json content
    const secondFormData = secondCall[1]?.body as FormData;
    const secondFile = secondFormData.get('file') as Blob;
    expect(secondFile.type).toBe('application/json');
    const secondContent = await secondFile.text();
    expect(JSON.parse(secondContent)).toEqual(TEXT_FIELD_TEMPLATE);
  });

  it('should successfully create a module for a RichText field', async () => {
    // Mock successful fetch responses
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    } as Response);

    const mockField: SdkField = {
      type: 'RichText',
      id: 'test-field-id',
      uniqueId: 'test-richtext-module',
      name: 'Test RichText Field',
      supported: true,
      value: {
        nodeType: 'document',
        data: {},
        content: [
          {
            nodeType: 'paragraph',
            data: {},
            content: [
              {
                nodeType: 'text',
                value: 'Hello <strong>World</strong>',
                marks: [],
                data: {},
              },
            ],
          },
        ],
      },
    };

    const mockEvent = {
      body: {
        entryTitle: 'test-entry-title',
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

    // Verify fetch was called 3 times
    expect(mockFetch).toHaveBeenCalledTimes(3);

    // Verify the file contents being sent for RichText field
    const firstCall = mockFetch.mock.calls[0];
    const secondCall = mockFetch.mock.calls[1];
    const thirdCall = mockFetch.mock.calls[2];

    // Check meta.json content (should be the same for all field types)
    const firstFormData = firstCall[1]?.body as FormData;
    const firstFile = firstFormData.get('file') as Blob;
    const firstContent = await firstFile.text();
    expect(JSON.parse(firstContent)).toEqual(META_JSON_TEMPLATE);

    // Check fields.json content for RichText
    const secondFormData = secondCall[1]?.body as FormData;
    const secondFile = secondFormData.get('file') as Blob;
    const secondContent = await secondFile.text();
    const expectedFields = structuredClone(RICH_TEXT_FIELD_TEMPLATE);
    expectedFields[0].default = documentToHtmlString(mockField.value);
    expect(JSON.parse(secondContent)).toEqual(expectedFields);

    // Check module.html content for RichText
    const thirdFormData = thirdCall[1]?.body as FormData;
    const thirdFile = thirdFormData.get('file') as Blob;
    const thirdContent = await thirdFile.text();
    expect(thirdContent).toBe(RICH_TEXT_MODULE_TEMPLATE);
  });

  it('should successfully create a module for a Number field', async () => {
    // Mock successful fetch responses
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    } as Response);

    const mockField: SdkField = {
      type: 'Number',
      id: 'test-field-id',
      uniqueId: 'test-number-module',
      name: 'Test Number Field',
      supported: true,
      value: 42,
    };

    const mockEvent = {
      body: {
        entryTitle: 'test-entry-title',
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

    // Verify fetch was called 3 times
    expect(mockFetch).toHaveBeenCalledTimes(3);

    // Verify the file contents being sent for Number field
    const firstCall = mockFetch.mock.calls[0];
    const secondCall = mockFetch.mock.calls[1];
    const thirdCall = mockFetch.mock.calls[2];

    // Check meta.json content
    const firstFormData = firstCall[1]?.body as FormData;
    const firstFile = firstFormData.get('file') as Blob;
    const firstContent = await firstFile.text();
    expect(JSON.parse(firstContent)).toEqual(META_JSON_TEMPLATE);

    // Check fields.json content for Number
    const secondFormData = secondCall[1]?.body as FormData;
    const secondFile = secondFormData.get('file') as Blob;
    const secondContent = await secondFile.text();
    const expectedFields = structuredClone(NUMBER_FIELD_TEMPLATE);
    expectedFields[0].default = 42;
    expect(JSON.parse(secondContent)).toEqual(expectedFields);

    // Check module.html content for Number
    const thirdFormData = thirdCall[1]?.body as FormData;
    const thirdFile = thirdFormData.get('file') as Blob;
    const thirdContent = await thirdFile.text();
    expect(thirdContent).toBe(NUMBER_MODULE_TEMPLATE);
  });

  it('should successfully create a module for a Date field without time', async () => {
    // Mock successful fetch responses
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    } as Response);

    const mockField: SdkField = {
      type: 'Date',
      id: 'test-field-id',
      uniqueId: 'test-date-module',
      name: 'Test Date Field',
      supported: true,
      value: '2023-12-25',
    };

    const mockEvent = {
      body: {
        entryTitle: 'test-entry-title',
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

    // Verify fetch was called 3 times
    expect(mockFetch).toHaveBeenCalledTimes(3);

    // Verify the file contents being sent for Date field
    const firstCall = mockFetch.mock.calls[0];
    const secondCall = mockFetch.mock.calls[1];
    const thirdCall = mockFetch.mock.calls[2];

    // Check meta.json content
    const firstFormData = firstCall[1]?.body as FormData;
    const firstFile = firstFormData.get('file') as Blob;
    const firstContent = await firstFile.text();
    expect(JSON.parse(firstContent)).toEqual(META_JSON_TEMPLATE);

    // Check fields.json content for Date
    const secondFormData = secondCall[1]?.body as FormData;
    const secondFile = secondFormData.get('file') as Blob;
    const secondContent = await secondFile.text();
    const expectedFields = structuredClone(DATE_FIELD_TEMPLATE);
    expectedFields[0].default = new Date('2023-12-25').getTime();
    expect(JSON.parse(secondContent)).toEqual(expectedFields);

    // Check module.html content for Date
    const thirdFormData = thirdCall[1]?.body as FormData;
    const thirdFile = thirdFormData.get('file') as Blob;
    const thirdContent = await thirdFile.text();
    expect(thirdContent).toBe(DATE_MODULE_TEMPLATE);
  });

  it('should successfully create a module for a Date field with time', async () => {
    // Mock successful fetch responses
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    } as Response);

    const mockField: SdkField = {
      type: 'Date',
      id: 'test-field-id',
      uniqueId: 'test-datetime-module',
      name: 'Test DateTime Field',
      supported: true,
      value: '2023-12-25T14:30:00Z',
    };

    const mockEvent = {
      body: {
        entryTitle: 'test-entry-title',
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

    // Verify fetch was called 3 times
    expect(mockFetch).toHaveBeenCalledTimes(3);

    // Verify the file contents being sent for DateTime field
    const firstCall = mockFetch.mock.calls[0];
    const secondCall = mockFetch.mock.calls[1];
    const thirdCall = mockFetch.mock.calls[2];

    // Check meta.json content
    const firstFormData = firstCall[1]?.body as FormData;
    const firstFile = firstFormData.get('file') as Blob;
    const firstContent = await firstFile.text();
    expect(JSON.parse(firstContent)).toEqual(META_JSON_TEMPLATE);

    // Check fields.json content for DateTime
    const secondFormData = secondCall[1]?.body as FormData;
    const secondFile = secondFormData.get('file') as Blob;
    const secondContent = await secondFile.text();
    const expectedFields = structuredClone(DATETIME_FIELD_TEMPLATE);
    expectedFields[0].default = new Date('2023-12-25T14:30:00Z').getTime();
    expect(JSON.parse(secondContent)).toEqual(expectedFields);

    // Check module.html content for DateTime
    const thirdFormData = thirdCall[1]?.body as FormData;
    const thirdFile = thirdFormData.get('file') as Blob;
    const thirdContent = await thirdFile.text();
    expect(thirdContent).toBe(DATETIME_MODULE_TEMPLATE);
  });

  it('should successfully create a module for a Location field', async () => {
    // Mock successful fetch responses
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    } as Response);

    const mockField: SdkField = {
      type: 'Location',
      id: 'test-field-id',
      uniqueId: 'test-location-module',
      name: 'Test Location Field',
      supported: true,
      value: {
        lat: 40.7128,
        lon: -74.006,
      },
    };

    const mockEvent = {
      body: {
        entryTitle: 'test-entry-title',
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

    // Verify fetch was called 3 times
    expect(mockFetch).toHaveBeenCalledTimes(3);

    // Verify the file contents being sent for Location field
    const firstCall = mockFetch.mock.calls[0];
    const secondCall = mockFetch.mock.calls[1];
    const thirdCall = mockFetch.mock.calls[2];

    // Check meta.json content
    const firstFormData = firstCall[1]?.body as FormData;
    const firstFile = firstFormData.get('file') as Blob;
    const firstContent = await firstFile.text();
    expect(JSON.parse(firstContent)).toEqual(META_JSON_TEMPLATE);

    // Check fields.json content for Location
    const secondFormData = secondCall[1]?.body as FormData;
    const secondFile = secondFormData.get('file') as Blob;
    const secondContent = await secondFile.text();
    const expectedFields = structuredClone(TEXT_FIELD_TEMPLATE);
    expectedFields[0].default = 'lat:40.7128, long:-74.006';
    expect(JSON.parse(secondContent)).toEqual(expectedFields);

    // Check module.html content for Location
    const thirdFormData = thirdCall[1]?.body as FormData;
    const thirdFile = thirdFormData.get('file') as Blob;
    const thirdContent = await thirdFile.text();
    expect(thirdContent).toBe(TEXT_MODULE_TEMPLATE);
  });

  it('should successfully create a module for an Asset field', async () => {
    // Mock successful fetch responses
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    } as Response);

    const mockField: SdkField = {
      type: 'Link',
      id: 'test-field-id',
      uniqueId: 'test-asset-module',
      name: 'Test Asset Field',
      supported: true,
      value: {
        url: 'https://example.com/image.jpg',
        width: 100,
        height: 100,
        contentType: 'image/jpeg',
      },
    };

    const mockEvent = {
      body: {
        entryTitle: 'test-entry-title',
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

    // Verify fetch was called 3 times
    expect(mockFetch).toHaveBeenCalledTimes(3);

    // Verify the file contents being sent for Asset field
    const firstCall = mockFetch.mock.calls[0];
    const secondCall = mockFetch.mock.calls[1];
    const thirdCall = mockFetch.mock.calls[2];

    // Check meta.json content
    const firstFormData = firstCall[1]?.body as FormData;
    const firstFile = firstFormData.get('file') as Blob;
    const firstContent = await firstFile.text();
    expect(JSON.parse(firstContent)).toEqual(META_JSON_TEMPLATE);

    // Check fields.json content for Location
    const secondFormData = secondCall[1]?.body as FormData;
    const secondFile = secondFormData.get('file') as Blob;
    const secondContent = await secondFile.text();
    const expectedFields = structuredClone(IMAGE_FIELD_TEMPLATE);
    expectedFields[0].default = {
      src: 'https://example.com/image.jpg',
      loading: 'lazy',
      width: 100,
      height: 100,
    };
    expect(JSON.parse(secondContent)).toEqual(expectedFields);

    // Check module.html content for Location
    const thirdFormData = thirdCall[1]?.body as FormData;
    const thirdFile = thirdFormData.get('file') as Blob;
    const thirdContent = await thirdFile.text();
    expect(thirdContent).toBe(IMAGE_MODULE_TEMPLATE);
  });
});
