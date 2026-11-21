import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button, DragHandle, Flex, FormControl, IconButton, TextInput } from '@contentful/f36-components';
import { DeleteIcon } from '@contentful/f36-icons';
import tokens from '@contentful/f36-tokens';
import { css } from 'emotion';
import ColorPicker from './ColorPicker';
import type { Color } from '../types';

const styles = {
  displayNone: css({
    display: 'none',
  }),
  nameInput: css({
    width: '150px',
  }),
};

interface SwatchEditorProps {
  swatch: Color;
  onChange: (swatch: Color) => void;
  onRemove: (swatch: Color) => void;
  enableOpacity: boolean;
}

export default function SwatchEditor({
  swatch,
  onChange,
  onRemove,
  enableOpacity,
}: SwatchEditorProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: swatch.id });

  const rowStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={rowStyle}>
      <FormControl marginBottom="spacingM">
        <Flex gap={tokens.spacingXs} alignItems="center">
          <DragHandle
            as="button"
            type="button"
            ref={setActivatorNodeRef}
            {...listeners}
            {...attributes}
            label="Reorder color in list"
            variant="transparent"
            isActive={isDragging}
          />
          <FormControl.Label
            htmlFor={`SwatchEditorColor-${swatch.id}`}
            className={styles.displayNone}>
            Color
          </FormControl.Label>
          {enableOpacity ? (
            <ColorPicker
              value={swatch.value}
              onChange={(value) => onChange({ ...swatch, value })}>
              <Button
                id={`SwatchEditorColor-${swatch.id}`}
                aria-label={`Edit ${swatch.name || 'swatch'} color`}
                size="small"
                variant="secondary">
                {swatch.value.toUpperCase()}
              </Button>
            </ColorPicker>
          ) : (
            <input
              value={swatch.value}
              onChange={(e) => onChange({ ...swatch, value: e.target.value })}
              id={`SwatchEditorColor-${swatch.id}`}
              type="color"
            />
          )}
          <TextInput
            name={`SwatchEditorName-${swatch.id}`}
            placeholder="Color name"
            size="small"
            value={swatch.name}
            onChange={(e) => onChange({ ...swatch, name: e.target.value })}
            isRequired
            className={styles.nameInput}
          />
          <IconButton
            variant="transparent"
            size="small"
            aria-label="Remove color"
            onClick={() => onRemove(swatch)}
            icon={<DeleteIcon variant="muted" />}
          />
        </Flex>
      </FormControl>
    </div>
  );
}
