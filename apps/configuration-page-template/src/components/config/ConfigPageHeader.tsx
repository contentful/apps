import { FC } from 'react';
import { Flex, Heading } from '@contentful/f36-components';

const headerStyles = {
  root: {
    padding: '24px 32px',
    borderBottom: '1px solid #E3E8EE',
    backgroundColor: 'white',
  },
};

export const ConfigPageHeader: FC = () => {
  return (
    <Flex style={headerStyles.root}>
      <Heading as="h1" marginBottom="none">
        Build your app's configuration page
      </Heading>
    </Flex>
  );
};
