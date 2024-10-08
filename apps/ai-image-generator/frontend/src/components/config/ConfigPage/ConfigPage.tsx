import { Box, Heading } from '@contentful/f36-components';
import APIKey from '@components/config/ApiKeySection/APIKeySection';
import configPageCopies from '@constants/configPageCopies';
import CostSection from '@components/config/CostSection/CostSection';
import DisclaimerSection from '@components/config/DisclaimerSection/DisclaimerSection';
import GettingStartedSection from '../GettingStartedSection/GettingStartedSection';
import { styles } from './ConfigPage.styles';
import { AppInstallationParameters } from '../../../types/configPage';

interface ParameterObject {
  [key: string]: string;
}

interface Props {
  handleConfig: (value: ParameterObject) => void;
  parameters: AppInstallationParameters;
  appIsInstalled?: boolean;
}

const ConfigPage = (props: Props) => {
  const { handleConfig, parameters } = props;
  const { pageTitle } = configPageCopies.configPage;

  return (
    <Box className={styles.body}>
      <Heading>{pageTitle}</Heading>
      <hr className={styles.splitter} />
      <APIKey apiKey={parameters.apiKey} handleApiKey={handleConfig} />
      <hr className={styles.splitter} />
      <CostSection />
      <hr className={styles.splitter} />
      <DisclaimerSection />
      <hr className={styles.splitter} />
      <GettingStartedSection appIsInstalled={props.appIsInstalled} />
    </Box>
  );
};

export default ConfigPage;
