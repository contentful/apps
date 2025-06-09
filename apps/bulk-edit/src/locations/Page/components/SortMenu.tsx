import React from 'react';
import { Box, Menu, IconButton } from '@contentful/f36-components';

import { styles } from '../styles';
import { SortDescendingIcon } from '@phosphor-icons/react';

export const SORT_OPTIONS = [
  { value: 'displayName_asc', label: 'Display name: A-Z' },
  { value: 'displayName_desc', label: 'Display name: Z-A' },
  { value: 'updatedAt_desc', label: 'Updated: newest' },
  { value: 'updatedAt_asc', label: 'Updated: oldest' },
];

interface SortMenuProps {
  sortOption: string;
  onSortChange: (value: string) => void;
}

export const SortMenu: React.FC<SortMenuProps> = ({ sortOption, onSortChange }) => {
  return (
    <Box marginBottom="spacingM" marginTop="spacingM" style={styles.sortMenu}>
      <Menu>
        <Menu.Trigger>
          <IconButton
            icon={<SortDescendingIcon size={16} />}
            variant="secondary"
            aria-label="Sort display name by">
            Sort display name by
          </IconButton>
        </Menu.Trigger>
        <Menu.List>
          {SORT_OPTIONS.map((option) => (
            <Menu.Item
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
