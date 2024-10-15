import React from 'react';
import { css } from '@emotion/css';
import tokens from '@contentful/f36-tokens';

const styles = {
  splitter: css({
    marginTop: tokens.spacingL,
    marginBottom: tokens.spacingL,
    border: 0,
    height: '1px',
    backgroundColor: tokens.gray300,
  }),
};

export default function SectionSplitter() {
  return <hr className={styles.splitter} />;
}
