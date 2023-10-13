import { Flex, FormControl, IconButton, TextInput } from '@contentful/f36-components';
import { DeleteIcon } from '@contentful/f36-icons';
import tokens from '@contentful/f36-tokens';
import { css } from 'emotion';
import { Color } from '../types';

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
}

export default function SwatchEditor({ swatch, onChange, onRemove }: SwatchEditorProps) {
  return (
    <div>
      <FormControl marginBottom="spacingM">
        <Flex gap={tokens.spacingXs} alignItems="center">
          <FormControl.Label htmlFor="SwatchEditor" className={styles.displayNone}>
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
