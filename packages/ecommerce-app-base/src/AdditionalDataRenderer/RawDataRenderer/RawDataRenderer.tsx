import type { FC } from 'react';
import * as React from 'react';
import { CopyButton, Flex } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { JSONObject } from '../../types';

type Props = { value: JSONObject };

export const RawDataRenderer: FC<Props> = ({ value }) => {
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
          <CopyButton value={JSON.stringify(value, null, 2)} />
        </div>
        <code>{JSON.stringify(value, null, 2)}</code>
      </pre>
    </Flex>
  );
};
