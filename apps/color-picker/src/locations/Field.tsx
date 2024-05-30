import { FieldAppSDK } from '@contentful/app-sdk';
import { Flex, Form, Menu } from '@contentful/f36-components';
import { useFieldValue, useSDK } from '@contentful/react-apps-toolkit';
import { css } from 'emotion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ColorBox } from '../components/ColorBox';
import { SelectColorButton } from '../components/SelectColorButton';
import { Color, Theme } from '../types';
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
  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useFieldValue<FieldValue>();
  const customColorPicker = useRef<HTMLInputElement>(null);

  const storeHexValue = sdk.field.type === 'Symbol';

  const themeName = sdk.parameters.instance.themeName;
  const themes = sdk.parameters.installation.themes;

  const allowCustomValue = useMemo(() => {
    const { validations } = sdk.field;

    const instanceParam = sdk.parameters.instance.withCustomValue;
    const hasValidation = validations.find((validation) => validation.in)?.in;

    return instanceParam && !hasValidation;
  }, [sdk.field, sdk.parameters.instance]);

  // @ts-ignore
  const theme: Theme = themes.find(
    (t: Theme) => t.name.replace(' ', '').toLowerCase() === themeName.replace(' ', '').toLowerCase()
  );

  const validatedColors = useMemo(() => {
    const { validations } = sdk.field;

    const acceptedValues = validations.find((validation) => validation.in)?.in;

    if (acceptedValues?.at(0) && theme?.colors?.at(0)) {
      return theme.colors.filter((color) => acceptedValues?.includes(color.value));
    }

    return theme.colors;
  }, [sdk.field, theme.colors]);

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
        const color = theme.colors.find((c) => c.value === value);
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
          return 'Invalid';
        } else {
          return 'Select a color…';
        }

      default:
        return 'Invalid';
    }
  }, [allowCustomValue, sdk.field.required, theme.colors, value]);

  return (
    <Form>
      {theme.colors.length === 0 ? (
        <SelectColorButton
          name={name}
          value={value}
          onClick={() => customColorPicker?.current?.click()}
          onClearClick={() => setValue(undefined)}
        />
      ) : (
        <Menu isOpen={isOpen} onOpen={() => setIsOpen(true)} onClose={() => setIsOpen(false)}>
          <Menu.Trigger>
            <SelectColorButton
              showChevron
              name={name}
              value={value}
              onClearClick={() => setValue(undefined)}
            />
          </Menu.Trigger>
          <Menu.List className={styles.menuList}>
            {validatedColors.map((color: Color) => (
              <Menu.Item
                key={color.id}
                onClick={() => setValue(storeHexValue ? color.value : color)}>
                <Flex alignItems="center" gap="spacingXs">
                  <ColorBox color={color} />
                  <Flex gap="spacing2Xs">
                    {color.name}
                    <span className={styles.hexValue}>{color.value}</span>
                  </Flex>
                </Flex>
              </Menu.Item>
            ))}
            {allowCustomValue && (
              <Menu.Item onClick={() => customColorPicker?.current?.click()}>Custom...</Menu.Item>
            )}
          </Menu.List>
        </Menu>
      )}
      <input
        onChange={(e) => {
          if (storeHexValue) {
            setValue(e.target.value);
          } else {
            setValue({
              id: window.crypto.randomUUID(),
              name: 'Custom',
              value: e.target.value,
              theme: theme.name,
            });
          }
        }}
        type="color"
        id="customColor"
        className={styles.displayNone}
        ref={customColorPicker}
      />
    </Form>
  );
};

export default Field;
