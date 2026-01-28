import tokens from '@contentful/f36-tokens';
import { CELL_WIDTH } from '../utils/constants';
import { Virtualizer } from '@tanstack/react-virtual';

export const tableStyles = {
  entryTableContainer: {
    flex: 1,
    flexDirection: 'column',
    minWidth: 0,
    overflow: 'hidden',
    position: 'relative',
    background: tokens.gray100,
  },
  tableContainer: {
    // marginTop: tokens.spacingM,
    // maxHeight: '600px',
    width: '100%',
    overflow: 'auto',
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  tableContainerContent: {
    position: 'relative',
    flex: 1,
  },
  table: {
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
  paginationContainer: {
    background: tokens.colorWhite,
    paddingBottom: tokens.spacingS,
    paddingTop: tokens.spacingS,
  },
} as const;
