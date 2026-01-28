import React, { useState } from 'react';
import { Box, Menu, Button } from '@contentful/f36-components';

import { styles } from '../styles';
import { CaretDownIcon, CaretUpIcon, SortDescendingIcon } from '@contentful/f36-icons';

export const SORT_OPTIONS = [
  { value: 'displayName_asc', label: 'Display name: A-Z' },
  { value: 'displayName_desc', label: 'Display name: Z-A' },
  { value: 'updatedAt_desc', label: 'Updated: newest' },
  { value: 'updatedAt_asc', label: 'Updated: oldest' },
];

interface SortMenuProps {
  sortOption: string;
  onSortChange: (value: string) => void;
  disabled?: boolean;
}

export const SortMenu: React.FC<SortMenuProps> = ({ sortOption, onSortChange, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Box style={styles.sortMenu}>
      <Menu onOpen={() => setIsOpen(true)} onClose={() => setIsOpen(false)}>
        <Menu.Trigger>
          <Button
            variant="secondary"
            startIcon={<SortDescendingIcon />}
            endIcon={isOpen ? <CaretUpIcon /> : <CaretDownIcon />}
            aria-label="Sort by"
            isDisabled={disabled}>
            Sort by
          </Button>
        </Menu.Trigger>
        <Menu.List style={styles.sortMenuList}>
          {SORT_OPTIONS.map((option) => (
            <Menu.Item
              isDisabled={disabled}
              key={option.value}
              isActive={sortOption === option.value}
              onClick={() => onSortChange(option.value)}>
              {option.label}
            </Menu.Item>
          ))}
        </Menu.List>
      </Menu>
    </Box>
  );
};
