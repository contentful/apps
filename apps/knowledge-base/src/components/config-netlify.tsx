import * as React from 'react';
import {
  Typography,
  Heading,
  Paragraph,
  Button,
  Spinner,
} from '@contentful/forma-36-react-components';
import Section from './section';
import { useNetlify } from '~/providers/netlify-provider';

const ConfigNetlify: React.FC = () => {
  const netlify = useNetlify();

  return (
    <Section isEnabled={true}>
      <Typography>
        <Heading>2. Connect account</Heading>
        {!netlify.isReady && (
          <Paragraph>Connect your Netlify account to make changes.</Paragraph>
        )}
        {netlify.isReady && (
          <Paragraph>
            <strong>Netlify account:</strong> {netlify.userInfo.email}
          </Paragraph>
        )}
      </Typography>
      {!netlify.isReady && (
        <Button
          onClick={() => netlify.authorize()}
          disabled={netlify.isLoading || netlify.isReady}
        >
          {netlify.isLoading && <Spinner color="white" />} Connect to Netlify
        </Button>
      )}
    </Section>
  );
};

export default ConfigNetlify;
