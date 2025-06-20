import React from 'react';
import { Button } from '@contentful/f36-components';

interface DeleteUndoButtonProps {
  isPendingDelete: boolean;
  onDelete: () => void;
  onUndo: () => void;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const DeleteUndoButton: React.FC<DeleteUndoButtonProps> = ({
  isPendingDelete,
  onDelete,
  onUndo,
  disabled = false,
  size = 'small',
}) => {
  return isPendingDelete ? (
    <Button
      variant="secondary"
      size={size}
      onClick={onUndo}
      disabled={disabled}
      style={{ minWidth: 64 }}>
      Undo
    </Button>
  ) : (
    <Button
      variant="negative"
      size={size}
      onClick={onDelete}
      disabled={disabled}
      style={{ minWidth: 64 }}>
      Delete
    </Button>
  );
};

export default DeleteUndoButton;
