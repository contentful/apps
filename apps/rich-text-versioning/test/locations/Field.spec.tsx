import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { mockSdk } from '../mocks';
import Field from '../../src/locations/Field';
import { Document, BLOCKS } from '@contentful/rich-text-types';

vi.mock('@contentful/field-editor-rich-text', () => ({
  RichTextEditor: ({ sdk }: { sdk: any }) => (
    <div data-testid="rich-text-editor">Rich Text Editor</div>
  ),
}));

const mockOpenCurrentApp = vi.fn();

const fieldMockSdk = {
  ...mockSdk,
  field: {
    getValue: vi.fn(),
    onValueChanged: vi.fn(),
    locale: 'en-US',
  },
  entry: {
    getSys: vi.fn(),
    onSysChanged: vi.fn(),
  },
  dialogs: {
    openCurrentApp: mockOpenCurrentApp,
  },
  parameters: {
    installation: {
      contentfulApiKey: 'test-api-key',
    },
  },
  ids: {
    space: 'test-space',
    environment: 'test-environment',
    entry: 'test-entry',
  },
};

const mockFieldValue: Document = {
  nodeType: BLOCKS.DOCUMENT,
  data: {},
  content: [
    {
      nodeType: BLOCKS.PARAGRAPH,
      data: {},
      content: [
        {
          nodeType: 'text',
          value: 'Test content',
          marks: [],
          data: {},
        },
      ],
    },
  ],
};

const mockPublishedField = {
  items: [
    {
      fields: {
        text: {
          'en-US': 'Test content',
        },
      },
    },
  ],
};

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => fieldMockSdk,
  useAutoResizer: vi.fn(),
}));

describe('Field component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fieldMockSdk.field.getValue.mockReturnValue({
      nodeType: BLOCKS.DOCUMENT,
      data: {},
      content: [],
    });
    fieldMockSdk.entry.getSys.mockReturnValue({
      id: 'test-entry',
      fieldStatus: {
        '*': {
          'en-US': 'changed',
        },
      },
    });
  });

  it('renders RichTextEditor', () => {
    render(<Field />);

    expect(screen.getByText('Rich Text Editor')).toBeInTheDocument();
  });

  it('shows View Diff button when field value and entry sys are available', () => {
    render(<Field />);

    expect(screen.getByTestId('view-diff-button')).toBeInTheDocument();
  });

  it('disables View Diff button when entry is not changed', async () => {
    fieldMockSdk.entry.getSys.mockReturnValue({
      id: 'test-entry',
      fieldStatus: {
        '*': {
          'en-US': 'published',
        },
      },
    });

    render(<Field />);

    const button = screen.getByTestId('view-diff-button');
    expect(button).toBeDisabled();
  });

  it('disables View Diff button when entry is in draft', async () => {
    fieldMockSdk.entry.getSys.mockReturnValue({
      id: 'test-entry',
      fieldStatus: {
        '*': {
          'en-US': 'draft',
        },
      },
    });

    render(<Field />);

    const button = screen.getByTestId('view-diff-button');
    expect(button).toBeDisabled();
  });

  it('enables View Diff button when entry has changes', () => {
    fieldMockSdk.entry.getSys.mockReturnValue({
      id: 'test-entry',
      fieldStatus: {
        '*': {
          'en-US': 'changed',
        },
      },
    });

    render(<Field />);
    const button = screen.getByTestId('view-diff-button');

    expect(button).not.toBeDisabled();
  });

  it('opens dialog when View Diff button is clicked', async () => {
    fieldMockSdk.field.getValue.mockReturnValue(mockFieldValue);
    fieldMockSdk.cma.entry.getPublished.mockReturnValue(mockPublishedField);

    render(<Field />);

    const button = screen.getByText('View Diff');
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockOpenCurrentApp).toHaveBeenCalledWith({
        title: 'Version Comparison',
        width: 'fullWidth',
        parameters: {
          currentField: mockFieldValue,
          publishedField: undefined,
          locale: 'en-US',
          errorInfo: {
            hasError: false,
          },
        },
      });
    });
  });

  it('open the modal with errors when the content could not be loaded correctly', async () => {
    fieldMockSdk.field.getValue.mockReturnValue(mockFieldValue);
    fieldMockSdk.cma.entry.getPublished.mockRejectedValue(new Error());

    render(<Field />);
    const button = screen.getByText('View Diff');
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockOpenCurrentApp).toHaveBeenCalledWith({
        title: 'Version Comparison',
        width: 'small',
        parameters: {
          currentField: mockFieldValue,
          publishedField: undefined,
          locale: 'en-US',
          errorInfo: {
            hasError: true,
            errorCode: '500',
            errorMessage: 'Error loading content',
          },
        },
      });
    });
  });
});
