import AddToSidebarSection from '@components/config/add-to-sidebar-section/AddToSidebarSection';
import BrandSection from '@components/config/brand-section/BrandSection';
import ConfigSection from '@components/config/config-section/ConfigSection';
import { ConfigErrors, Sections } from '@components/config/configText';
import contentTypeReducer from '@components/config/contentTypeReducer';
import CostSection from '@components/config/cost-section/CostSection';
import DisclaimerSection from '@components/config/disclaimer-section/DisclaimerSection';
import FeatureSelectionSection from '@components/config/feature-selection-section/FeatureSelectionSection';
import parameterReducer, { Validator } from '@components/config/parameterReducer';
import { defaultRegionId } from '@configs/aws/bedrockRegions';
import featureConfig, { AIFeature } from '@configs/features/featureConfig';
import { Box, Heading } from '@contentful/f36-components';
import useGetContentTypes from '@hooks/config/useGetContentTypes';
import useInitializeParameters from '@hooks/config/useInitializeParameters';
import useSaveConfigHandler from '@hooks/config/useSaveConfigHandler';
import { useMemo, useReducer, useState } from 'react';
import AppInstallationParameters, {
  PersistedInstallationParameters,
} from '../appInstallationParameters';
import { styles } from './ConfigPage.styles';

const initialParameters: Validator<AppInstallationParameters> = {
  model: {
    value: '',
    isValid: true,
  },
  region: {
    value: defaultRegionId,
    isValid: true,
  },
  accessKeyId: {
    value: '',
    isValid: false,
  },
  secretAccessKey: {
    value: '',
    isValid: false,
  },
  profile: {
    value: '',
    isValid: true,
  },
  brandProfile: {},
  enabledFeatures: {
    value: Object.keys(featureConfig) as AIFeature[],
    isValid: true,
  },
};

const initialContentTypes: Set<string> = new Set();

const ConfigPage = () => {
  const [parameters, dispatchParameters] = useReducer(parameterReducer, initialParameters);
  const [contentTypes, dispatchContentTypes] = useReducer(contentTypeReducer, initialContentTypes);
  const [accessKeyIdInput, setAccessKeyIdInput] = useState<string>('');
  const [secretAccessKeyInput, setSecretAccessKeyInput] = useState<string>('');

  const parametersToSave: PersistedInstallationParameters = useMemo(() => {
    // Flat scalar shape: installation parameter definitions have no object
    // type, and declaring Secret credentials opts the whole object into strict
    // `additionalProperties: false` validation. Each field here must have a
    // matching definition on the AppDefinition.
    const params: PersistedInstallationParameters = {
      model: parameters.model.value,
      region: parameters.region.value,
      profile: parameters.profile.value,
      additional: parameters.brandProfile.additional?.value,
      audience: parameters.brandProfile.audience?.value,
      exclude: parameters.brandProfile.exclude?.value,
      include: parameters.brandProfile.include?.value,
      tone: parameters.brandProfile.tone?.value,
      values: parameters.brandProfile.values?.value,
      // JSON-encode the array since Symbol params are scalar-only.
      enabledFeatures: JSON.stringify(
        parameters.enabledFeatures?.value || (Object.keys(featureConfig) as AIFeature[])
      ),
    };

    // Credentials are write-only: only persist when the admin enters new values,
    // otherwise omit so we don't clobber stored Secrets with empty strings.
    if (accessKeyIdInput) params.accessKeyId = accessKeyIdInput;
    if (secretAccessKeyInput) params.secretAccessKey = secretAccessKeyInput;

    return params;
  }, [
    parameters.brandProfile,
    parameters.model.value,
    parameters.region.value,
    parameters.profile.value,
    parameters.enabledFeatures?.value,
    accessKeyIdInput,
    secretAccessKeyInput,
  ]);

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
        accessKeyID={parameters.accessKeyId.value}
        secretAccessKey={parameters.secretAccessKey.value}
        isAccessKeyValid={parameters.secretAccessKey.isValid}
        model={parameters.model.value}
        modelValid={parameters.model.isValid}
        region={parameters.region.value}
        accessKeyIdInput={accessKeyIdInput}
        secretAccessKeyInput={secretAccessKeyInput}
        onAccessKeyIdChange={setAccessKeyIdInput}
        onSecretAccessKeyChange={setSecretAccessKeyInput}
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
      <FeatureSelectionSection
        enabledFeatures={
          parameters.enabledFeatures?.value || (Object.keys(featureConfig) as AIFeature[])
        }
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
