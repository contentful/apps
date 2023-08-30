import { ProductCardMenu } from './ProductCardMenu';
import { render, screen } from '@testing-library/react';

const { getByTestId } = screen;

const props = {
  onRemove: jest.fn(),
  isDataVisible: true,
};

describe('ProductCardMenu component', () => {
  it('mounts', () => {
    render(<ProductCardMenu {...props} />);

    const iconButton = getByTestId('cf-ui-icon-button');
    const icon = getByTestId('cf-ui-icon');

    expect(iconButton).toBeVisible();
    expect(icon).toBeVisible();
  });
});
