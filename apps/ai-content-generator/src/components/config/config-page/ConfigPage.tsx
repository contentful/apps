import { useReducer } from 'react';
import { Box, Heading } from '@contentful/f36-components';
import ConfigSection from '@components/config/config-section/ConfigSection';
import CostSection from '@components/config/cost-section/CostSection';
import DisclaimerSection from '@components/config/disclaimer-section/DisclaimerSection';
import BrandSection from '@components/config/brand-section/BrandSection';
import AddToSidebarSection from '@components/config/add-to-sidebar-section/AddToSidebarSection';
import { styles } from './ConfigPage.styles';
import { Sections } from '@components/config/configText';
import { defaultModelId } from '@configs/ai/gptModels';
import useInitializeParameters from '@hooks/config/useInitializeParameters';
import useSaveConfigHandler from '@hooks/config/useSaveConfigHandler';
import useGetContentTypes from '@hooks/config/useGetContentTypes';
import parameterReducer from '@components/config/parameterReducer';
import contentTypeReducer from '@components/config/contentTypeReducer';
import { AppInstallationParameters } from '@locations/ConfigScreen';
import { ConfigErrors } from '@components/config/configText';

const initialParameters: AppInstallationParameters = {
  model: defaultModelId,
  key: '',
  profile: '',
  brandProfile: {},
};

const initialContentTypes: Set<string> = new Set();

const ConfigPage = () => {
  const [parameters, dispatchParameters] = useReducer(parameterReducer, initialParameters);
  const [contentTypes, dispatchContentTypes] = useReducer(contentTypeReducer, initialContentTypes);

  const validateParams = (params: AppInstallationParameters): string[] => {
    const notifierErrors = [];

    if (!params.key) {
      notifierErrors.push(ConfigErrors.missingApiKey);
    }

    if (!params.model) {
      notifierErrors.push(ConfigErrors.missingModel);
    }

    if (!params.profile) {
      notifierErrors.push(ConfigErrors.missingProfile);
    }

    return notifierErrors;
  };

  useSaveConfigHandler(parameters, validateParams, contentTypes);
  useInitializeParameters(dispatchParameters);
  const allContentTypes = useGetContentTypes(dispatchContentTypes);

  return (
    <Box css={styles.body}>
      <Heading>{Sections.pageHeading}</Heading>
      <hr css={styles.splitter} />
      <ConfigSection
        apiKey={parameters.key}
        model={parameters.model}
        dispatch={dispatchParameters}
      />
      <hr css={styles.splitter} />
      <CostSection />
      <hr css={styles.splitter} />
      <DisclaimerSection />
      <hr css={styles.splitter} />
      <BrandSection
        profile={{ ...parameters.brandProfile, profile: parameters.profile }}
        dispatch={dispatchParameters}
      />
      <hr css={styles.splitter} />
      <AddToSidebarSection
        allContentTypes={allContentTypes}
        selectedContentTypes={contentTypes}
        dispatch={dispatchContentTypes}
      />
    </Box>
  );
};

export default ConfigPage;
