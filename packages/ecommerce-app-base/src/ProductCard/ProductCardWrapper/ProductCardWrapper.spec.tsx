import ProductCardWrapper from './ProductCardWrapper';
import {
  mockSdk,
  mockCma,
  externalResource,
  externalResourceLink,
  externalResourceLinks,
} from '../../__mocks__';
import { render, screen } from '@testing-library/react';
import * as React from 'react';
import { ResourceFieldProvider } from '../context';

jest.mock('../ProductCardMenu/ProductCardMenu', () => () => <div>Product card menu component</div>);

jest.mock('../helpers/resourceProviderUtils', () => ({
  getResourceProviderAndType: () => ({
    resourceType: 'product',
    resourceProvider: 'shopify',
  }),
}));

jest.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

let mockExternalResource = externalResource;
jest.mock('../hooks/field/useExternalResource', () => () => ({
  isLoading: false,
  externalResource: mockExternalResource,
}));

const { findByTestId } = screen;

describe('ProductCardWrapper component', () => {
  it('mounts', async () => {
    render(
      <ResourceFieldProvider
        logoUrl={''}
        isMultiple={false}
        handleMoveToBottom={jest.fn()}
        handleMoveToTop={jest.fn()}
        handleAddResource={jest.fn()}
        handleRemove={jest.fn()}>
        <ProductCardWrapper
          externalResourceLink={externalResourceLink}
          cardIndex={1}
          resourceArray={externalResourceLinks}
          productCardType="field"
        />
      </ResourceFieldProvider>
    );

    const resourceField = await findByTestId('cf-ui-card');

    expect(resourceField).toBeVisible();
  });
});
