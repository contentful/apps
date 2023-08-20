import * as React from 'react';
import { Box, Collapse } from '@contentful/f36-components';
import { css } from 'emotion';
import tokens from '@contentful/f36-tokens';
import type { FC, PropsWithChildren } from 'react';

export const styles = {
  box: css({
    backgroundColor: tokens.gray100,
    //padding: tokens.spacingM,
    marginTop: tokens.spacingS,
    marginBottom: tokens.spacingS,
  }),
};

type ProductCardRawDataProps = PropsWithChildren<{
  isExpanded: boolean;
}>;

export const ProductCardAdditionalData: FC<ProductCardRawDataProps> = ({
  isExpanded,
  children,
}) => {
  return (
    <Collapse isExpanded={isExpanded}>
      <Box className={styles.box}>{children}</Box>
    </Collapse>
  );
};
