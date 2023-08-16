import * as React from 'react';
import { IconButton, Menu } from '@contentful/f36-components';
import { MoreHorizontalIcon } from '@contentful/f36-icons';
import useResourceMenuItems from '../hooks/field/useResourceMenuItems';

export interface ProductCardMenuProps {
  isDataVisible: boolean;
  cardIndex?: number;
  totalCards?: number;
  onRemove: () => void;
  onShowData: () => void;
  onHideData: () => void;
  onMoveToTop?: (cardIndex?: number) => void;
  onMoveToBottom?: (cardIndex?: number) => void;
}

const ProductCardMenu = (props: ProductCardMenuProps) => {
  const { menuItems } = useResourceMenuItems(props);

  return (
    <Menu offset={[-5, 0]}>
      <Menu.Trigger>
        <IconButton size="small" icon={<MoreHorizontalIcon />} aria-label="Actions" />
      </Menu.Trigger>
      <Menu.List>{menuItems}</Menu.List>
    </Menu>
  );
};

export default ProductCardMenu;
