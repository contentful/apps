import { FieldExtensionSDK } from '@contentful/app-sdk';
import { Button, ButtonGroup, Flex } from '@contentful/f36-components';
import { ChevronDownIcon, CloseIcon } from '@contentful/f36-icons';
import tokens from '@contentful/f36-tokens';
import { useSDK } from '@contentful/react-apps-toolkit';
import { css } from 'emotion';
import { forwardRef, Ref } from 'react';
import { Color } from '../types';
import { ColorBox } from './ColorBox';

const styles = {
  hexValue: css({
    color: tokens.gray500,
    fontVariantNumeric: 'tabular-nums',
    width: '70px',
    display: 'inline-block',
    textAlign: 'left',
  }),
  buttonGroup: css({
    width: '100%',
    justifyContent: 'stretch',
  }),
  pickerButton: css({
    maxWidth: '100%',
    flexGrow: 1,
  }),
};

interface MenuButtonProps {
  showChevron?: boolean;
  name: string;
  value?: Color | string;
  onClick?: () => void;
  onClearClick?: () => void;
}

function _SelectColorButton(
  { showChevron, name, value, onClick, onClearClick }: MenuButtonProps,
  ref: Ref<HTMLButtonElement>
) {
  const sdk = useSDK<FieldExtensionSDK>();

  return (
    <ButtonGroup withDivider className={styles.buttonGroup}>
      <Button
        endIcon={showChevron ? <ChevronDownIcon /> : undefined}
        className={styles.pickerButton}
        onClick={onClick}
        ref={ref}>
        <Flex alignItems="center" gap="spacingXs">
          <ColorBox color={value} />
          <Flex gap="spacing2Xs">
            {name}{' '}
            <span className={styles.hexValue}>
              {(typeof value === 'string' ? value : value?.value) ?? ''}
            </span>
          </Flex>
        </Flex>
      </Button>
      {!sdk.field.required && value !== undefined && (
        <Button variant="secondary" startIcon={<CloseIcon />} onClick={onClearClick}>
          Clear
        </Button>
      )}
    </ButtonGroup>
  );
}

export const SelectColorButton = forwardRef(_SelectColorButton);
