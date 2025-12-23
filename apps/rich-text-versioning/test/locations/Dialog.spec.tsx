import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { mockCma, mockSdk } from '../mocks';
import Dialog from '../../src/locations/Dialog';
import { BLOCKS, INLINES } from '@contentful/rich-text-types';
import { useSDK } from '@contentful/react-apps-toolkit';

const currentField = {
  nodeType: BLOCKS.DOCUMENT,
  data: {},
  content: [
    {
      nodeType: BLOCKS.PARAGRAPH,
      data: {},
      content: [
        {
          nodeType: 'text',
          value: 'Current content',
          marks: [],
          data: {},
        },
      ],
    },
  ],
};

const publishedField = {
  nodeType: BLOCKS.DOCUMENT,
  data: {},
  content: [
    {
      nodeType: BLOCKS.PARAGRAPH,
      data: {},
      content: [
        {
          nodeType: 'text',
          value: 'Published content',
          marks: [],
          data: {},
        },
      ],
    },
  ],
};

const dialogMockSdk = (currentField?: any, publishedField?: any) => ({
  ...mockSdk,
  close: vi.fn(),
  locales: {
    default: 'en-US',
  },
  parameters: {
    invocation: {
      currentField: currentField || {
        nodeType: BLOCKS.DOCUMENT,
        data: {},
        content: [
          {
            nodeType: BLOCKS.PARAGRAPH,
            data: {},
            content: [
              {
                nodeType: 'text',
                value: 'Current content',
                marks: [],
                data: {},
              },
            ],
          },
        ],
      },
      publishedField: publishedField || {
        nodeType: BLOCKS.DOCUMENT,
        data: {},
        content: [
          {
            nodeType: BLOCKS.PARAGRAPH,
            data: {},
            content: [
              {
                nodeType: 'text',
                value: 'Published content',
                marks: [],
                data: {},
              },
            ],
          },
        ],
      },
    },
  },
});

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: vi.fn(),
  useAutoResizer: vi.fn(),
}));

