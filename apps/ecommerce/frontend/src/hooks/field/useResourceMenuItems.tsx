import { Menu } from '@contentful/f36-components';
import { ResourceCardMenuProps } from 'components/Field/ResourceCardMenu';
import { useCallback, useEffect, useMemo, useState } from 'react';

type menuItemsOutput = { menuItems: JSX.Element[] };

const useResourceMenuItems = (menuActions: ResourceCardMenuProps): menuItemsOutput => {
  const {
    onRemove,
    isDataVisible,
    onShowData,
    onHideData,
    index,
    total,
    onMoveToTop,
    onMoveToBottom,
  } = menuActions;

  const defaultMenuItems = useMemo(
    () => [
      <Menu.Item key="delete" onClick={() => onRemove()}>
        Remove
      </Menu.Item>,
    ],
    [onRemove]
  );
  const [menuItems, setMenuItems] = useState([...defaultMenuItems]);

  const addMenuItems = useCallback(() => {
    const newMenuItems = [...defaultMenuItems];

    if (typeof index !== 'undefined' && total && total > 1) {
      if (index > 0 && onMoveToTop) {
        newMenuItems.push(
          <Menu.Item key="moveToTop" onClick={() => onMoveToTop()}>
            Move to top
          </Menu.Item>
        );
      }

      if (index + 1 !== total && onMoveToBottom) {
        newMenuItems.push(
          <Menu.Item key="moveToBottom" onClick={() => onMoveToBottom()}>
            Move to bottom
          </Menu.Item>
        );
      }
    }

    newMenuItems.push(<Menu.Divider key="divider" />);
    newMenuItems.push(
      <Menu.Item key="toggleData" onClick={() => (isDataVisible ? onHideData() : onShowData())}>
        {isDataVisible ? 'Hide' : 'Show'} Data
      </Menu.Item>
    );

    setMenuItems([...newMenuItems]);
  }, [
    defaultMenuItems,
    index,
    isDataVisible,
    onMoveToBottom,
    onMoveToTop,
    onHideData,
    onShowData,
    total,
  ]);

  useEffect(() => {
    addMenuItems();
  }, [addMenuItems]);

  return { menuItems };
};

export default useResourceMenuItems;
