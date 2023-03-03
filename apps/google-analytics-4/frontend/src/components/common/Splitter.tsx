import React from 'react';
import tokens from '@contentful/f36-tokens';
import { css } from 'emotion';

const styles = {
  splitter: css({
    marginTop: tokens.spacingL,
    marginBottom: tokens.spacingL,
    border: 0,
    height: '2px',
    backgroundColor: tokens.gray300,
  }),
};

export default function Splitter() {
  return <hr className={styles.splitter} />;
}
