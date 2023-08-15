import { Box, Heading } from '@contentful/f36-components';
import { styles } from './ConfigPage.styles';
import APIKey from '../ApiKey/APIKey';
import { AppInstallationParameters } from '@locations/ConfigScreen';

export const PAGE_TITLE = 'Set up AI Images powered by DALL-E'


interface ParameterObject {
  [key: string]: string
}

interface Props {
  handleConfig: (value: ParameterObject) => void
  parameters: AppInstallationParameters
}


const ConfigPage = (props: Props) => {
  const { handleConfig, parameters } = props;

  return (
    <Box className={styles.body}>
      <Heading>{PAGE_TITLE}</Heading>
      <hr className={styles.splitter} />
      <APIKey apiKey={parameters.apiKey} handleApiKey={handleConfig} />
      <hr className={styles.splitter} />
    </Box>
  );
};

export default ConfigPage;
