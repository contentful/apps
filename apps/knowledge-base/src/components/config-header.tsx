import * as React from 'react';
import {
  Typography,
  Heading,
  Paragraph,
  TextLink,
} from '@contentful/forma-36-react-components';
import Section from './section';

const ConfigHeader: React.FC = () => {
  return (
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
  );
};

export default ConfigHeader;
