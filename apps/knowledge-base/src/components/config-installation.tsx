import * as React from 'react';
import {
  Typography,
  Heading,
  Paragraph,
} from '@contentful/forma-36-react-components';
import Section from './section';

const ConfigInstallation: React.FC = () => {
  return (
    <Section isEnabled={true}>
      <Typography>
        <Heading>1. App is installed 🎉</Heading>
        <Paragraph>Content model and sample content were created.</Paragraph>
      </Typography>
    </Section>
  );
};

export default ConfigInstallation;
