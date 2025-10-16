import tokens from '@contentful/f36-tokens';
import { CELL_WIDTH } from '../utils/constants';
import { Virtualizer } from '@tanstack/react-virtual';

export const tableStyles = {
  tableContainer: {
    maxHeight: '600px',
    width: '100%',
    overflow: 'auto',
  },
  table: {
    marginTop: tokens.spacingM,
    minWidth: `${CELL_WIDTH * 4}px`,
    overflowX: 'auto',
    outline: 'none', // Remove default focus outline
  },
  topSpacer: (rowVirtualizer: Virtualizer<HTMLDivElement, Element>) => {
    return {
      height: `${rowVirtualizer.getVirtualItems()[0]?.start ?? 0}px`,
      padding: 0,
      border: 'none',
    };
  },
  bottomSpacer: (rowVirtualizer: Virtualizer<HTMLDivElement, Element>) => {
    return {
      height: `${
        rowVirtualizer.getTotalSize() -
        (rowVirtualizer.getVirtualItems()[rowVirtualizer.getVirtualItems().length - 1]?.end ?? 0)
      }px`,
      padding: 0,
      border: 'none',
    };
  },
} as const;
