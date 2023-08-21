import * as React from 'react';
import { FC, PropsWithChildren } from 'react';
import { Flex } from '@contentful/f36-components';

export const Column: FC<PropsWithChildren<NonNullable<unknown>>> = ({ children }) => {
  return <Flex flexDirection="column">{children}</Flex>;
};
