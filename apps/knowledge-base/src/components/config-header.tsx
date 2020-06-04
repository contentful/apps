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
      <Section isEnabled={true}>
        <Typography>
          <Heading>About Knowledge base (early access)</Heading>
          <Paragraph>
            With this app, you can create and deploy a knowledge base for your
            support team. We&apos;ve prepared the foundation so that you can get
            started. The app is in the{' '}
            <TextLink target="blank" href="https://forms.gle/SuV276jagXF6e2DM7">
              Early Access Program (EAP)
            </TextLink>
            .{' '}
            <TextLink
              target="blank"
              href="https://www.contentful.com/marketplace/app/knowledge-base/"
            >
              Learn more about the Knowledge base app.
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
