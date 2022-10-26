import { FieldExtensionSDK } from '@contentful/app-sdk';
import { Flex, Form, Menu } from '@contentful/f36-components';
import { useFieldValue, useSDK } from '@contentful/react-apps-toolkit';
import { css } from 'emotion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ColorBox } from '../components/ColorBox';
import { SelectColorButton } from '../components/SelectColorButton';
import { Color, Theme } from '../types';

const styles = {
  displayNone: css({
    display: 'none',
  }),
  menuList: css({
    width: 'calc(100% - 2px)', // -2px to keep borders visible
    left: 0,
  }),
};

// Dropdown + margin top + box shadow
const HEIGHT_DEFAULT = 41;
const HEIGHT_BASE = 52 + 4 + 14;
const HEIGHT_ITEM = 36;

type FieldValue = Color | string;

const Field = () => {
  const sdk = useSDK<FieldExtensionSDK>();
  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useFieldValue<FieldValue>();
  const customColorPicker = useRef<HTMLInputElement>(null);

  const storeHexValue = sdk.field.type === 'Symbol';
  const allowCustomValue = sdk.parameters.instance.withCustomValue;

  // @ts-ignore
  const theme: Theme = sdk.parameters.installation.themes[0];

  useEffect(() => {
    if (!isOpen) {
      sdk.window.updateHeight(HEIGHT_DEFAULT);
      return;
    }

    // @ts-ignore
    const customItemHeight = sdk.parameters.instance.withCustomValue
      ? HEIGHT_ITEM
      : 0;
    const calculatedHeight =
      HEIGHT_BASE + customItemHeight + theme.colors.length * HEIGHT_ITEM;

    sdk.window.updateHeight(calculatedHeight <= 400 ? calculatedHeight : 400);
  }, [isOpen, sdk, theme]);

  const name = useMemo(() => {
    if (storeHexValue) {
      const color = theme.colors.find((c) => c.value === (value as string));
      if (color) {
        return color.name;
      }
      if (allowCustomValue) {
        return 'Custom';
      } else {
        return 'Invalid';
      }
    } else {
      return (value as Color).name ?? 'Invalid';
    }
  }, [allowCustomValue, storeHexValue, theme.colors, value]);

  return (
    <Form>
      {theme.colors.length === 0 ? (
        <SelectColorButton
          name={name}
          value={value}
          onClick={() => customColorPicker?.current?.click()}
        />
      ) : (
        <Menu
          isOpen={isOpen}
          onOpen={() => setIsOpen(true)}
          onClose={() => setIsOpen(false)}
        >
          <Menu.Trigger>
            <SelectColorButton showChevron name={name} value={value} />
          </Menu.Trigger>
          <Menu.List className={styles.menuList}>
            {theme.colors.map((color: Color) => (
              <Menu.Item
                key={color.id}
                onClick={() => setValue(storeHexValue ? color.value : color)}
              >
                <Flex alignItems="center" gap="spacingXs">
                  <ColorBox color={color} />
                  {color.name}
                </Flex>
              </Menu.Item>
            ))}
            {allowCustomValue && (
              <Menu.Item onClick={() => customColorPicker?.current?.click()}>
                Custom...
              </Menu.Item>
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
