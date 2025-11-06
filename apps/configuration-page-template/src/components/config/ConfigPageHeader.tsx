import { FC } from 'react';
import { Flex, Heading } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';

const headerStyles = {
  root: {
    padding: '8px 32px',
    borderBottom: '1px solid #E3E8EE',
    backgroundColor: 'white',
  },
};

export const ConfigPageHeader: FC = () => {
  return (
    <Flex style={headerStyles.root}>
      <Heading
        as="h1"
        marginBottom="none"
        style={{ textAlign: 'center', width: '100%', fontSize: tokens.fontSizeL }}>
        Build your app's configuration page
      </Heading>
    </Flex>
  );
};
