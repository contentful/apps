import { forwardRef, type FocusEvent } from 'react';
import { Box, Button } from '@contentful/f36-components';
import { PencilSimpleIcon, TrashSimpleIcon } from '@contentful/f36-icons';
import type { SelectionViewportRectangle } from './selectionViewportRectangle';
import tokens from '@contentful/f36-tokens';

interface EditMappingButtonProps {
  anchorRectangle: SelectionViewportRectangle;
  onEdit: () => void;
  onRemove?: () => void;
  onBlur?: () => void;
}

export const BUTTON_ESTIMATE_WIDTH_PX = 280;

export const EditMappingButton = forwardRef<HTMLDivElement, EditMappingButtonProps>(
  ({ anchorRectangle, onEdit, onRemove, onBlur }, ref) => {
    const centerX = (anchorRectangle.left + anchorRectangle.right) / 2;
    const half = BUTTON_ESTIMATE_WIDTH_PX / 2;
    const clampedCenterX = Math.min(Math.max(centerX, 8 + half), window.innerWidth - 8 - half);

    const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
      if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
        return;
      }
      onBlur?.();
    };

    return (
      <Box
        ref={ref}
        data-testid="review-selection-menu"
        onBlur={handleBlur}
        style={{
          position: 'fixed',
          top: Math.max(anchorRectangle.top - 36, 8),
          left: clampedCenterX,
          transform: 'translateX(-50%)',
          zIndex: 3,
          display: 'inline-flex',
          gap: 0,
          borderRadius: tokens.borderRadiusMedium,
          backgroundColor: tokens.colorWhite,
          width: 'fit-content',
          padding: 0,
        }}>
        <Button
          variant="secondary"
          size="small"
          startIcon={<PencilSimpleIcon />}
          onClick={onEdit}
          style={{
            borderRight: `1px solid ${tokens.gray400}`,
            borderBottomRightRadius: 0,
            borderTopRightRadius: 0,
          }}>
          Edit content mapping
        </Button>
        {onRemove ? (
          <>
            <Button
              variant="negative"
              size="small"
              startIcon={<TrashSimpleIcon />}
              onClick={onRemove}
              style={{ borderBottomLeftRadius: 0, borderTopLeftRadius: 0, borderLeft: 0 }}>
              Remove
            </Button>
          </>
        ) : null}
      </Box>
    );
  }
);

EditMappingButton.displayName = 'EditMappingButton';
