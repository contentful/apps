import { Box, FormControl, Heading, Paragraph, TextInput } from '@contentful/f36-components';
import { ChangeEvent } from 'react';
import { styles } from './ConfigPage.styles';
import { AppInstallationParameters } from '@locations/ConfigScreen';
import { headerSection, accessSection } from '@constants/configCopy';

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
      <Heading>{headerSection.title}</Heading>
      <Paragraph>{headerSection.description}</Paragraph>
      <hr className={styles.splitter} />
      <FormControl data-test-id="tenant-id-section">
        <FormControl.Label>{accessSection.fieldName}</FormControl.Label>
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
