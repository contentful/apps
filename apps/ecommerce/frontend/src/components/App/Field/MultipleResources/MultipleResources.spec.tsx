import MultipleResources from './MultipleResources';
import { mockSdk, mockCma } from '../../../../../test/mocks';
import { render, screen } from '@testing-library/react';
import fetchWithSignedRequest from 'helpers/signedRequests';
import userEvent from '@testing-library/user-event';

const LOGO_URL =
  'https://images.ctfassets.net/juh8bvgveao4/4eTYD0rlVO5tAucQoStln/952f5ed757229c91a099e61d8463f2f9/shopify.svg';

jest.mock('helpers/resourceProviderUtils', () => ({
  getResourceProviderAndType: () => ({
    resourceType: 'product',
    resourceProvider: 'shopify',
  }),
}));

jest.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

jest.mock('helpers/signedRequests');

jest.mock('hooks/field/useResourceValue', () => () => {
  const value = [
    {
      sys: {
        linkType: 'Shopify:Product',
        type: 'ResourceLink',
        urn: 'gid://shopify/Product/123456',
      },
    },
  ];
  return { value };
});

const mockFetchWithSignedRequest = fetchWithSignedRequest as jest.MockedFunction<
  typeof fetchWithSignedRequest
>;

const { findByTestId, findByText } = screen;

describe('MultipleResources component', () => {
  beforeEach(() => {
    const mockApiResponse = {
      ok: true,
      statusText: '',
      json: () => ({ logoUrl: LOGO_URL }),
    } as unknown as Promise<Response>;
    mockFetchWithSignedRequest.mockImplementation(async () => mockApiResponse);
  });

  it('mounts', async () => {
    render(<MultipleResources />);

    const resourceField = await findByTestId('resource-field');

    expect(resourceField).toBeVisible();
  });

  it('handles adding a resource ', async () => {
    userEvent.setup();
    const mockOpenCurrentApp = jest.fn(async () => [{ id: 'gid://shopify/Product/8191006998814' }]);
    const mockSetValue = jest.fn();
    mockSdk.dialogs.openCurrentApp = mockOpenCurrentApp;
    mockSdk.field.setValue = mockSetValue;
    render(<MultipleResources />);

    const editResourceButton = await findByText('Add products');
    userEvent.click(editResourceButton);

    await new Promise((cb) => setTimeout(cb, 50));

    expect(mockOpenCurrentApp).toHaveBeenCalled();
    expect(mockSetValue).toHaveBeenCalled();
  });
});
