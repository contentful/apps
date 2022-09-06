import React from 'react';
import {
  FormControl,
  TextInput,
  IconButton,
  Flex,
} from '@contentful/f36-components';
import { DeleteIcon } from '@contentful/f36-icons';
import tokens from '@contentful/f36-tokens';

interface SwatchEditorProps {
  swatch: Color;
  onChange: (swatch: Color) => void;
  onRemove: (swatch: Color) => void;
}

export default function SwatchEditor({
  swatch,
  onChange,
  onRemove,
}: SwatchEditorProps) {
  return (
    <div>
      <FormControl marginBottom="spacingM">
        <Flex gap={tokens.spacingXs} alignItems="center">
          <FormControl.Label htmlFor="SwatchEditor" style={{ display: 'none' }}>
            Color
          </FormControl.Label>
          <input
            value={swatch.value}
            onChange={(e) => onChange({ ...swatch, value: e.target.value })}
            id="SwatchEditorColor"
            type="color"
          />
          <TextInput
            name="SwatchEditorName"
            placeholder="Color name"
            size="small"
            value={swatch.name}
            onChange={(e) => onChange({ ...swatch, name: e.target.value })}
            isRequired
            style={{ width: 150 }}
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
