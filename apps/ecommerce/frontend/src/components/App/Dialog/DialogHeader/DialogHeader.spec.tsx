import DialogHeader from './DialogHeader';
import { mockSdk, mockCma } from '../../../../../test/mocks';
import { render, screen } from '@testing-library/react';
import fetchWithSignedRequest from 'helpers/signedRequests';

const LOGO_URL =
  'https://images.ctfassets.net/juh8bvgveao4/4eTYD0rlVO5tAucQoStln/952f5ed757229c91a099e61d8463f2f9/shopify.svg';

jest.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

jest.mock('helpers/signedRequests');

const mockFetchWithSignedRequest = fetchWithSignedRequest as jest.MockedFunction<
  typeof fetchWithSignedRequest
>;

const { getByText, findByText } = screen;

describe('DialogHeader component', () => {
  beforeEach(() => {
    const mockApiResponse = {
      ok: true,
      statusText: '',
      json: () => ({ logoUrl: LOGO_URL }),
    } as unknown as Promise<Response>;
    mockFetchWithSignedRequest.mockImplementation(async () => mockApiResponse);
  });

  it('mounts components for "single" fieldType', async () => {
    render(
      <DialogHeader
        headerText="Select a product"
        onSave={() => {}}
        resourceCountText="3 products"
      />
    );

    const headerText = await findByText('Select a product');
    const resourceCountText = getByText('3 products');
    const logo = document.querySelector('img');

    expect(headerText).toBeVisible();
    expect(resourceCountText).toBeVisible();
    expect(logo?.getAttribute('src')).toBe(LOGO_URL);
  });
});
