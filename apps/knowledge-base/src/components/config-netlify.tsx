import * as React from 'react';
import {
  Note as FormaNote,
  HelpText,
  TextLink,
  Typography,
  Heading,
  Paragraph,
  Button,
  Spinner,
} from '@contentful/forma-36-react-components';
import styled from '@emotion/styled';
import Section from './section';
import { useNetlify } from '~/providers/netlify-provider';

const Note = styled(FormaNote)`
  margin-bottom: 32px;
`;

const ConfigNetlify: React.FC = () => {
  const netlify = useNetlify();

  return (
    <Section isDisabled={false}>
      <Note>
        <HelpText>
          Help us improve your experience with this app.{' '}
          <TextLink target="blank" href="https://forms.gle/RMuPrtJP6uR8MfVL9">
            Give feedback.
          </TextLink>
        </HelpText>
      </Note>

      <Typography>
        <Heading>1. Connect account</Heading>
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
