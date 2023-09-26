import { useReducer, useState } from 'react';
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
import parameterReducer, { ParameterAction } from '@components/config/parameterReducer';
import contentTypeReducer from '@components/config/contentTypeReducer';
import { AppInstallationParameters } from '@locations/ConfigScreen';
import { ConfigErrors } from '@components/config/configText';
import AI from '@utils/aiApi';
import { modelsBaseUrl } from '@configs/ai/baseUrl';

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
  const [isApiKeyValid, setIsApiKeyValid] = useState(true);
  const [localApiKey, setLocalApiKey] = useState('');

  const validateApiKey = async (key: string): Promise<void> => {
    const ai = new AI(modelsBaseUrl, key, '');

    try {
      await ai.getModels();
      setIsApiKeyValid(true);
    } catch (e: unknown) {
      console.error(e);
      setIsApiKeyValid(false);
    }
  };

  const validateParams = async (params: AppInstallationParameters): Promise<string[]> => {
    const notifierErrors = [];
    validateApiKey(params.key);

    if (!isApiKeyValid) {
      notifierErrors.push(`${ConfigErrors.failedToSave} ${ConfigErrors.missingApiKey}`);
    } else {
      setLocalApiKey('');
    }

    if (!params.model) {
      notifierErrors.push(`${ConfigErrors.failedToSave} ${ConfigErrors.missingModel}`);
    }

    return notifierErrors;
  };

  const handleApiKeyChange = (key: string) => {
    setLocalApiKey(key);
    dispatchParameters({ type: ParameterAction.UPDATE_APIKEY, value: key });
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
        model={parameters.model ?? ''}
        dispatch={dispatchParameters}
        isApiKeyValid={isApiKeyValid}
        localApiKey={localApiKey}
        onApiKeyChange={handleApiKeyChange}
        validateApiKey={validateApiKey}
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
