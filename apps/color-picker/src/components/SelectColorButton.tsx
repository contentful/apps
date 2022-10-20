import { Button, Flex } from '@contentful/f36-components';
import { ChevronDownIcon } from '@contentful/f36-icons';
import tokens from '@contentful/f36-tokens';
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
};

interface MenuButtonProps {
  showChevron?: boolean;
  name: string;
  value?: Color | string;
  onClick?: () => void;
}

function _SelectColorButton(
  { showChevron, name, value, onClick }: MenuButtonProps,
  ref: Ref<HTMLButtonElement>
) {
  return (
    <Button
      endIcon={showChevron ? <ChevronDownIcon /> : undefined}
      isFullWidth
      onClick={onClick}
      ref={ref}
    >
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
  );
}

export const SelectColorButton = forwardRef(_SelectColorButton);
