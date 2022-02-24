import React from 'react';
import tokens from '@contentful/f36-tokens';
import { css } from 'emotion';

import { Tooltip } from '@contentful/f36-components';

export interface Props {
  productCount: number;
}

const styles = {
  label: css({
    border: '1px solid',
    borderColor: tokens.gray200,
    borderRadius: '3px',
    backgroundColor: tokens.gray300,
    color: tokens.gray700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '40px',
    margin: `0 ${tokens.spacingXs}`,
    fontWeight: 'bold',
    width: '40px',
    textAlign: 'center',
    transition: `all ${tokens.transitionDurationDefault} ${tokens.transitionEasingDefault}`,
    position: 'relative',
    willChange: 'border-color',

    '&:hover': {
      borderColor: tokens.gray500,
      cursor: 'pointer',
    },
  }),
  tooltip: css({
    height: '40px',
  }),
};

export const OtherProductsCounter = (props: Props) => (
  <Tooltip
    targetWrapperClassName={styles.tooltip}
    content={`${props.productCount} more`}
    placement="bottom"
  >
    <div className={styles.label}>
      <span>+{props.productCount}</span>
    </div>
  </Tooltip>
);
