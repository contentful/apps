import * as React from 'react';
import {
  Note as FormaNote,
  Typography,
  Heading,
  Paragraph,
  TextLink,
  HelpText,
} from '@contentful/forma-36-react-components';
import styled from '@emotion/styled';
import Section from './section';

const Note = styled(FormaNote)`
  margin-bottom: 32px;
`;

const ConfigHeader: React.FC = () => {
  return (
    <>
      <Section isDisabled={false}>
        <Typography>
          <Heading>About Knowledge Base (EAP)</Heading>
          <Paragraph>
            With this app you can create and deploy a knowledge base for your
            support team. We&apos;ve prepared the foundation, so you can get
            started. The app is in the{' '}
            <TextLink target="blank" href="https://forms.gle/SuV276jagXF6e2DM7">
              Early Access Program (EAP)
            </TextLink>
          </Paragraph>
        </Typography>
      </Section>

      <Note>
        <HelpText>
          Help us improve your experience with this app.{' '}
          <TextLink target="blank" href="https://forms.gle/RMuPrtJP6uR8MfVL9">
            Give feedback.
          </TextLink>
        </HelpText>
      </Note>
    </>
  );
};

export default ConfigHeader;
