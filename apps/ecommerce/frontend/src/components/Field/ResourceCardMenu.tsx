import { useEffect, useState } from 'react';
import { IconButton, Menu } from '@contentful/f36-components';
import { MoreHorizontalIcon } from '@contentful/f36-icons';

interface Props {
  onRemove: Function;
  isDataVisible: boolean;
  onShowData: Function;
  onHideData: Function;
  index?: number;
  total?: number;
  onMoveToTop?: Function;
  onMoveToBottom?: Function;
}

const ResourceCardMenu = (props: Props) => {
  const {
    onRemove,
    isDataVisible,
    onShowData,
    onHideData,
    index,
    total,
    onMoveToTop,
    onMoveToBottom,
  } = props;

  const [menuItems, setMenuItems] = useState([
    <Menu.Item key="copy" onClick={() => onRemove()}>
      Remove
    </Menu.Item>,
  ]);

  useEffect(() => {
    if (typeof index !== 'undefined' && total && total > 1) {
      if (index > 0 && onMoveToTop) {
        menuItems.push(
          <Menu.Item key="moveToTop" onClick={() => onMoveToTop}>
            Move to top
          </Menu.Item>
        );
      }

      if (total !== index + 1 && onMoveToBottom) {
        menuItems.push(
          <Menu.Item key="moveToBottom" onClick={() => onMoveToBottom}>
            Move to bottom
          </Menu.Item>
        );
      }
    }

    menuItems.push(<Menu.Divider key="divider" />);
    menuItems.push(
      <Menu.Item key="toggleData" onClick={() => (isDataVisible ? onHideData() : onShowData())}>
        {isDataVisible ? 'Hide' : 'Show'} Data
      </Menu.Item>
    );

    setMenuItems([...menuItems]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Menu offset={[-5, 0]}>
      <Menu.Trigger>
        <IconButton icon={<MoreHorizontalIcon />} aria-label="Actions" />
      </Menu.Trigger>
      <Menu.List>{menuItems.map((item) => item)}</Menu.List>
    </Menu>
  );
};

export default ResourceCardMenu;
