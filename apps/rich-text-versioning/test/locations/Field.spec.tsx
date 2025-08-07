import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { mockCma, mockSdk } from '../mocks';
import Field from '../../src/locations/Field';
import { Document, BLOCKS } from '@contentful/rich-text-types';

// Mock the contentful client
vi.mock('contentful', () => ({
  createClient: vi.fn(() => ({
    getEntry: vi.fn(),
  })),
}));

// Mock the rich text editor
vi.mock('@contentful/field-editor-rich-text', () => ({
  RichTextEditor: ({ sdk }: { sdk: any }) => (
    <div data-testid="rich-text-editor">Rich Text Editor</div>
  ),
}));

// Mock the dialog
const mockOpenCurrentApp = vi.fn();

// Extend the existing mockSdk for Field-specific functionality
const fieldMockSdk = {
  ...mockSdk,
  field: {
    getValue: vi.fn(),
    onValueChanged: vi.fn(),
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

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => fieldMockSdk,
  useCMA: () => mockCma,
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
      version: 3,
      publishedVersion: 1,
    });
  });

  it('renders RichTextEditor', () => {
    render(<Field />);

    expect(screen.getByText('Rich Text Editor')).toBeInTheDocument();
  });

  it('shows View Diff button when field value and entry sys are available', () => {
    render(<Field />);

    expect(screen.getByText('View Diff')).toBeInTheDocument();
  });

  it('disables View Diff button when entry is not changed', async () => {
    fieldMockSdk.entry.getSys.mockReturnValue({
      id: 'test-entry',
      version: 1,
      publishedVersion: 1,
    });

    render(<Field />);

    const button = screen.getByTestId('view-diff-button');
    expect(button).toBeDisabled();
  });

  it('enables View Diff button when entry is changed', () => {
    fieldMockSdk.entry.getSys.mockReturnValue({
      id: 'test-entry',
      version: 3,
      publishedVersion: 1,
    });

    render(<Field />);
    const button = screen.getByText('View Diff');
    expect(button).not.toBeDisabled();
  });

  it('opens dialog when View Diff button is clicked', async () => {
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

    fieldMockSdk.field.getValue.mockReturnValue(mockFieldValue);

    render(<Field />);

    const button = screen.getByText('View Diff');
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockOpenCurrentApp).toHaveBeenCalledWith({
        title: 'Version Comparison',
        width: 1200,
        minHeight: 500,
        parameters: {
          currentField: mockFieldValue,
          publishedField: undefined,
        },
      });
    });
  });
});
