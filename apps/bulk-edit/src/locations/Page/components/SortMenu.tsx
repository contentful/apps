import React, { useMemo, useState } from 'react';
import { Box, Menu, Button } from '@contentful/f36-components';

import { styles } from '../styles';
import { CaretDownIcon, CaretUpIcon, SortDescendingIcon } from '@phosphor-icons/react';

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
  const [isOpen, setIsOpen] = useState(false);

  const sortOptionLabel = useMemo(() => {
    const label = SORT_OPTIONS.find((option) => option.value === sortOption)?.label!;
    return label.charAt(0).toLowerCase() + label.slice(1);
  }, [sortOption]);

  return (
    <Box marginBottom="spacingM" marginTop="spacingM" style={styles.sortMenu}>
      <Menu isFullWidth onOpen={() => setIsOpen(true)} onClose={() => setIsOpen(false)}>
        <Menu.Trigger>
          <Button
            variant="secondary"
            size="small"
            startIcon={<SortDescendingIcon size={16} />}
            endIcon={isOpen ? <CaretUpIcon size={16} /> : <CaretDownIcon size={16} />}
            aria-label="Sort display name by">
            Sort by {sortOptionLabel}
          </Button>
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
