import * as React from 'react';
import { IconButton, Menu } from '@contentful/f36-components';
import { MoreHorizontalIcon } from '@contentful/f36-icons';

export interface ProductCardMenuProps {
  onRemove: () => void;
}

const ProductCardMenu = (props: ProductCardMenuProps) => {
  return (
    <Menu offset={[-5, 0]}>
      <Menu.Trigger>
        <IconButton size="small" icon={<MoreHorizontalIcon />} aria-label="Actions" />
      </Menu.Trigger>
      <Menu.List>
        <Menu.Item key="delete" onClick={() => props.onRemove()}>
          Remove
        </Menu.Item>
      </Menu.List>
    </Menu>
  );
};

export default ProductCardMenu;
