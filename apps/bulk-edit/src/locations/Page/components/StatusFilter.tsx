import { Button, Flex, IconButton, Menu } from '@contentful/f36-components';
import { useMemo } from 'react';
import { FilterOption } from '../types';
import * as icons from '@contentful/f36-icons';

interface StatusFilterProps {
  id?: string;
  options: FilterOption[];
  selectedItems: FilterOption[];
  setSelectedItems: (items: FilterOption[]) => void;
  disabled?: boolean;
  style?: React.CSSProperties | undefined;
}

const StatusFilter = ({
  id,
  options,
  selectedItems,
  setSelectedItems,
  disabled,
  style,
}: StatusFilterProps) => {
  const selectedValuesSet = useMemo(
    () => new Set(selectedItems.map((item) => item.value)),
    [selectedItems]
  );

  return (
    <Flex flexDirection="column" style={{ ...style }}>
      <Menu>
        <Menu.Trigger>
          <Button
            variant="secondary"
            isDisabled={disabled}
            startIcon={<icons.FunnelSimpleIcon />}
            aria-label="Filter by">
            {selectedItems.length > 0 ? selectedItems[0].label : 'Status'}
          </Button>
        </Menu.Trigger>
        <Menu.List>
          <Menu.Item
            onClick={() => {
              setSelectedItems([]);
            }}>
            All (except archived)
          </Menu.Item>
          {options.map((option) => (
            <Menu.Item
              key={option.value}
              isDisabled={disabled}
              isActive={selectedValuesSet.has(option.value)}
              onClick={() => {
                setSelectedItems([option]);
              }}>
              {option.label}
            </Menu.Item>
          ))}
        </Menu.List>
      </Menu>
    </Flex>
  );
};

export default StatusFilter;
