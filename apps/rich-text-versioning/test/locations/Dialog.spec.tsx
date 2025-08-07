import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { mockCma, mockSdk } from '../mocks';
import Dialog from '../../src/locations/Dialog';
import { BLOCKS } from '@contentful/rich-text-types';

// Extend the existing mockSdk for Dialog-specific functionality
const dialogMockSdk = {
  ...mockSdk,
  close: vi.fn(),
  parameters: {
    invocation: {
      currentField: {
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
      publishedField: {
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
};

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => dialogMockSdk,
  useCMA: () => mockCma,
  useAutoResizer: vi.fn(),
}));

describe('Dialog component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  // todo : see if its too complex to check the crossed text
});
