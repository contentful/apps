import * as React from 'react';
import { FC, PropsWithChildren } from 'react';
import { Box } from '@contentful/f36-components';
import { css } from 'emotion';
import tokens from '@contentful/f36-tokens';

const styles = {
  container: css({
    width: tokens.contentWidthFull,
    backgroundColor: tokens.gray100,
    borderRadius: tokens.borderRadiusMedium,
  }),
};

export const Container: FC<PropsWithChildren<NonNullable<unknown>>> = ({ children }) => {
  return (
    <Box className={styles.container} padding={'spacingM'}>
      {children}
    </Box>
  );
};
