import { forwardRef } from 'react';
import { Box, Button } from '@contentful/f36-components';
import { PencilSimpleIcon } from '@contentful/f36-icons';
import tokens from '@contentful/f36-tokens';
import type { SelectionViewportRectangle } from './selectionViewportRectangle';

interface EditMappingButtonProps {
  anchorRectangle: SelectionViewportRectangle;
  onEdit: () => void;
}

const BUTTON_ESTIMATE_WIDTH_PX = 160;

export const EditMappingButton = forwardRef<HTMLDivElement, EditMappingButtonProps>(
  ({ anchorRectangle, onEdit }, ref) => {
    const centerX = (anchorRectangle.left + anchorRectangle.right) / 2;
    const half = BUTTON_ESTIMATE_WIDTH_PX / 2;
    const clampedCenterX = Math.min(Math.max(centerX, 8 + half), window.innerWidth - 8 - half);

    return (
      <Box
        ref={ref}
        aria-label="Edit content mapping"
        data-testid="review-selection-menu"
        style={{
          position: 'fixed',
          top: Math.max(anchorRectangle.top - 36, 8),
          left: clampedCenterX,
          transform: 'translateX(-50%)',
          zIndex: 3,
          display: 'inline-flex',
          borderRadius: tokens.borderRadiusMedium,
          border: `1px solid ${tokens.gray300}`,
          backgroundColor: tokens.colorWhite,
          width: 'fit-content',
        }}>
        <Button
          variant="transparent"
          size="small"
          onClick={onEdit}
          startIcon={<PencilSimpleIcon size="tiny" />}
          style={{ paddingTop: '2px', paddingBottom: '2px' }}>
          Edit content mapping
        </Button>
      </Box>
    );
  }
);

EditMappingButton.displayName = 'EditMappingButton';
