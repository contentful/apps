import ResourceList from './ResourceList';
import { externalResources } from '../../../../../test/mocks';
import { render, screen } from '@testing-library/react';

const { getByText } = screen;

describe('ResourceList component', () => {
  it('mounts', () => {
    render(
      <ResourceList
        externalResources={externalResources}
        resourceProvider="shopify"
        resourceType="product"
        onSelect={() => {}}
        selectedResources={[]}
      />
    );

    const productName = externalResources[0].title!;
    const productDescription = externalResources[0].description!;

    expect(getByText(productName)).toBeVisible();
    expect(getByText(productDescription)).toBeVisible();
  });
});
