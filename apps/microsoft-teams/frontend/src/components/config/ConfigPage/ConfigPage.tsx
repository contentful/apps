import { Box, FormControl, Heading, Paragraph, TextInput } from '@contentful/f36-components';
import { ChangeEvent } from 'react';
import { styles } from './ConfigPage.styles';
import { AppInstallationParameters } from '@locations/ConfigScreen';

interface ParameterObject {
  [key: string]: string;
}

interface Props {
  handleConfig: (value: ParameterObject) => void;
  parameters: AppInstallationParameters;
}

const ConfigPage = (props: Props) => {
  const { handleConfig, parameters } = props;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleConfig({ tenantId: e.target.value });
  };

  return (
    <Box className={styles.body}>
      <Heading>Set up Microsoft Teams</Heading>
      <Paragraph>
        The Microsoft Teams app for Contentful lets you set up automatic notifications about
        specific Contentful events so that you can quickly notify collaborators about changes
        throughout the content lifecycle.
      </Paragraph>
      <hr className={styles.splitter} />
      <FormControl data-test-id="tenant-id-section">
        <FormControl.Label>Tenant Id</FormControl.Label>
        <TextInput
          value={parameters.tenantId}
          type="text"
          name="tenantId"
          onChange={handleChange}
        />
      </FormControl>
    </Box>
  );
};

export default ConfigPage;