describe('Dialog component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useSDK).mockReturnValue(dialogMockSdk(currentField, publishedField));
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the dialog with correct layout', () => {
    render(<Dialog />);

    expect(screen.getByText('Current version')).toBeInTheDocument();
    expect(screen.getByText('Published version')).toBeInTheDocument();
    expect(screen.getByText('Close')).toBeInTheDocument();
  });

  it('displays change count badge', () => {
    render(<Dialog />);

    expect(screen.getByText('2 changes')).toBeInTheDocument();
  });

  it('displays current change even though there is no published content', () => {
    const emptyPublishedField = {
      nodeType: BLOCKS.DOCUMENT,
      data: {},
      content: [],
    };

    const dialogMockSdkWithEmptyPublished = {
      ...mockSdk,
      close: vi.fn(),
      parameters: {
        invocation: {
          currentField: currentField,
          publishedField: emptyPublishedField,
        },
      },
    };

    vi.mocked(useSDK).mockReturnValue(dialogMockSdkWithEmptyPublished);

    render(<Dialog />);

    expect(screen.getByText('1 change')).toBeInTheDocument();
    expect(screen.getByText('Current content')).toBeInTheDocument();
  });

  it('renders crossed text for deleted content', async () => {
    render(<Dialog />);

    const delElement = document.querySelector('del');
    expect(delElement).toBeInTheDocument();
    expect(delElement).toHaveStyle('text-decoration: line-through');

    expect(delElement?.textContent).toContain('Published');
  });

  it('renders a note if there was an error loading the content', async () => {
    const dialogMockSdkWithError = {
      ...mockSdk,
      close: vi.fn(),
      parameters: {
        invocation: {
          currentField: currentField,
          publishedField: publishedField,
          errorInfo: {
            hasError: true,
            errorCode: '500',
            errorMessage: 'Error loading content',
          },
        },
      },
    };

    vi.mocked(useSDK).mockReturnValue(dialogMockSdkWithError);

    render(<Dialog />);

    expect(screen.getByText('Error 500 - Error loading content')).toBeInTheDocument();
  });

  describe('Reference block embedded entries', () => {
    beforeEach(() => {
      const currentFieldWithEntry = {
        nodeType: BLOCKS.DOCUMENT,
        data: {},
        content: [
          {
            nodeType: BLOCKS.PARAGRAPH,
            data: {},
            content: [
              {
                nodeType: 'text',
                value: '',
                marks: [],
                data: {},
              },
              {
                nodeType: BLOCKS.EMBEDDED_ENTRY,
                data: {
                  target: {
                    sys: {
                      id: 'entry-id',
                      type: 'Link',
                      linkType: 'Entry',
                    },
                  },
                },
                content: [],
              },
              {
                nodeType: 'text',
                value: '',
                marks: [],
                data: {},
              },
            ],
          },
        ],
      };

      vi.clearAllMocks();
      vi.mocked(useSDK).mockReturnValue(dialogMockSdk(currentFieldWithEntry, publishedField));
    });

    it('handles block embedded entries in rich text content', async () => {
      mockSdk.cma.entry.getMany = vi.fn().mockResolvedValue({
        items: [
          {
            sys: {
              id: 'entry-id',
              contentType: { sys: { id: 'fruits' } },
              updatedAt: new Date().toISOString(),
              publishedAt: new Date().toISOString(),
            },
            fields: {
              title: { 'en-US': 'Banana' },
            },
          },
        ],
      });

      mockSdk.cma.contentType.getMany = vi.fn().mockResolvedValue({
        items: [
          {
            displayField: 'title',
            name: 'Fruits',
            sys: { id: 'fruits' },
            fields: [{ id: 'title', name: 'Title', type: 'Symbol' }],
          },
        ],
      });

      render(<Dialog />);

      await waitFor(() => {
        expect(screen.getByText('Banana')).toBeInTheDocument();
        expect(screen.getByText('Fruits')).toBeInTheDocument();
      });

      expect(screen.getByText('Current version')).toBeInTheDocument();
      expect(screen.getByText('Published version')).toBeInTheDocument();
    });

    it('handles missing block embedded entries gracefully', async () => {
      mockSdk.cma.entry.getMany = vi.fn().mockResolvedValue({
        items: [], // No entries found
      });

      mockSdk.cma.contentType.getMany = vi.fn().mockResolvedValue({
        items: [
          {
            displayField: 'title',
            name: 'Fruits',
            sys: { id: 'fruits' },
            fields: [{ id: 'title', name: 'Title', type: 'Symbol' }],
          },
        ],
      });

      render(<Dialog />);

      await waitFor(() => {
        expect(screen.getByText('Entry missing or inaccessible')).toBeInTheDocument();
        expect(screen.getByText('Unknown')).toBeInTheDocument();
      });

      expect(screen.getByText('Current version')).toBeInTheDocument();
      expect(screen.getByText('Published version')).toBeInTheDocument();
    });
  });

  describe('Reference inline embedded entries', () => {
    beforeEach(() => {
      const currentFieldWithEntry = {
        nodeType: BLOCKS.DOCUMENT,
        data: {},
        content: [
          {
            nodeType: BLOCKS.PARAGRAPH,
            data: {},
            content: [
              {
                nodeType: 'text',
                value: '',
                marks: [],
                data: {},
              },
              {
                nodeType: INLINES.EMBEDDED_ENTRY,
                data: {
                  target: {
                    sys: {
                      id: 'entry-id',
                      type: 'Link',
                      linkType: 'Entry',
                    },
                  },
                },
                content: [],
              },
              {
                nodeType: 'text',
                value: '',
                marks: [],
                data: {},
              },
            ],
          },
        ],
      };

      vi.clearAllMocks();
      vi.mocked(useSDK).mockReturnValue(dialogMockSdk(currentFieldWithEntry, publishedField));
    });

    it('handles block embedded entries in rich text content', async () => {
      mockSdk.cma.entry.getMany = vi.fn().mockResolvedValue({
        items: [
          {
            sys: {
              id: 'entry-id',
              contentType: { sys: { id: 'fruits' } },
              updatedAt: new Date().toISOString(),
              publishedAt: new Date().toISOString(),
            },
            fields: {
              title: { 'en-US': 'Banana' },
            },
          },
        ],
      });

      mockSdk.cma.contentType.getMany = vi.fn().mockResolvedValue({
        items: [
          {
            displayField: 'title',
            name: 'Fruits',
            sys: { id: 'fruits' },
            fields: [{ id: 'title', name: 'Title', type: 'Symbol' }],
          },
        ],
      });

      render(<Dialog />);

      await waitFor(() => {
        expect(screen.getByText('Banana')).toBeInTheDocument();
      });

      expect(screen.getByText('Current version')).toBeInTheDocument();
      expect(screen.getByText('Published version')).toBeInTheDocument();
    });

    it('handles missing inline embedded entries gracefully', async () => {
      mockSdk.cma.entry.getMany = vi.fn().mockResolvedValue({
        items: [], // No entries found
      });

      mockSdk.cma.contentType.getMany = vi.fn().mockResolvedValue({
        items: [
          {
            displayField: 'title',
            name: 'Fruits',
            sys: { id: 'fruits' },
            fields: [{ id: 'title', name: 'Title', type: 'Symbol' }],
          },
        ],
      });

      render(<Dialog />);

      await waitFor(() => {
        expect(screen.getByText('Entry missing or inaccessible')).toBeInTheDocument();
      });

      expect(screen.getByText('Current version')).toBeInTheDocument();
      expect(screen.getByText('Published version')).toBeInTheDocument();
    });
  });

  describe('Reference block embedded assets', () => {
    beforeEach(() => {
      const currentFieldWithEntry = {
        nodeType: BLOCKS.DOCUMENT,
        data: {},
        content: [
          {
            nodeType: BLOCKS.PARAGRAPH,
            data: {},
            content: [
              {
                nodeType: 'text',
                value: '',
                marks: [],
                data: {},
              },
              {
                nodeType: BLOCKS.EMBEDDED_ASSET,
                data: {
                  target: {
                    sys: {
                      id: 'asset-id',
                      type: 'Link',
                      linkType: 'Asset',
                    },
                  },
                },
                content: [],
              },
              {
                nodeType: 'text',
                value: '',
                marks: [],
                data: {},
              },
            ],
          },
        ],
      };

      vi.clearAllMocks();
      vi.mocked(useSDK).mockReturnValue(dialogMockSdk(currentFieldWithEntry, publishedField));
    });

    it('handles block embedded assets in rich text content', async () => {
      mockSdk.cma.asset.getMany = vi.fn().mockResolvedValue({
        items: [
          {
            sys: {
              id: 'asset-id',
              updatedAt: new Date().toISOString(),
              publishedAt: new Date().toISOString(),
            },
            fields: {
              title: { 'en-US': 'Banana' },
            },
          },
        ],
      });

      render(<Dialog />);

      await waitFor(() => {
        expect(screen.getByText('Banana')).toBeInTheDocument();
      });

      expect(screen.getByText('Current version')).toBeInTheDocument();
      expect(screen.getByText('Published version')).toBeInTheDocument();
    });

    it('handles missing block embedded assets gracefully', async () => {
      mockSdk.cma.asset.getMany = vi.fn().mockResolvedValue({
        items: [], // No entries found
      });

      render(<Dialog />);

      await waitFor(() => {
        expect(screen.getByText('Asset missing or inaccessible')).toBeInTheDocument();
      });

      expect(screen.getByText('Current version')).toBeInTheDocument();
      expect(screen.getByText('Published version')).toBeInTheDocument();
    });
  });
});
