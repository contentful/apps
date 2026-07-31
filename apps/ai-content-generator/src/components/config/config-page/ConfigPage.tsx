import { useMemo, useReducer, useState } from 'react';
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
import AppInstallationParameters, {
  PersistedInstallationParameters,
} from '../appInstallationParameters';

const initialParameters: Validator<AppInstallationParameters> = {
  model: { value: defaultModelId, isValid: true },
  profile: { value: '', isValid: true },
  brandProfile: {},
};

const initialContentTypes: Set<string> = new Set();

const ConfigPage = () => {
  const [parameters, dispatchParameters] = useReducer(parameterReducer, initialParameters);
  const [contentTypes, dispatchContentTypes] = useReducer(contentTypeReducer, initialContentTypes);
  const [keyInput, setKeyInput] = useState<string>('');

  const parametersToSave: PersistedInstallationParameters = useMemo(() => {
    // Flat scalar shape: installation parameter definitions have no object
    // type, and declaring the Secret `key` opts the whole object into strict
    // `additionalProperties: false` validation. Each field here must have a
    // matching definition on the AppDefinition (`key` Secret, rest Symbol).
    const params: PersistedInstallationParameters = {
      model: parameters.model.value,
      profile: parameters.profile.value,
      additional: parameters.brandProfile.additional?.value,
      audience: parameters.brandProfile.audience?.value,
      exclude: parameters.brandProfile.exclude?.value,
      include: parameters.brandProfile.include?.value,
      tone: parameters.brandProfile.tone?.value,
      values: parameters.brandProfile.values?.value,
    };

    // The key is write-only: only persist it when the admin enters a new value,
    // otherwise omit it so we don't clobber the stored Secret with an empty
    // string (the field placeholder promises "leave blank to keep existing").
    if (keyInput) {
      params.key = keyInput;
    }

    return params;
  }, [parameters.brandProfile, parameters.model.value, parameters.profile.value, keyInput]);

  const validateParams = (): string[] => {
    const notifierErrors = [];
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
        model={parameters.model.value}
        keyInput={keyInput}
        onKeyChange={setKeyInput}
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
