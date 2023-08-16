import { Box, Heading } from '@contentful/f36-components';
import { styles } from './ConfigPage.styles';
import APIKey from 'components/config/ApiKeySection/APIKeySection';
import { AppInstallationParameters } from 'types/configPage';
import configPageCopies from 'constants/configPageCopies';
import CostSection from '../CostSection/CostSection';
import DisclaimerSection from '../DisclaimerSection/DisclaimerSection';

interface ParameterObject {
  [key: string]: string;
}

interface Props {
  handleConfig: (value: ParameterObject) => void;
  parameters: AppInstallationParameters;
}

const ConfigPage = (props: Props) => {
  const { handleConfig, parameters } = props;
  const { pageTitle } = configPageCopies.configPage

  return (
    <Box className={styles.body}>
      <Heading>{pageTitle}</Heading>
      <hr className={styles.splitter} />
      <APIKey apiKey={parameters.apiKey} handleApiKey={handleConfig} />
      <hr className={styles.splitter} />
      <CostSection />
      <hr className={styles.splitter} />
      <DisclaimerSection />
    </Box>
  );
};

export default ConfigPage;
