import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { mockCma, mockSdk } from '../mocks';
import Dialog from '../../src/locations/Dialog';
import { BLOCKS } from '@contentful/rich-text-types';
import { useSDK, useCMA } from '@contentful/react-apps-toolkit';

// Extend the existing mockSdk for Dialog-specific functionality
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

const dialogMockSdk = {
  ...mockSdk,
  close: vi.fn(),
  parameters: {
    invocation: {
      currentField: currentField,
      publishedField: publishedField,
    },
  },
};

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: vi.fn(),
  useCMA: vi.fn(),
  useAutoResizer: vi.fn(),
}));

describe('Dialog component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useSDK).mockReturnValue(dialogMockSdk);
    vi.mocked(useCMA).mockReturnValue(mockCma);
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
});
