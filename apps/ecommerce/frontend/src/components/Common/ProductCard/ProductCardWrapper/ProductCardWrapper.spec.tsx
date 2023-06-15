import React from 'react';
import ProductCardWrapper from './ProductCardWrapper';
import {
  mockSdk,
  mockCma,
  externalResource,
  externalResourceLink,
  externalResourceLinks,
} from '../../../../../test/mocks';
import { render, screen } from '@testing-library/react';

jest.mock('../ProductCardMenu/ProductCardMenu', () => () => (
  <div>Product card menuc component</div>
));

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

let mockExternalResource = externalResource;
jest.mock('hooks/field/useExternalResource', () => () => ({
  isLoading: false,
  externalResource: mockExternalResource,
}));

const { findByTestId } = screen;

describe('ProductCardWrapper component', () => {
  const mockUseContext: jest.SpyInstance = jest.spyOn(React, 'useContext');
  beforeEach(() => {
    mockUseContext.mockReturnValue({
      handleRemove: jest.fn(),
      handleMoveToBottom: jest.fn(),
      handleMoveToTop: jest.fn(),
      isMultiple: false,
    });
  });
  it('mounts', async () => {
    render(
      <ProductCardWrapper
        externalResourceLink={externalResourceLink}
        cardIndex={1}
        resourceArray={externalResourceLinks}
        productCardType="field"
      />
    );

    const resourceField = await findByTestId('cf-ui-card');

    expect(resourceField).toBeVisible();
  });
});
