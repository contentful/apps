import ResourceCard from './ResourceCard';
import { externalResource } from '../../../../../test/mocks';
import { fireEvent, render, screen } from '@testing-library/react';

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

  it('handles onSelect', () => {
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
    fireEvent.click(getByText(productName));

    expect(mockOnSelect).toHaveBeenCalled();
  });

  it('enables selection', () => {
    const mockOnSelect = jest.fn();
    render(
      <ResourceCard
        cardHeader="Kleenex product"
        onSelect={mockOnSelect}
        resource={externalResource}
        selectedResources={[externalResource]}
      />
    );

    const card = getByTestId('cf-ui-card');
    expect(card).toBeEnabled();
  });
});
