import { forwardRef } from 'react';
import { Box, Button, Flex } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import Splitter from '../mainpage/Splitter';

export interface SelectionActionMenuAnchorRect {
  top: number;
  left: number;
  bottom: number;
  right: number;
}

interface SelectionActionMenuProps {
  anchorRect: SelectionActionMenuAnchorRect;
  onAssign: () => void;
  onExclude: () => void;
}

const MENU_ESTIMATE_WIDTH_PX = 180;

export const SelectionActionMenu = forwardRef<HTMLDivElement, SelectionActionMenuProps>(
  ({ anchorRect, onAssign, onExclude }, ref) => {
    const centerX = (anchorRect.left + anchorRect.right) / 2;
    const half = MENU_ESTIMATE_WIDTH_PX / 2;
    const clampedCenterX = Math.min(Math.max(centerX, 8 + half), window.innerWidth - 8 - half);

    return (
      <Box
        ref={ref}
        data-testid="review-selection-menu"
        style={{
          position: 'fixed',
          top: Math.max(anchorRect.top - 36, 8),
          left: clampedCenterX,
          transform: 'translateX(-50%)',
          zIndex: 3,
          display: 'inline-flex',
          gap: 0,
          borderRadius: '8px',
          border: `1px solid ${tokens.gray300}`,
          backgroundColor: tokens.colorWhite,
          boxShadow: '0 2px 6px rgba(20, 37, 61, 0.12)',
          width: 'fit-content',
        }}>
        <Flex alignItems="center" gap="none">
          <Button
            variant="transparent"
            size="small"
            onClick={onAssign}
            style={{ borderBottomRightRadius: 0, borderTopRightRadius: 0 }}>
            Assign
          </Button>
          <Splitter />
          <Button
            variant="transparent"
            size="small"
            onClick={onExclude}
            style={{ borderBottomLeftRadius: 0, borderTopLeftRadius: 0 }}>
            Exclude
          </Button>
        </Flex>
      </Box>
    );
  }
);

SelectionActionMenu.displayName = 'SelectionActionMenu';
