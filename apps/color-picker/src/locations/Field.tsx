import type { FieldAppSDK } from '@contentful/app-sdk';
import { Flex, Form, Menu } from '@contentful/f36-components';
import { useFieldValue, useSDK } from '@contentful/react-apps-toolkit';
import { css } from 'emotion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ColorBox } from '../components/ColorBox';
import { SelectColorButton } from '../components/SelectColorButton';
import type { Color, Theme } from '../types';
import ColorPicker from '../components/ColorPicker.js';
import { formatHexColor } from '../utils/color.js';
import tokens from '@contentful/f36-tokens';

const styles = {
  displayNone: css({
    display: 'none',
  }),
  menuList: css({
    width: 'calc(100% - 2px)', // -2px to keep borders visible
    left: 0,
  }),
  hexValue: css({
    color: tokens.gray500,
    fontVariantNumeric: 'tabular-nums',
    width: '70px',
    display: 'inline-block',
    textAlign: 'left',
  }),
};

// Dropdown + margin top + box shadow
const HEIGHT_DEFAULT = 41;
const HEIGHT_BASE = 52 + 4 + 14;
const HEIGHT_ITEM = 36;

type FieldValue = Color | string | undefined;

const Field = () => {
  const sdk = useSDK<FieldAppSDK>();
  const enableOpacity = sdk.parameters.installation.enableOpacity === true;
  const locale = sdk.field.locale;
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useFieldValue<FieldValue>(sdk.field.id, locale);
  const customColorPicker = useRef<HTMLInputElement>(null);

  const storeHexValue = sdk.field.type === 'Symbol';
  const outputColor = (color: string): string =>
    enableOpacity ? formatHexColor(color, true) : color;

  const writeValue = (nextValue: FieldValue): void => {
    void setValue(nextValue).catch(() => sdk.notifier.error('Unable to save the color.'));
  };

  const writeCustomColor = (color: string): void => {
    writeValue(
      storeHexValue
        ? outputColor(color)
        : { id: window.crypto.randomUUID(), name: 'Custom', value: outputColor(color) }
    );
  };

  const openCustomPicker = (): void => {
    if (enableOpacity) {
      setIsOpen(false);
      setIsPickerOpen(true);
    } else {
      customColorPicker.current?.click();
    }
  };

  const allowCustomValue = useMemo(() => {
    const { validations } = sdk.field;

    const instanceParam = sdk.parameters.instance.withCustomValue;
    const hasValidation = validations.find((validation) => validation.in)?.in;

    return instanceParam && !hasValidation;
  }, [sdk.field, sdk.parameters.instance]);

  // @ts-ignore
  const theme: Theme = sdk.parameters.installation.themes[0];

  const validatedColors = useMemo(() => {
    const { validations } = sdk.field;

    const acceptedValues = validations.find((validation) => validation.in)?.in;

    if (acceptedValues?.at(0) && theme.colors?.at(0)) {
      return theme.colors.filter((color) => acceptedValues?.includes(outputColor(color.value)));
    }

    return theme.colors;
  }, [sdk.field, theme.colors, enableOpacity]);

  useEffect(() => {
    if (!isOpen) {
      sdk.window.updateHeight(HEIGHT_DEFAULT);
      return;
    }

    // @ts-ignore
    const customItemHeight = allowCustomValue ? HEIGHT_ITEM : 0;
    const calculatedHeight = HEIGHT_BASE + customItemHeight + validatedColors.length * HEIGHT_ITEM;

    sdk.window.updateHeight(calculatedHeight <= 400 ? calculatedHeight : 400);
  }, [isOpen, sdk, validatedColors, allowCustomValue]);

  const name = useMemo<string>(() => {
    switch (typeof value) {
      case 'string':
        const color = theme.colors.find((c) => outputColor(c.value) === value);
        if (color) {
          return color.name;
        }

        if (allowCustomValue) {
          return 'Custom';
        } else {
          return 'Invalid';
        }

      case 'object':
        return value.name;

      case 'undefined':
        if (sdk.field.required) {
          return 'No color selected';
        } else {
          return 'Select a color…';
        }

      default:
        return 'Invalid';
    }
  }, [allowCustomValue, sdk.field.required, theme.colors, value, enableOpacity]);

  if (enableOpacity && (theme.colors.length === 0 || isPickerOpen)) {
    return (
      <Form>
        <ColorPicker
          defaultOpen={isPickerOpen}
          onClose={() => setIsPickerOpen(false)}
          value={(typeof value === 'string' ? value : value?.value) ?? '#000000ff'}
          onChange={writeCustomColor}>
          <SelectColorButton
            name={name}
            value={value}
            onClearClick={() => writeValue(undefined)}
          />
        </ColorPicker>
      </Form>
    );
  }

  return (
    <Form>
      {theme.colors.length === 0 ? (
        <SelectColorButton
          name={name}
          value={value}
          onClick={openCustomPicker}
          onClearClick={() => writeValue(undefined)}
        />
      ) : (
        <Menu isOpen={isOpen} onOpen={() => setIsOpen(true)} onClose={() => setIsOpen(false)}>
          <Menu.Trigger>
            <SelectColorButton
              showChevron
              name={name}
              value={value}
              onClearClick={() => writeValue(undefined)}
            />
          </Menu.Trigger>
          <Menu.List className={styles.menuList}>
            {validatedColors.map((color: Color) => (
              <Menu.Item
                key={color.id}
                onClick={() => writeValue(storeHexValue ? outputColor(color.value) : { ...color, value: outputColor(color.value) })}>
                <Flex alignItems="center" gap="spacingXs">
                  <ColorBox color={color} />
                  <Flex gap="spacing2Xs">
                    {color.name}
                    <span className={styles.hexValue}>{outputColor(color.value)}</span>
                  </Flex>
                </Flex>
              </Menu.Item>
            ))}
            {allowCustomValue && (
              <Menu.Item onClick={openCustomPicker}>Custom...</Menu.Item>
            )}
          </Menu.List>
        </Menu>
      )}
      <input
        onChange={(e) => writeCustomColor(e.target.value)}
        type="color"
        id="customColor"
        className={styles.displayNone}
        ref={customColorPicker}
      />
    </Form>
  );
};

export default Field;
