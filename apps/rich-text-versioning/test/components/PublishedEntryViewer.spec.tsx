import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import PublishedEntryViewer from '../../src/components/PublishedEntryViewer';

// Mock the CDAService
vi.mock('../../src/services/cdaService', () => ({
  CDAService: vi.fn().mockImplementation(() => ({
    getEntryWithContentType: vi.fn(),
    isRichTextField: vi.fn(),
    validateConnection: vi.fn(),
  })),
}));

describe('PublishedEntryViewer', () => {
  const mockProps = {
    entryId: 'test-entry-id',
    spaceId: 'test-space-id',
    environmentId: 'test-environment-id',
    accessToken: 'test-access-token',
    locale: 'en-US',
  };

  const mockEntry = {
    sys: {
      id: 'test-entry-id',
      type: 'Entry',
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-02T00:00:00.000Z',
      publishedAt: '2023-01-02T00:00:00.000Z',
      publishedVersion: 1,
      locale: 'en-US',
      contentType: {
        sys: {
          type: 'Link',
          linkType: 'ContentType',
          id: 'test-content-type',
        },
      },
    },
    fields: {
      title: 'Test Entry Title',
      description: 'Test Entry Description',
      isPublished: true,
      richTextContent: {
        nodeType: 'document',
        data: {},
        content: [
          {
            nodeType: 'paragraph',
            data: {},
            content: [
              {
                nodeType: 'text',
                value: 'This is rich text content',
                marks: [],
                data: {},
              },
            ],
          },
        ],
      },
    },
  };

  const mockDraftEntry = {
    sys: {
      id: 'test-draft-entry-id',
      type: 'Entry',
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-02T00:00:00.000Z',
      publishedAt: null,
      publishedVersion: 0,
      locale: 'en-US',
      contentType: {
        sys: {
          type: 'Link',
          linkType: 'ContentType',
          id: 'test-content-type',
        },
      },
    },
    fields: {
      title: 'Draft Entry Title',
      description: 'Draft Entry Description',
    },
  };

  const mockContentType = {
    sys: {
      id: 'test-content-type',
      type: 'ContentType',
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z',
      publishedAt: '2023-01-01T00:00:00.000Z',
      publishedVersion: 1,
      locale: 'en-US',
    },
    name: 'Test Content Type',
    description: 'A test content type',
    displayField: 'title',
    fields: [
      {
        id: 'title',
        name: 'Title',
        type: 'Symbol',
        required: true,
        localized: false,
      },
      {
        id: 'description',
        name: 'Description',
        type: 'Text',
        required: false,
        localized: false,
      },
      {
        id: 'richTextContent',
        name: 'Rich Text Content',
        type: 'RichText',
        required: false,
        localized: false,
      },
      {
        id: 'isPublished',
        name: 'Is Published',
        type: 'Boolean',
        required: false,
        localized: false,
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display loading state initially', () => {
    render(<PublishedEntryViewer {...mockProps} />);

    expect(screen.getByText('Loading published entry...')).toBeInTheDocument();
  });

  it('should display error when API call fails', async () => {
    const { CDAService } = await import('../../src/services/cdaService');
    const mockValidateConnection = vi
      .fn()
      .mockResolvedValue({ valid: true, message: 'Connection successful' });
    const mockGetEntryWithContentType = vi.fn().mockRejectedValue(new Error('API Error'));

    (CDAService as any).mockImplementation(() => ({
      getEntryWithContentType: mockGetEntryWithContentType,
      isRichTextField: vi.fn(),
      validateConnection: mockValidateConnection,
    }));

    render(<PublishedEntryViewer {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Error Loading Entry')).toBeInTheDocument();
      expect(screen.getByText('API Error')).toBeInTheDocument();
    });
  });

  it('should display connection error when validation fails', async () => {
    const { CDAService } = await import('../../src/services/cdaService');
    const mockValidateConnection = vi
      .fn()
      .mockResolvedValue({ valid: false, message: 'Connection failed' });

    (CDAService as any).mockImplementation(() => ({
      getEntryWithContentType: vi.fn(),
      isRichTextField: vi.fn(),
      validateConnection: mockValidateConnection,
    }));

    render(<PublishedEntryViewer {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Error Loading Entry')).toBeInTheDocument();
      expect(screen.getByText(/Unable to connect to Content Delivery API/)).toBeInTheDocument();
    });
  });

  it('should display published entry data when API call succeeds', async () => {
    const { CDAService } = await import('../../src/services/cdaService');
    const mockValidateConnection = vi
      .fn()
      .mockResolvedValue({ valid: true, message: 'Connection successful' });
    const mockGetEntryWithContentType = vi.fn().mockResolvedValue({
      entry: mockEntry,
      contentType: mockContentType,
    });
    const mockIsRichTextField = vi.fn().mockImplementation((fieldName: string) => {
      return fieldName === 'richTextContent';
    });

    (CDAService as any).mockImplementation(() => ({
      getEntryWithContentType: mockGetEntryWithContentType,
      isRichTextField: mockIsRichTextField,
      validateConnection: mockValidateConnection,
    }));

    render(<PublishedEntryViewer {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Published Entry Data')).toBeInTheDocument();
      expect(screen.getByText('Entry ID: test-entry-id')).toBeInTheDocument();
      expect(screen.getByText('System Information')).toBeInTheDocument();
      expect(screen.getByText('Fields')).toBeInTheDocument();
      expect(screen.getByText('title:')).toBeInTheDocument();
      expect(screen.getByText('Test Entry Title')).toBeInTheDocument();
      expect(screen.getByText('Published')).toBeInTheDocument();
    });
  });

  it('should display draft entry message when entry is not published', async () => {
    const { CDAService } = await import('../../src/services/cdaService');
    const mockValidateConnection = vi
      .fn()
      .mockResolvedValue({ valid: true, message: 'Connection successful' });
    const mockGetEntryWithContentType = vi.fn().mockResolvedValue({
      entry: mockDraftEntry,
      contentType: mockContentType,
    });

    (CDAService as any).mockImplementation(() => ({
      getEntryWithContentType: mockGetEntryWithContentType,
      isRichTextField: vi.fn(),
      validateConnection: mockValidateConnection,
    }));

    render(<PublishedEntryViewer {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Entry is not published')).toBeInTheDocument();
      expect(screen.getByText(/This entry is currently in draft status/)).toBeInTheDocument();
      expect(screen.getByText('test-draft-entry-id')).toBeInTheDocument();
      expect(screen.getByText('test-content-type')).toBeInTheDocument();
      expect(screen.getByText('Check Again')).toBeInTheDocument();
    });
  });

  it('should display rich text content properly', async () => {
    const { CDAService } = await import('../../src/services/cdaService');
    const mockValidateConnection = vi
      .fn()
      .mockResolvedValue({ valid: true, message: 'Connection successful' });
    const mockGetEntryWithContentType = vi.fn().mockResolvedValue({
      entry: mockEntry,
      contentType: mockContentType,
    });
    const mockIsRichTextField = vi.fn().mockImplementation((fieldName: string) => {
      return fieldName === 'richTextContent';
    });

    (CDAService as any).mockImplementation(() => ({
      getEntryWithContentType: mockGetEntryWithContentType,
      isRichTextField: mockIsRichTextField,
      validateConnection: mockValidateConnection,
    }));

    render(<PublishedEntryViewer {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('richTextContent:')).toBeInTheDocument();
      expect(screen.getByText('Rich Text Content:')).toBeInTheDocument();
      expect(screen.getByText('Rich Text Field')).toBeInTheDocument();
    });
  });

  it('should display refresh button', async () => {
    const { CDAService } = await import('../../src/services/cdaService');
    const mockValidateConnection = vi
      .fn()
      .mockResolvedValue({ valid: true, message: 'Connection successful' });
    const mockGetEntryWithContentType = vi.fn().mockResolvedValue({
      entry: mockEntry,
      contentType: mockContentType,
    });

    (CDAService as any).mockImplementation(() => ({
      getEntryWithContentType: mockGetEntryWithContentType,
      isRichTextField: vi.fn(),
      validateConnection: mockValidateConnection,
    }));

    render(<PublishedEntryViewer {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Refresh Data')).toBeInTheDocument();
    });
  });

  it('should display configuration details in error state', async () => {
    const { CDAService } = await import('../../src/services/cdaService');
    const mockValidateConnection = vi
      .fn()
      .mockResolvedValue({ valid: true, message: 'Connection successful' });
    const mockGetEntryWithContentType = vi.fn().mockRejectedValue(new Error('Entry not found'));

    (CDAService as any).mockImplementation(() => ({
      getEntryWithContentType: mockGetEntryWithContentType,
      isRichTextField: vi.fn(),
      validateConnection: mockValidateConnection,
    }));

    render(<PublishedEntryViewer {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Error Loading Entry')).toBeInTheDocument();
      expect(screen.getByText('test-entry-id')).toBeInTheDocument();
      expect(screen.getByText('test-space-id')).toBeInTheDocument();
      expect(screen.getByText('test-environment-id')).toBeInTheDocument();
      expect(screen.getByText('en-US')).toBeInTheDocument();
    });
  });
});
