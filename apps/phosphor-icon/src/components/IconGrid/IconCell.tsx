import { memo } from 'react';
import { css, cx } from 'emotion';
import * as PhosphorIcons from '@phosphor-icons/react';
import type { IconCatalogEntry, IconWeight } from '../../types/icon';

const styles = {
  cell: css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    borderRadius: '8px',
    border: '1px solid #d3dce6',
    backgroundColor: '#ffffff',
    color: '#1f2a37',
    transition: 'background-color 120ms ease, border-color 120ms ease, box-shadow 120ms ease',
    '&:hover': {
      backgroundColor: '#f7f9fa',
      borderColor: '#98a2b3',
    },
    '&:focus-visible': {
      outline: 'none',
      borderColor: '#2f66d0',
      boxShadow: '0 0 0 2px rgba(47, 102, 208, 0.2)',
    },
  }),
  selected: css({
    backgroundColor: '#ebf3ff',
    borderColor: '#2f66d0',
    color: '#0b1f44',
    '&:hover': {
      backgroundColor: '#e3efff',
      borderColor: '#2457b8',
    },
  }),
};

interface IconCellProps {
  icon: IconCatalogEntry;
  weight: IconWeight;
  isSelected: boolean;
  onClick: () => void;
  style?: React.CSSProperties;
}

export const IconCell = memo(function IconCell({
  icon,
  weight,
  isSelected,
  onClick,
  style,
}: IconCellProps) {
  const IconComponent = (
    PhosphorIcons as Record<string, React.ComponentType<{ size?: number; weight?: string }>>
  )[icon.componentName];

  return (
    <div style={style}>
      <button
        type="button"
        className={cx(styles.cell, isSelected && styles.selected)}
        onClick={onClick}
        aria-label={`Select ${icon.name} icon`}
        aria-pressed={isSelected}
        title={icon.name}
        style={{
          width: '100%',
          height: '100%',
          boxSizing: 'border-box',
        }}>
        {IconComponent && <IconComponent size={32} weight={weight} />}
      </button>
    </div>
  );
});
