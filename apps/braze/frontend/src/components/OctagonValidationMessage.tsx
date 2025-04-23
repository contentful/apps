import React from 'react';
import { Flex } from '@contentful/f36-core';
import { Text } from '@contentful/f36-typography';
import { useDensity } from '@contentful/f36-utils';
import WarningOctagonIcon from './WarningOctagonIcon';
import { Icon } from '@contentful/f36-components';

type Props = {
  children: string;
};
const OctagonValidationMessage = (props: Props) => {
  const density = useDensity();

  return (
    <Flex marginTop="spacing2Xs" alignItems="center" aria-live="assertive">
      <Flex marginRight={density === 'high' ? 'spacing2Xs' : 'spacingXs'}>
        <Icon as={WarningOctagonIcon} variant="secondary"></Icon>
      </Flex>
      <Text
        as="p"
        fontColor="red600"
        fontSize={density === 'high' ? 'fontSizeMHigh' : 'fontSizeM'}
        lineHeight={density === 'high' ? 'lineHeightMHigh' : 'lineHeightM'}>
        {props.children}
      </Text>
    </Flex>
  );
};

export default OctagonValidationMessage;
