import { useMemo, useReducer } from 'react';
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
import parameterReducer, { Validator } from '@components/config/parameterReducer';
import contentTypeReducer from '@components/config/contentTypeReducer';
import { ConfigErrors } from '@components/config/configText';
import AppInstallationParameters from '../appInstallationParameters';

const initialParameters: Validator<AppInstallationParameters> = {
  model: {
    value: defaultModelId,
    isValid: true,
  },
  key: {
    value: '',
    isValid: true,
  },
  profile: {
    value: '',
    isValid: true,
  },
  brandProfile: {},
};

const initialContentTypes: Set<string> = new Set();

const ConfigPage = () => {
  const [parameters, dispatchParameters] = useReducer(parameterReducer, initialParameters);
  const [contentTypes, dispatchContentTypes] = useReducer(contentTypeReducer, initialContentTypes);

  const parametersToSave: AppInstallationParameters = useMemo(() => {
    return {
      model: parameters.model.value,
      key: parameters.key.value,
      profile: parameters.profile.value,
      brandProfile: {
        additional: parameters.brandProfile.additional?.value,
        audience: parameters.brandProfile.audience?.value,
        exclude: parameters.brandProfile.exclude?.value,
        include: parameters.brandProfile.include?.value,
        profile: parameters.brandProfile.profile?.value,
        tone: parameters.brandProfile.tone?.value,
        values: parameters.brandProfile.values?.value,
      },
    };
  }, [
    parameters.brandProfile,
    parameters.key.value,
    parameters.model.value,
    parameters.profile.value,
  ]);

  const validateParams = (): string[] => {
    const notifierErrors = [];

    if (!parameters.key.isValid) {
      notifierErrors.push(`${ConfigErrors.failedToSave} ${ConfigErrors.missingApiKey}`);
    }

    if (!parameters.model.isValid) {
      notifierErrors.push(`${ConfigErrors.failedToSave} ${ConfigErrors.missingModel}`);
    }

    const invalidBrandProfile = Object.values(parameters.brandProfile).findIndex((p) => !p.isValid);
    if (!parameters.profile.isValid || invalidBrandProfile !== -1) {
      notifierErrors.push(`${ConfigErrors.failedToSave} ${ConfigErrors.exceededCharacterLimit}`);
    }

    return notifierErrors;
  };

  useSaveConfigHandler(parametersToSave, validateParams, contentTypes);
  useInitializeParameters(dispatchParameters);
  const allContentTypes = useGetContentTypes(dispatchContentTypes);

  return (
    <Box css={styles.body}>
      <Heading>{Sections.pageHeading}</Heading>
      <hr css={styles.splitter} />
      <ConfigSection
        apiKey={parameters.key.value}
        isApiKeyValid={parameters.key.isValid}
        model={parameters.model.value}
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
