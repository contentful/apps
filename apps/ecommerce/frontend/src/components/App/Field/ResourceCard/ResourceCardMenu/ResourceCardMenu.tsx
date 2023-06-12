import { IconButton, Menu } from '@contentful/f36-components';
import { MoreHorizontalIcon } from '@contentful/f36-icons';
import useResourceMenu from 'hooks/field/useResourceMenuItems';

export interface ResourceCardMenuProps {
  onRemove: Function;
  isDataVisible: boolean;
  onShowData: Function;
  onHideData: Function;
  index?: number;
  total?: number;
  onMoveToTop?: Function;
  onMoveToBottom?: Function;
}

const ResourceCardMenu = (props: ResourceCardMenuProps) => {
  const { menuItems } = useResourceMenu(props);

  return (
    <Menu offset={[-5, 0]}>
      <Menu.Trigger>
        <IconButton icon={<MoreHorizontalIcon />} aria-label="Actions" />
      </Menu.Trigger>
      <Menu.List>{menuItems}</Menu.List>
    </Menu>
  );
};

export default ResourceCardMenu;
