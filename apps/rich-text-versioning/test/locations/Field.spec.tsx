import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { mockSdk } from '../mocks';
import Field from '../../src/locations/Field';
import { Document, BLOCKS } from '@contentful/rich-text-types';

let capturedDecoratedSdk: any = null;
vi.mock('@contentful/field-editor-rich-text', () => ({
  RichTextEditor: ({ sdk }: { sdk: any }) => {
    capturedDecoratedSdk = sdk;
    return <div data-testid="rich-text-editor">Rich Text Editor</div>;
  },
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
    selectSingleEntry: vi.fn(),
    selectMultipleEntries: vi.fn(),
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

  it('shows Compare versions button when field value and entry sys are available', () => {
    render(<Field />);

    expect(screen.getByTestId('view-diff-button')).toBeInTheDocument();
  });

  it('disables Compare versions button when entry is not changed', async () => {
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

  it('disables Compare versions button when entry is in draft', async () => {
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

  it('enables Compare versions button when entry has changes', () => {
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

  it('opens dialog when Compare versions button is clicked', async () => {
    fieldMockSdk.field.getValue.mockReturnValue(mockFieldValue);
    fieldMockSdk.cma.entry.getPublished.mockReturnValue(mockPublishedField);

    render(<Field />);

    const button = screen.getByText('Compare versions');
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockOpenCurrentApp).toHaveBeenCalledWith({
        title: 'Version comparison',
        width: 'fullWidth',
        shouldCloseOnOverlayClick: true,
        shouldCloseOnEscapePress: true,
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

  describe('SDK decorator for entity-picker recommendations (ES-262)', () => {
    beforeEach(() => {
      capturedDecoratedSdk = null;
      fieldMockSdk.entry.getSys.mockReturnValue({ id: 'test-entry' });
      fieldMockSdk.field = { ...fieldMockSdk.field, id: 'mainContent' } as any;
    });

    it('injects entityId and referenceFieldId into selectSingleEntry recommendations', () => {
      render(<Field />);
      capturedDecoratedSdk.dialogs.selectSingleEntry({});
      expect(fieldMockSdk.dialogs.selectSingleEntry).toHaveBeenCalledWith({
        recommendations: { entityId: 'test-entry', referenceFieldId: 'mainContent' },
      });
    });

    it('preserves caller-supplied recommendations keys (e.g. searchQuery from HyperlinkModal)', () => {
      render(<Field />);
      capturedDecoratedSdk.dialogs.selectSingleEntry({
        contentTypes: ['article'],
        recommendations: { searchQuery: 'how does X work' },
      });
      expect(fieldMockSdk.dialogs.selectSingleEntry).toHaveBeenCalledWith({
        contentTypes: ['article'],
        recommendations: {
          entityId: 'test-entry',
          referenceFieldId: 'mainContent',
          searchQuery: 'how does X work',
        },
      });
    });

    it('lets caller-supplied recommendations keys override the injected base', () => {
      render(<Field />);
      capturedDecoratedSdk.dialogs.selectSingleEntry({
        recommendations: { entityId: 'override', referenceFieldId: 'override-field' },
      });
      expect(fieldMockSdk.dialogs.selectSingleEntry).toHaveBeenCalledWith({
        recommendations: { entityId: 'override', referenceFieldId: 'override-field' },
      });
    });

    it('decorates selectMultipleEntries the same way', () => {
      render(<Field />);
      capturedDecoratedSdk.dialogs.selectMultipleEntries({
        recommendations: { searchQuery: 'q' },
      });
      expect(fieldMockSdk.dialogs.selectMultipleEntries).toHaveBeenCalledWith({
        recommendations: {
          entityId: 'test-entry',
          referenceFieldId: 'mainContent',
          searchQuery: 'q',
        },
      });
    });
  });

  it('open the modal with errors when the content could not be loaded correctly', async () => {
    fieldMockSdk.field.getValue.mockReturnValue(mockFieldValue);
    fieldMockSdk.cma.entry.getPublished.mockRejectedValue(new Error());

    render(<Field />);
    const button = screen.getByText('Compare versions');
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockOpenCurrentApp).toHaveBeenCalledWith({
        title: 'Version comparison',
        width: 'small',
        shouldCloseOnOverlayClick: true,
        shouldCloseOnEscapePress: true,
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
