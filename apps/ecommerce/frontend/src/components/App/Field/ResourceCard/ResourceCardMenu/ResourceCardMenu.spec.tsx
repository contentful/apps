import ResourceCardMenu from './ResourceCardMenu';
import { render, screen, fireEvent } from '@testing-library/react';

const { getByTestId, findByTestId, queryByTestId } = screen;

jest.mock('hooks/field/useResourceMenuItems', () => () => ({
  menuItems: [<div key="mock-menu-item">Mock Menu Item</div>],
}));

const props = {
  onRemove: jest.fn(),
  isDataVisible: true,
  onShowData: jest.fn(),
  onHideData: jest.fn(),
};

describe('ResourceCardMenu component', () => {
  it('mounts', () => {
    render(<ResourceCardMenu {...props} />);

    const iconButton = getByTestId('cf-ui-icon-button');
    const icon = getByTestId('cf-ui-icon');

    expect(iconButton).toBeVisible();
    expect(icon).toBeVisible();
  });

  it('opens and closes menu on click', async () => {
    render(<ResourceCardMenu {...props} />);

    const iconButton = getByTestId('cf-ui-icon-button');
    fireEvent.click(iconButton);
    const menuList = await findByTestId('cf-ui-menu-list');

    expect(menuList).toBeVisible();

    fireEvent.click(iconButton);

    const menu = queryByTestId('cf-ui-menu');
    expect(menu).toBeFalsy();
  });
});
