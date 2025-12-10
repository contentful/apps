import React from 'react';

export interface OverlayProps {
  style?: React.CSSProperties;
  className?: string;
}

/**
 * Enum representing different modal types in the application.
 * Used to identify which modal is topmost for overlay management.
 */
export enum ModalType {
  UPLOAD = 'upload',
  CONTENT_TYPE_PICKER = 'contentTypePicker',
  CONFIRM_CANCEL = 'confirmCancel',
}

const modifiedOverlayStyles = {
  transition: 'none',
};

/**
 * Determines overlay props for a modal based on whether it's the topmost modal.
 * If parent overlayProps indicate the overlay should be hidden, respects that.
 * Otherwise, hides overlay if this modal is not topmost.
 *
 * @param isTopmost - Whether this modal is the topmost modal in its context
 * @param parentOverlayProps - Overlay props from parent component (if any)
 * @returns Overlay props to pass to Modal component, or undefined to use default
 */
export const getOverlayProps = (
  isTopmost: boolean,
  parentOverlayProps?: OverlayProps
): OverlayProps | undefined => {
  // If parent says to hide overlay, respect that
  if (parentOverlayProps?.style?.background === 'none') {
    return parentOverlayProps;
  }

  // If not topmost, hide overlay background
  if (!isTopmost) {
    return { style: { ...modifiedOverlayStyles, background: 'none' } };
  }

  // Topmost modal - use default overlay with modified styles
  return { style: modifiedOverlayStyles };
};
