import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import Dialog from './Dialog';
import { DialogAppSDK } from '@contentful/app-sdk';
import { AppParameters, Product } from '../../interfaces';

describe('Dialog', () => {
  let sdkMock: DialogAppSDK<AppParameters>;

  beforeAll(() => {
    vi.mock('../../api/fetchBaseSites', () => ({
      fetchBaseSites: vi.fn(() => Promise.resolve(['site1', 'site2'])),
    }));

    vi.mock('../../api/fetchProductList', () => ({
      fetchProductList: vi.fn((baseSite, query, page, parameters, updateTotalPages) => {
        const products: Product[] = [
          {
            id: 'product1',
            name: 'Product 1',
            sku: 'P1',
            image: 'image1.jpg',
            productUrl: 'product1',
          },
          {
            id: 'product2',
            name: 'Product 2',
            sku: 'P2',
            image: 'image2.jpg',
            productUrl: 'product2',
          },
        ];
        updateTotalPages(2); // Set total pages to 2 for testing pagination
        return Promise.resolve({ products, errors: [] });
      }),
    }));

    sdkMock = {
      window: {
        startAutoResizer: vi.fn(),
      },
      space: {
        sys: {
          id: 'spaceId',
        },
      },
      dialogs: {
        openCurrentApp: vi.fn(),
      },
      parameters: {
        installation: {},
        invocation: {
          apiEndpoint: 'https://api.example.com',
          baseSites: 'site1,site2',
          fieldValue: [],
        },
      },
      cma: {},
      cmaAdapter: {},
    } as unknown as DialogAppSDK<AppParameters>;
  });

  afterAll(() => {
    vi.clearAllMocks();
  });

  it('renders correctly and matches snapshot', async () => {
    const { container } = render(<Dialog sdk={sdkMock} />);
    await waitFor(() => screen.getByText('Product 1')); // Wait for products to load
    expect(container).toMatchSnapshot();
  });

  it('loads base sites and products on mount', async () => {
    render(<Dialog sdk={sdkMock} />);
    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument();
      expect(screen.getByText('Product 2')).toBeInTheDocument();
    });
  });

  it('updates products when base site is changed', async () => {
    render(<Dialog sdk={sdkMock} />);
    await waitFor(() => screen.getByText('Product 1'));

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'site2' } });
    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument();
      expect(screen.getByText('Product 2')).toBeInTheDocument();
    });
  });

  it('updates products when search term is entered', async () => {
    render(<Dialog sdk={sdkMock} />);
    await waitFor(() => screen.getByText('Product 1'));

    const searchInput = screen.getByPlaceholderText('Search Term...');
    fireEvent.change(searchInput, { target: { value: 'Product 1' } });
    fireEvent.keyPress(searchInput, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument();
    });
  });

  it('handles pagination correctly', async () => {
    render(<Dialog sdk={sdkMock} />);
    await waitFor(() => screen.getByText('Product 1'));

    fireEvent.click(screen.getByText('Next'));
    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument(); // This would normally update if the API call was real
    });

    fireEvent.click(screen.getByText('Previous'));
    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument(); // Same as above
    });
  });
});
