import * as React from 'react';
import { FC, PropsWithChildren } from 'react';
import { Box } from '@contentful/f36-components';
import { css } from 'emotion';
import tokens from '@contentful/f36-tokens';

const styles = {
  container: css({
    width: tokens.contentWidthFull,
    padding: tokens.spacingM,
    backgroundColor: tokens.gray100,
    borderRadius: tokens.borderRadiusMedium,
  }),
};

export const Container: FC<PropsWithChildren<object>> = ({ children }) => {
  return <Box className={styles.container}>{children}</Box>;
};
