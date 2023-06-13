import DialogBody from './DialogBody';
import { externalResource } from '../../../../../test/mocks';
import { render, screen } from '@testing-library/react';

const { getByText } = screen;

describe('DialogBody component', () => {
  it('mounts', () => {
    render(
      <DialogBody
        externalResources={[externalResource]}
        resourceProvider="shopify"
        resourceType="product"
        onSelect={() => {}}
        selectedResources={[]}
      />
    );

    const productName = externalResource.name!;
    const productDescription = externalResource.description!;

    expect(getByText(productName)).toBeVisible();
    expect(getByText(productDescription)).toBeVisible();
  });
});
