import ResourceCard from './ResourceCard';
import { externalResource } from '../../../../../test/mocks';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';

const { getByText, getByTestId } = screen;

describe('ResourceCard component', () => {
  it('mounts', () => {
    render(
      <ResourceCard
        cardHeader="Kleenex product"
        onSelect={() => {}}
        resource={externalResource}
        selectedResources={[]}
      />
    );

    const productName = externalResource.name!;
    const productDescription = externalResource.description!;

    expect(getByText(productName)).toBeVisible();
    expect(getByText(productDescription)).toBeVisible();
  });

  it('handles onSelect', async () => {
    userEvent.setup();
    const mockOnSelect = jest.fn();
    render(
      <ResourceCard
        cardHeader="Kleenex product"
        onSelect={mockOnSelect}
        resource={externalResource}
        selectedResources={[]}
      />
    );

    const productName = externalResource.name!;
    await userEvent.click(getByText(productName));

    expect(mockOnSelect).toHaveBeenCalled();
  });
});
