import { CSSProperties, memo, useEffect, useRef, useState } from 'react';
import { Grid } from 'react-window';
import { css } from 'emotion';
import { Flex, Note, Spinner } from '@contentful/f36-components';
import { IconCell } from './IconCell';
import type { IconCatalogEntry, IconWeight } from '../../types/icon';

const CELL_SIZE = 80;
const MIN_COLUMNS = 4;
const MIN_VISIBLE_ROWS = 2;
const DEFAULT_MAX_VISIBLE_ROWS = 4;

const styles = {
  container: css({
    position: 'relative',
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: '6px',
    border: '1px solid #d3dce6',
    overflow: 'hidden',
    '&::after': {
      content: '""',
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: '1px',
      backgroundColor: '#d3dce6',
      pointerEvents: 'none',
    },
  }),
  loading: css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    minHeight: `${CELL_SIZE * MIN_VISIBLE_ROWS}px`,
  }),
  empty: css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    minHeight: `${CELL_SIZE * MIN_VISIBLE_ROWS}px`,
    padding: '20px',
  }),
  gridWrapper: css({
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  }),
};

interface IconGridProps {
  icons: IconCatalogEntry[];
  weight: IconWeight;
  selectedIconNames: string[];
  onSelect: (icon: IconCatalogEntry) => void;
  isLoading?: boolean;
  maxVisibleRows?: number;
}

interface CellProps {
  icons: IconCatalogEntry[];
  weight: IconWeight;
  selectedIconNames: string[];
  onSelect: (icon: IconCatalogEntry) => void;
  columnCount: number;
}

const CellComponent = memo(function CellComponent({
  columnIndex,
  rowIndex,
  style,
  icons,
  weight,
  selectedIconNames,
  onSelect,
  columnCount,
}: {
  columnIndex: number;
  rowIndex: number;
  style: CSSProperties;
  ariaAttributes: object;
} & CellProps) {
  const index = rowIndex * columnCount + columnIndex;

  if (index >= icons.length) {
    return <div style={style} />;
  }

  const icon = icons[index];
  const isSelected = selectedIconNames.includes(icon.name);

  return (
    <IconCell
      icon={icon}
      weight={weight}
      isSelected={isSelected}
      onClick={() => onSelect(icon)}
      style={style}
    />
  );
});

export function IconGrid({
  icons,
  weight,
  selectedIconNames,
  onSelect,
  isLoading = false,
  maxVisibleRows = DEFAULT_MAX_VISIBLE_ROWS,
}: IconGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(600);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      if (entries[0]) {
        setContainerWidth(entries[0].contentRect.width);
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  if (isLoading) {
    return (
      <div className={styles.container}>
        <Flex className={styles.loading} alignItems="center" justifyContent="center">
          <Spinner size="large" />
        </Flex>
      </div>
    );
  }

  if (icons.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>
          <Note variant="neutral">No icons found. Try a different search term.</Note>
        </div>
      </div>
    );
  }

  const columnCount = Math.max(MIN_COLUMNS, Math.floor(containerWidth / CELL_SIZE));
  const rowCount = Math.ceil(icons.length / columnCount);
  const visibleRows = Math.min(Math.max(rowCount, MIN_VISIBLE_ROWS), maxVisibleRows);
  const gridHeight = visibleRows * CELL_SIZE;

  return (
    <div className={styles.container} ref={containerRef} style={{ height: `${gridHeight}px` }}>
      <div className={styles.gridWrapper}>
        <Grid
          cellComponent={CellComponent}
          cellProps={{
            icons,
            weight,
            selectedIconNames,
            onSelect,
            columnCount,
          }}
          columnCount={columnCount}
          columnWidth={CELL_SIZE}
          rowCount={rowCount}
          rowHeight={CELL_SIZE}
          style={{
            width: '100%',
            height: `${gridHeight}px`,
            overflowX: 'hidden',
            overflowY: rowCount > visibleRows ? 'auto' : 'hidden',
          }}
        />
      </div>
    </div>
  );
}
