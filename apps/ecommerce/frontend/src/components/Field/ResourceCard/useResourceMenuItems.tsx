import { Menu } from '@contentful/f36-components';
import { useEffect, useMemo, useState } from 'react';
import type { ResourceCardMenuProps } from './ResourceCardMenu';

type menuItemsOutput = { menuItems: JSX.Element[] };

const useResourceMenuItems = (menuActions: ResourceCardMenuProps): menuItemsOutput => {
  const defaultMenuItems = useMemo(
    () => [
      <Menu.Item key="delete" onClick={() => menuActions.onRemove()}>
        Remove
      </Menu.Item>,
    ],
    [menuActions]
  );

  const [menuItems, setMenuItems] = useState([...defaultMenuItems]);

  const addMenuItems = () => {
    const newMenuItems = [...defaultMenuItems];

    const { index, total, onMoveToTop, onMoveToBottom } = menuActions;
    if (typeof index !== 'undefined' && total && total > 1) {
      if (index > 0 && onMoveToTop) {
        newMenuItems.push(
          <Menu.Item key="moveToTop" onClick={() => onMoveToTop()}>
            Move to top
          </Menu.Item>
        );
      }

      if (index + 1 < total && onMoveToBottom) {
        newMenuItems.push(
          <Menu.Item key="moveToBottom" onClick={() => onMoveToBottom()}>
            Move to bottom
          </Menu.Item>
        );
      }
    }

    const { isDataVisible, onShowData, onHideData } = menuActions;
    newMenuItems.push(<Menu.Divider key="divider" />);
    newMenuItems.push(
      <Menu.Item key="toggleData" onClick={() => (isDataVisible ? onHideData() : onShowData())}>
        {isDataVisible ? 'Hide' : 'Show'} Data
      </Menu.Item>
    );

    setMenuItems([...newMenuItems]);
  };

  useEffect(addMenuItems, [menuActions, defaultMenuItems]);

  return { menuItems };
};

export default useResourceMenuItems;
