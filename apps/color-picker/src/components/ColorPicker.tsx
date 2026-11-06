import { Button, Flex, FormControl, Popover, TextInput } from '@contentful/f36-components';
import { cloneElement, useEffect, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import { RgbaColorPicker } from 'react-colorful';
import type { RgbaColor } from 'react-colorful';

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  children: ReactElement;
  defaultOpen?: boolean;
  onClose?: () => void;
}

function parseHex(value: string): RgbaColor | undefined {
  const match = /^#([\da-f]{6}|[\da-f]{8})$/i.exec(value);
  if (!match) return undefined;
  const hex = match[1];
  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16),
    a: hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1,
  };
}


function serializeColor(color: RgbaColor): string {
  const channel = (value: number) => Math.round(value).toString(16).padStart(2, '0');
  const alpha = Math.round(color.a * 255);
  return `#${channel(color.r)}${channel(color.g)}${channel(color.b)}${channel(alpha)}`;
}

export default function ColorPicker({ value, onChange, children, defaultOpen = false, onClose }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const parsed = parseHex(value);
  const [color, setColor] = useState<RgbaColor>(parsed ?? { r: 0, g: 0, b: 0, a: 1 });
  const ownOutput = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (ownOutput.current === value) {
      ownOutput.current = undefined;
      return;
    }
    if (parsed) setColor(parsed);
  }, [value]);
  const update = (next: RgbaColor) => {
    setColor(next);
    const output = serializeColor(next);
    ownOutput.current = output;
    onChange(output);
  };

  const updateChannel = (key: 'r' | 'g' | 'b' | 'a', raw: string) => {
    if (raw.trim() === '') return;
    const numeric = Number(raw);
    if (!Number.isFinite(numeric)) return;
    if (key === 'a') {
      if (numeric < 0 || numeric > 100) return;
      update({ ...color, a: numeric / 100 });
    } else {
      if (!Number.isInteger(numeric) || numeric < 0 || numeric > 255) return;
      update({ ...color, [key]: numeric });
    }
  };

  const inputs: Array<{ key: 'r' | 'g' | 'b' | 'a'; label: string; value: number; max: number; step: number }> = [
    { key: 'r', label: 'Red', value: Math.round(color.r), max: 255, step: 1 },
    { key: 'g', label: 'Green', value: Math.round(color.g), max: 255, step: 1 },
    { key: 'b', label: 'Blue', value: Math.round(color.b), max: 255, step: 1 },
    { key: 'a', label: 'Opacity (%)', value: Math.round(color.a * 100), max: 100, step: 1 },
  ];
  const close = () => {
    setIsOpen(false);
    onClose?.();
  };
  return (
    <Popover
      isOpen={isOpen}
      placement="bottom-start"
      isAutoalignmentEnabled={false}
      onClose={close}>
      <Popover.Trigger>{cloneElement(children, { onClick: () => setIsOpen(true) })}</Popover.Trigger>
      <Popover.Content>
        <Flex padding="spacingM" flexDirection="column" gap="spacingS">
          <RgbaColorPicker color={color} onChange={update} />
          <Flex gap="spacing2Xs">
            {inputs.map(({ key, label, value: inputValue, max, step }) => (
              <FormControl key={key}>
                <FormControl.Label htmlFor={`alpha-color-${key}`}>{label}</FormControl.Label>
                <TextInput
                  id={`alpha-color-${key}`}
                  type="number"
                  min={0}
                  max={max}
                  step={step}
                  value={String(inputValue)}
                  onChange={(event) => updateChannel(key, event.target.value)}
                />
              </FormControl>
            ))}
          </Flex>
          <Button size="small" onClick={close}>
            Close color picker
          </Button>
        </Flex>
      </Popover.Content>
    </Popover>
  );
}
