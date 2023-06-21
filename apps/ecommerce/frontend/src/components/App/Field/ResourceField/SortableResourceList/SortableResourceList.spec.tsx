import React from 'react';
import SortableResourceList from './SortableResourceList';
import { render, screen } from '@testing-library/react';
import {
  mockSdk,
  externalResourceLink,
  mockCma,
  externalResource,
} from '../../../../../../test/mocks';

jest.mock('components/Common/ProductCard/ProductCardMenu/ProductCardMenu', () => () => (
  <div>Product card menu component</div>
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

let mockExternalResource = externalResource;
jest.mock('hooks/field/useExternalResource', () => () => ({
  isLoading: false,
  externalResource: mockExternalResource,
}));

const { getByTestId } = screen;

describe('SortableResourceList component', () => {
  const mockUseContext: jest.SpyInstance = jest.spyOn(React, 'useContext');

  beforeEach(() => {
    mockUseContext.mockReturnValue({
      isMultiple: false,
    });
  });

  it('mounts', () => {
    render(<SortableResourceList resourceArray={[externalResourceLink]} />);

    const resourceField = getByTestId('cf-ui-card');

    expect(resourceField).toBeVisible();
  });
});
