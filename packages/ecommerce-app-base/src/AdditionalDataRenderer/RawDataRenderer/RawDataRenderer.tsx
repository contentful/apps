import type { FC } from 'react';
import * as React from 'react';
import { CopyButton, Flex } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';

type Props = {
  value: Parameters<typeof JSON.stringify>[0];
};

export const RawDataRenderer: FC<Props> = ({ value }) => {
  const stringValue = JSON.stringify(value, null, 2);
  return (
    <Flex alignItems="flex-start" fullWidth={true} justifyContent="space-between">
      <pre
        style={{
          overflow: 'hidden',
          position: 'relative',
          width: '100%',
          margin: 0,
          backgroundColor: tokens.gray100,
          border: `1px dashed ${tokens.gray300}`,
          borderRadius: tokens.borderRadiusMedium,
          padding: `${tokens.spacingS}`,
        }}>
        <div
          style={{
            position: 'absolute',
            right: tokens.spacingXs,
            top: tokens.spacingXs,
          }}></div>
        <div
          style={{
            position: 'absolute',
            right: tokens.spacingXs,
            bottom: tokens.spacingXs,
          }}>
          <CopyButton value={stringValue} />
        </div>
        <code>{stringValue}</code>
      </pre>
    </Flex>
  );
};
