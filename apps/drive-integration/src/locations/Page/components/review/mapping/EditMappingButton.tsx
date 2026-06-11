import { forwardRef, type FocusEvent } from 'react';
import { Box } from '@contentful/f36-components';
import { PencilSimpleIcon, TrashSimpleIcon } from '@contentful/f36-icons';
import tokens from '@contentful/f36-tokens';
import type { SelectionViewportRectangle } from './selectionViewportRectangle';
import {
  BUTTON_ESTIMATE_WIDTH_PX,
  divider,
  editAction,
  getMenuPosition,
  removeAction,
} from './EditMappingButton.styles';

interface EditMappingButtonProps {
  anchorRectangle: SelectionViewportRectangle;
  onEdit: () => void;
  onRemove?: () => void;
  onBlur?: () => void;
}

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
        className={getMenuPosition(Math.max(anchorRectangle.top - 36, 8), clampedCenterX)}>
        <button type="button" className={editAction} onClick={onEdit}>
          <PencilSimpleIcon size="small" color={tokens.gray700} />
          Edit content mapping
        </button>
        {onRemove ? (
          <>
            <span aria-hidden="true" className={divider} />
            <button type="button" className={removeAction} onClick={onRemove}>
              <TrashSimpleIcon size="small" color={tokens.red600} />
              Remove
            </button>
          </>
        ) : null}
      </Box>
    );
  }
);

EditMappingButton.displayName = 'EditMappingButton';
