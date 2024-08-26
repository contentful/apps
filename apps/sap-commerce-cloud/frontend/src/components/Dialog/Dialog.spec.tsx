import { mockCma } from '@__mocks__/mockCma';
import { makeSdkMock } from '@__mocks__/mockSdk';
import Dialog from '@components/Dialog/Dialog';
import { Product } from '@interfaces';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

const mockSdk = makeSdkMock();
vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

describe('Dialog', () => {
  beforeAll(() => {
    vi.mock('@api/fetchBaseSites', () => ({
      fetchBaseSites: vi.fn(() => Promise.resolve(['site1', 'site2'])),
    }));

    vi.mock('@api/fetchProductList', () => ({
      fetchProductList: vi.fn(({ updateTotalPages }) => {
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
        updateTotalPages(2);
        return Promise.resolve({ products, errors: [] });
      }),
    }));
  });

  afterAll(() => {
    vi.clearAllMocks();
  });

  it('renders correctly and matches snapshot', async () => {
    const { container } = render(<Dialog />);
    await waitFor(() => screen.getByText('Product 1'));
    expect(container).toMatchSnapshot();
  });

  it('loads base sites and products on mount', async () => {
    render(<Dialog />);
    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument();
      expect(screen.getByText('Product 2')).toBeInTheDocument();
    });
  });

  it('updates products when base site is changed', async () => {
    render(<Dialog />);
    await waitFor(() => screen.getByText('Product 1'));

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'site2' } });
    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument();
      expect(screen.getByText('Product 2')).toBeInTheDocument();
    });
  });

  it('updates products when search term is entered', async () => {
    render(<Dialog />);
    await waitFor(() => screen.getByText('Product 1'));

    const searchInput = screen.getByPlaceholderText('Type to search products');
    fireEvent.change(searchInput, { target: { value: 'Product 1' } });
    fireEvent.keyPress(searchInput, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument();
    });
  });

  it('handles pagination correctly', async () => {
    render(<Dialog />);
    await waitFor(() => screen.getByText('Product 1'));

    fireEvent.click(screen.getByText('Next'));
    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Previous'));
    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument();
    });
  });
});
