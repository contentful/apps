import React from 'react';
import { Text, Flex } from '@contentful/f36-components';
import { ClockIcon } from '@contentful/f36-icons';
import { css } from 'emotion';

interface ProgressMessageProps {
  totalCount: number;
  currentCount: number;
  styles: Record<string, string | number>;
}

export const ProgressMessage: React.FC<ProgressMessageProps> = ({
  totalCount,
  currentCount,
  styles,
}) => {
  return (
    <Flex className={css({ ...styles })} gap="spacingS" flexDirection="column">
      <Flex gap="spacingS" flexDirection="row" justifyContent="flex-start">
        <ClockIcon variant="muted" />
        <Text fontColor="gray800" fontWeight="fontWeightDemiBold">
          Updating entries
        </Text>
      </Flex>
      <Text
        marginLeft="spacingXl"
        fontColor="gray800"
        fontWeight="fontWeightNormal">{`${currentCount} of ${totalCount} completed`}</Text>
    </Flex>
  );
};
