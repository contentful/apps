import { forwardRef } from 'react';
import { Box, Button, Flex } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import Splitter from '../../mainpage/Splitter';
import type { SelectionViewportRectangle } from './selectionViewportRectangle';

interface SelectionActionMenuProps {
  anchorRectangle: SelectionViewportRectangle;
  onAssign: () => void;
  onExclude: () => void;
  isMappedContent: boolean;
}

const MENU_ESTIMATE_WIDTH_PX = 180;

export const SelectionActionMenu = forwardRef<HTMLDivElement, SelectionActionMenuProps>(
  ({ anchorRectangle, onAssign, onExclude, isMappedContent }, ref) => {
    const centerX = (anchorRectangle.left + anchorRectangle.right) / 2;
    const half = MENU_ESTIMATE_WIDTH_PX / 2;
    const clampedCenterX = Math.min(Math.max(centerX, 8 + half), window.innerWidth - 8 - half);

    return (
      <Box
        ref={ref}
        aria-label="Text selection actions"
        data-testid="review-selection-menu"
        style={{
          position: 'fixed',
          top: Math.max(anchorRectangle.top - 36, 8),
          left: clampedCenterX,
          transform: 'translateX(-50%)',
          zIndex: 3,
          display: 'inline-flex',
          gap: 0,
          borderRadius: tokens.borderRadiusMedium,
          border: `1px solid ${tokens.gray300}`,
          backgroundColor: tokens.colorWhite,
          width: 'fit-content',
        }}>
        <Flex alignItems="center" gap="none">
          <Button
            variant="transparent"
            size="small"
            onClick={onAssign}
            style={{ borderBottomRightRadius: 0, borderTopRightRadius: 0 }}>
            {isMappedContent ? 'Reassign' : 'Assign'}
          </Button>
          <Splitter />
          <Button
            isDisabled={!isMappedContent}
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
