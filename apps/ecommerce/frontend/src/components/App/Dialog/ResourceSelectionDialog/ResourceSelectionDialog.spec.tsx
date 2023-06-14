import ResourceSelectionDialog from './ResourceSelectionDialog';
import { externalResources, externalResource, mockSdk, mockCma } from '../../../../../test/mocks';
import { render, screen } from '@testing-library/react';
import fetchWithSignedRequest from 'helpers/signedRequests';
import userEvent from '@testing-library/user-event';

jest.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
  useAutoResizer: () => jest.fn(),
}));

jest.mock('helpers/resourceProviderUtils', () => ({
  getResourceProviderAndType: () => ({
    resourceType: 'product',
    resourceProvider: 'shopify',
  }),
}));

jest.mock('helpers/signedRequests');

const mockFetchWithSignedRequest = fetchWithSignedRequest as jest.MockedFunction<
  typeof fetchWithSignedRequest
>;

const { getByText, getByTestId, findByText } = screen;

describe('ResourceSelectionDialog component', () => {
  beforeEach(() => {
    const mockApiResponse = {
      ok: true,
      statusText: '',
      json: () => externalResources,
    } as unknown as Promise<Response>;
    mockFetchWithSignedRequest.mockImplementation(async () => mockApiResponse);
  });

  it('mounts components for "single" fieldType', async () => {
    mockSdk.parameters.invocation = {
      linkType: 'test link',
      fieldType: 'single',
    };

    render(<ResourceSelectionDialog />);

    const headerText = await findByText('Select a product');
    const resourceCountText = getByText('3 products');
    const dialogHeader = getByTestId('dialog-header');
    const dialogBody = getByTestId('dialog-body');

    expect(headerText).toBeVisible();
    expect(resourceCountText).toBeVisible();
    expect(dialogHeader).toBeVisible();
    expect(dialogBody).toBeVisible();

    const productName = externalResource.name!;
    const productDescription = externalResource.description!;

    expect(getByText(productName)).toBeVisible();
    expect(getByText(productDescription)).toBeVisible();
  });

  it('mounts components for "multiple" fieldTypes', async () => {
    mockSdk.parameters.invocation = {
      linkType: 'Shopify:Product',
      fieldType: 'multiple',
    };

    render(<ResourceSelectionDialog />);

    const headerText = await findByText('Select products');
    expect(headerText).toBeVisible();
  });

  it('handles selection of a single resource', async () => {
    userEvent.setup();
    mockSdk.parameters.invocation = {
      linkType: 'Shopify:Product',
      fieldType: 'single',
    };

    render(<ResourceSelectionDialog />);

    await findByText('Select a product');

    const resourceCard = getByText(externalResource.name!);
    userEvent.click(resourceCard);

    await findByText('3 products, 1 selected');
  });

  it('handles selection of multiple resources', async () => {
    userEvent.setup();
    mockSdk.parameters.invocation = {
      linkType: 'Shopify:Product',
      fieldType: 'multiple',
    };

    render(<ResourceSelectionDialog />);

    await findByText('Select products');

    const resourceCard1 = getByText(externalResource.name!);
    userEvent.click(resourceCard1);

    await findByText('3 products, 1 selected');

    const resourceCard2 = getByText(externalResources[1].name!);
    userEvent.click(resourceCard2);

    await findByText('3 products, 2 selected');
  });
});
