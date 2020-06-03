import * as React from 'react';
import {
  Typography,
  Heading,
  Paragraph,
} from '@contentful/forma-36-react-components';
import Section from './section';

interface ConfigDoneProps {
  isEnabled: boolean;
}

const ConfigDone: React.FC<ConfigDoneProps> = (props) => {
  return (
    <Section isEnabled={props.isEnabled}>
      <Typography>
        <Heading>4. You’re ready to start</Heading>
        <Paragraph>
          You can save and start adding content or customize your site.
        </Paragraph>
      </Typography>
    </Section>
  );
};

export default ConfigDone;
