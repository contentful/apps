import * as React from 'react';
import { FC, PropsWithChildren } from 'react';
import { Flex } from '@contentful/f36-components';

export const Row: FC<PropsWithChildren<NonNullable<unknown>>> = ({ children }) => {
  return (
    <Flex flexDirection="row" gap="spacingL" flexGrow={1} fullWidth={true}>
      {children}
    </Flex>
  );
};
