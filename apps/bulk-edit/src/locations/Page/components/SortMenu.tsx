import React from 'react';
import { Box, Menu, IconButton } from '@contentful/f36-components';
import { SortAscending } from '@phosphor-icons/react/dist/ssr/SortAscending';
import { styles } from '../styles';

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
            icon={<SortAscending size={16} />}
            variant="secondary"
            aria-label="Sort display name by">
            Sort display name by
          </IconButton>
        </Menu.Trigger>
        <Menu.List>
          {SORT_OPTIONS.map((opt) => (
            <Menu.Item
              key={opt.value}
              isActive={sortOption === opt.value}
              onClick={() => onSortChange(opt.value)}>
              {opt.label}
            </Menu.Item>
          ))}
        </Menu.List>
      </Menu>
    </Box>
  );
};
