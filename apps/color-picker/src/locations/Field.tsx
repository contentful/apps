/** @jsxImportSource @emotion/react */

import { FieldExtensionSDK } from '@contentful/app-sdk';
import { Button, Flex, Form, Menu } from '@contentful/f36-components';
import { ChevronDownIcon } from '@contentful/f36-icons';
import tokens from '@contentful/f36-tokens';
import { useFieldValue, useSDK } from '@contentful/react-apps-toolkit';
import { css } from '@emotion/react';
import { useEffect, useRef, useState } from 'react';

// Dropdown + margin top + box shadow
const HEIGHT_DEFAULT = 41;
const HEIGHT_BASE = 52 + 4 + 14;
const HEIGHT_ITEM = 36;

const Field = () => {
  const sdk = useSDK<FieldExtensionSDK>();
  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useFieldValue<Color>(
    sdk.field.id,
    sdk.field.locale
  );
  const customColorPicker = useRef<HTMLInputElement>(null);

  // @ts-ignore
  const theme = sdk.parameters.installation.themes[0];

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

  return (
    <Form>
      <Menu
        isOpen={isOpen}
        onOpen={() => setIsOpen(true)}
        onClose={() => setIsOpen(false)}
      >
        <Menu.Trigger>
          <Button endIcon={<ChevronDownIcon />} isFullWidth>
            <Flex alignItems="center" gap="spacingXs">
              <span
                css={css`
                  width: 16px;
                  height: 16px;
                  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.1);
                  background-color: ${value?.value || '#ffffff'};
                  display: flex;
                  border-radius: 4px;
                `}
              />
              <span
                css={css`
                  display: flex;
                  gap: ${tokens.spacing2Xs};
                `}
              >
                {value?.name || 'Invalid'}{' '}
                <span
                  css={css`
                    color: ${tokens.gray500};
                    font-variant-numeric: tabular-nums;
                    width: 70px;
                    display: inline-block;
                    text-align: left;
                  `}
                >
                  {value?.value || ''}
                </span>
              </span>
            </Flex>
          </Button>
        </Menu.Trigger>
        <Menu.List
          css={css`
            width: calc(100% - 2px);
            left: 0;
          `}
        >
          {theme.colors.map((color: Color) => (
            <Menu.Item key={color.id} onClick={() => setValue(color)}>
              <Flex alignItems="center" gap="spacingXs">
                <span
                  css={css`
                    width: 16px;
                    height: 16px;
                    box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.1);
                    background-color: ${color.value};
                    display: flex;
                    border-radius: 4px;
                  `}
                />
                {color.name}
              </Flex>
            </Menu.Item>
          ))}
          {sdk.parameters.instance.withCustomValue ? (
            <Menu.Item onClick={() => customColorPicker?.current?.click()}>
              Other...
            </Menu.Item>
          ) : null}
        </Menu.List>
      </Menu>
      <input
        onChange={(e) =>
          setValue({
            id: window.crypto.randomUUID(),
            name: 'Custom',
            value: e.target.value,
          })
        }
        type="color"
        id="customColor"
        css={css`
          display: none;
        `}
        ref={customColorPicker}
      ></input>
    </Form>
  );
};

export default Field;
