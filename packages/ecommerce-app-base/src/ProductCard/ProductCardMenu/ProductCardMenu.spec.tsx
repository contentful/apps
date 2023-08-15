import * as React from 'react';
import ProductCardMenu from './ProductCardMenu';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const { getByTestId, findByTestId, queryByTestId } = screen;
jest.mock('../hooks/field/useResourceMenuItems', () => () => ({
  menuItems: [<div key="mock-menu-item">Mock Menu Item</div>],
}));

const props = {
  onRemove: jest.fn(),
  isDataVisible: true,
  onShowData: jest.fn(),
  onHideData: jest.fn(),
};

describe('ProductCardMenu component', () => {
  it('mounts', () => {
    render(<ProductCardMenu {...props} />);

    const iconButton = getByTestId('cf-ui-icon-button');
    const icon = getByTestId('cf-ui-icon');

    expect(iconButton).toBeVisible();
    expect(icon).toBeVisible();
  });

  it('opens and closes menu on click', async () => {
    userEvent.setup();
    render(<ProductCardMenu {...props} />);

    const iconButton = getByTestId('cf-ui-icon-button');
    await userEvent.click(iconButton);
    const menuList = await findByTestId('cf-ui-menu-list');

    expect(menuList).toBeVisible();

    await userEvent.click(iconButton);

    const menu = queryByTestId('cf-ui-menu');
    expect(menu).toBeFalsy();
  });
});
