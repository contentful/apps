import React from 'react';
import { Box, Flex, Text } from '@contentful/f36-components';

type Props = {
  icon: React.ReactNode;
  title: string;
  description: string;
  style: any;
};

export default function GenericCheckRow(props: Props) {
  const { icon, title, description, style } = props;

  return (
    <Box display="flex" style={style}>
      <Flex alignItems="center">
        {icon}
        <Text marginRight="spacing2Xs" fontWeight="fontWeightDemiBold">
          {title}
        </Text>
        <Text>- {description}</Text>
      </Flex>
    </Box>
  );
}
