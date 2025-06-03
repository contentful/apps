import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, beforeEach, vi, expect } from 'vitest';
import Page from '../../../src/locations/Page';
import { mockSdk } from '../../mocks/mockSdk';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

describe('Page Component Error Handling', () => {
  beforeEach(() => {
    mockSdk.cma = {
      contentType: {
        getMany: vi.fn().mockRejectedValue(new Error('Failed to fetch content types')),
        get: vi.fn(),
      },
      entry: {
        getMany: vi.fn().mockRejectedValue(new Error('Failed to fetch entries')),
      },
    };
  });

  it('handles content type fetch error gracefully', async () => {
    render(<Page />);
    await waitFor(() => {
      expect(screen.queryByText('Condo A')).not.toBeInTheDocument();
    });
  });

  it('handles entry fetch error gracefully', async () => {
    mockSdk.cma.contentType.getMany = vi.fn().mockResolvedValue({
      items: [{ sys: { id: 'condoA' }, name: 'Condo A' }],
    });
    render(<Page />);
    await waitFor(() => {
      expect(screen.queryByText('Building one')).not.toBeInTheDocument();
    });
  });
});

describe('Page Component Loading States', () => {
  beforeEach(() => {
    mockSdk.cma = {
      contentType: {
        getMany: vi.fn().mockImplementation(
          () =>
            new Promise((resolve) => {
              setTimeout(() => {
                resolve({ items: [{ sys: { id: 'condoA' }, name: 'Condo A' }] });
              }, 100);
            })
        ),
        get: vi.fn(),
      },
      entry: {
        getMany: vi.fn().mockImplementation(
          () =>
            new Promise((resolve) => {
              setTimeout(() => {
                resolve({ items: [] });
              }, 100);
            })
        ),
      },
    };
  });

  it('shows loading spinner while fetching content types', async () => {
    render(<Page />);
    expect(screen.getAllByTitle('Loading…')[0]).toBeInTheDocument();
  });
});

describe('Page Component Table Features', () => {
  const mockContentType = {
    sys: { id: 'condoA' },
    name: 'Condo A',
    fields: [
      { id: 'displayName', name: 'Display Name' },
      { id: 'description', name: 'Description' },
    ],
  };

  const mockEntry = {
    sys: {
      id: '1',
      contentType: { sys: { id: 'condoA' } },
      publishedVersion: 1,
      version: 2,
    },
    fields: {
      displayName: { 'en-US': 'Test Building' },
      description: { 'en-US': 'Test Description' },
    },
  };

  beforeEach(() => {
    mockSdk.cma = {
      contentType: {
        getMany: vi.fn().mockResolvedValue({ items: [mockContentType] }),
        get: vi.fn().mockResolvedValue(mockContentType),
      },
      entry: {
        getMany: vi.fn().mockResolvedValue({ items: [mockEntry] }),
      },
    };
  });

  it('renders all fields in the table header', async () => {
    render(<Page />);
    await waitFor(() => {
      expect(screen.getByText('Display Name')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
    });
  });

  it('renders entry data in the table cells', async () => {
    render(<Page />);
    await waitFor(() => {
      expect(screen.getByText('Test Building')).toBeInTheDocument();
      expect(screen.getByText('Test Description')).toBeInTheDocument();
    });
  });
});
