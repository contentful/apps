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
    borderRadius: '6px',
    border: '2px solid transparent',
    backgroundColor: '#ffffff',
    transition: 'all 0.15s ease',
    '&:hover': {
      backgroundColor: '#f3f4f6',
      borderColor: '#d1d5db',
    },
    '&:focus': {
      outline: 'none',
      borderColor: '#3b82f6',
      boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.3)',
    },
  }),
  selected: css({
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
    '&:hover': {
      backgroundColor: '#dbeafe',
      borderColor: '#2563eb',
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
        }}>
        {IconComponent && <IconComponent size={32} weight={weight} />}
      </button>
    </div>
  );
});
