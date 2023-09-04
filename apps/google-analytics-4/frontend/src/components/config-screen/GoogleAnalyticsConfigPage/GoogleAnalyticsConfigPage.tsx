import { useCallback, useEffect, useState } from 'react';
import { AppExtensionSDK, AppState, EditorInterface } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { isEmpty } from 'lodash';
import GoogleAnalyticsIcon from 'components/common/GoogleAnalyticsIcon';
import { styles } from 'components/config-screen/GoogleAnalyticsConfigPage/GoogleAnalyticsConfigPage.styles';
import Splitter from 'components/common/Splitter';
import ApiAccessSection from 'components/config-screen/api-access/ApiAccessSection';
import AboutSection from 'components/config-screen/header/AboutSection';
import { AccountSummariesType, ServiceAccountKey } from 'types';
import { Box } from '@contentful/f36-components';
import AssignContentTypeSection from 'components/config-screen/assign-content-type/AssignContentTypeSection';
import MapAccountPropertySection from 'components/config-screen/map-account-property/MapAccountPropertySection';
import { KeyValueMap } from '@contentful/app-sdk/dist/types/entities';
import { generateEditorInterfaceAssignments } from 'helpers/contentTypeHelpers/contentTypeHelpers';
import fetchWithSignedRequest from 'helpers/signed-requests';
import { config } from 'config';
import { convertServiceAccountKeyToServiceAccountKeyId } from 'utils/serviceAccountKey';
import HyperLink from 'components/common/HyperLink/HyperLink';
import { ExternalLinkIcon } from '@contentful/f36-icons';

export default function GoogleAnalyticsConfigPage() {
  const [accountsSummaries, setAccountsSummaries] = useState<AccountSummariesType[]>([]);
  const [isInEditMode, setIsInEditMode] = useState<boolean>(false);
  const [isAppInstalled, setIsAppInstalled] = useState<boolean>(false);
  const [parameters, setParameters] = useState<KeyValueMap>({});
  const [isValidAccountProperty, setIsValidAccountProperty] = useState<boolean>(true);
  const [isValidContentTypeAssignment, setIsValidContentTypeAssignment] = useState<boolean>(true);
  const [currentEditorInterface, setCurrentEditorInterface] = useState<Partial<EditorInterface>>(
    {} as Partial<EditorInterface>
  );
  const [originalParameters, setOriginalParameters] = useState<KeyValueMap>({});
  const [hasServiceCheckErrors, setHasServiceCheckErrors] = useState<boolean>(true);
  const [validKeyFile, setValidKeyFile] = useState<ServiceAccountKey | undefined>();
  const [isSavingConfiguration, setIsSavingConfiguration] = useState<boolean>(false);
  const [isApiAccessLoading, setIsApiAccessLoading] = useState(true);

  const sdk = useSDK<AppExtensionSDK>();
  const cma = sdk.cma;

  const handleHasServiceCheckErrorsChange = (hasErrors: boolean) => {
    setHasServiceCheckErrors(hasErrors);
  };

  /** SDK Parameters handlers/effects **/
  const mergeSdkParameters = (_parameters: KeyValueMap) => {
    setParameters({ ...parameters, ..._parameters });
  };

  useEffect(() => {
    const fetchParametersFromSdk = async () => {
      const _parameters = await sdk.app.getParameters();
      if (_parameters) {
        setParameters(_parameters);
        setOriginalParameters(_parameters);
      }
    };

    fetchParametersFromSdk();
  }, [sdk]);

  useEffect(() => {
    const fetchEditorInterfaceFromSdk = async () => {
      const _currentState: AppState | null = await sdk.app.getCurrentState();
      if (_currentState) {
        setCurrentEditorInterface(_currentState ? _currentState.EditorInterface : {});
      }
    };

    fetchEditorInterfaceFromSdk();
  }, [sdk]);

  const postServiceKeyFileToBackend = useCallback(
    async (validKeyFile: ServiceAccountKey) => {
      const apiCredentialsUrl = new URL(`${config.backendApiUrl}/api/service_account_key_file`);
      const encodedServiceAccountKeyId = window.btoa(
        JSON.stringify(convertServiceAccountKeyToServiceAccountKeyId(validKeyFile))
      );

      const res = await fetchWithSignedRequest(
        apiCredentialsUrl,
        sdk.ids.app,
        cma,
        'PUT',
        {
          'X-Contentful-ServiceAccountKeyId': encodedServiceAccountKeyId,
        },
        validKeyFile
      );

      if (!res.ok) {
        sdk.notifier.error(
          'Error: Failed to store Google Service Account Key. Please try again. If the problem persists, please contact support.'
        );
        return false;
      }

      return true;
    },
    [cma, sdk.ids.app, sdk.notifier]
  );

  const handleConfigure = useCallback(async () => {
    setIsSavingConfiguration(true);

    // if no serviceAccountKeyId (most likely when user is saving on first install without providing a key)
    if (isEmpty(parameters.serviceAccountKeyId)) {
      sdk.notifier.error('A valid service account key file is required');
      setIsSavingConfiguration(false);
      return false;
    }

    // when a key has already been saved, page is in edit mode, and valid key file is undefined, make it clear to user they are saving an old config if not providing a new valid one
    if (parameters.serviceAccountKeyId && isInEditMode && isEmpty(validKeyFile)) {
      sdk.notifier.error(
        'The original service account key will be saved unless a new valid service account key file is provided.'
      );
      setIsSavingConfiguration(false);
      return false;
    }

    // Property checks go here
    if (!isValidAccountProperty && isAppInstalled && !isInEditMode) {
      sdk.notifier.error('A valid property selection is required');
      setIsSavingConfiguration(false);
      return false;
    }

    // Content types checks go here
    if (!isValidContentTypeAssignment && isAppInstalled && !isInEditMode) {
      sdk.notifier.error('Invalid content types assignment');
      setIsSavingConfiguration(false);
      return false;
    }

    setIsInEditMode(false);

    let parametersToSave = parameters;

    // Filter out empty content types that came from empty rows on the form
    if (parameters.contentTypes) {
      const nonEmptyContentTypes = Object.fromEntries(
        Object.entries(parameters.contentTypes).filter(([key]) => key !== '')
      );

      parametersToSave = { ...parameters, contentTypes: nonEmptyContentTypes };
      setParameters(parametersToSave);
    }

    // Assign the app to the sidebar for saved content types
    const contentTypeIds = Object.keys(parametersToSave.contentTypes ?? {});
    const newEditorInterfaceAssignments = generateEditorInterfaceAssignments(
      currentEditorInterface,
      contentTypeIds,
      'sidebar',
      1
    );

    setCurrentEditorInterface(newEditorInterfaceAssignments);
    setOriginalParameters(parametersToSave);

    const newAppState: AppState = {
      EditorInterface: newEditorInterfaceAssignments,
    };

    return {
      parameters: parametersToSave,
      targetState: newAppState,
    };
  }, [
    validKeyFile,
    isValidAccountProperty,
    isAppInstalled,
    isInEditMode,
    isValidContentTypeAssignment,
    parameters,
    currentEditorInterface,
    sdk.notifier,
  ]);

  // part 1 of transaction
  useEffect(() => {
    sdk.app.onConfigure(() => handleConfigure());
  }, [sdk, handleConfigure]);

  /** App installation handlers/effects **/
  useEffect(() => {
    const getIsAppInstalled = async () => {
      const isInstalled = await sdk.app.isInstalled();

      setIsAppInstalled(isInstalled);

      sdk.app.setReady();
    };

    getIsAppInstalled();
  }, [sdk]);

  const handleConfigurationCompleted = useCallback(async () => {
    if (isEmpty(validKeyFile)) {
      setIsSavingConfiguration(false);
      return;
    }

    // Save valid google service account key file in backend
    const keyFileSaved = await postServiceKeyFileToBackend(validKeyFile);
    if (!keyFileSaved) {
      sdk.notifier.error(
        'Failed to save private key file. Please try again. Contact support if the problem persists.'
      );
    }

    setIsAppInstalled(true);
    setIsSavingConfiguration(false);
  }, [postServiceKeyFileToBackend, sdk.notifier, validKeyFile]);

  // part 2 of transaction
  useEffect(() => {
    sdk.app.onConfigurationCompleted(() => handleConfigurationCompleted());
  }, [sdk, handleConfigurationCompleted]);

  /** isValid handlers for each Configuration component **/
  const handleIsValidAccountProperty = (isValid: boolean) => {
    setIsValidAccountProperty(isValid);
  };

  const handleIsValidContentTypeAssignment = (isValid: boolean) => {
    setIsValidContentTypeAssignment(isValid);
  };

  /** Shared state between ApiAccessSection and MapAccountPropertySection **/
  const handleAccountSummariesChange = (_accountSummaries: any[]) => {
    setAccountsSummaries(_accountSummaries);
  };

  const handleIsApiAccessLoading = (_isLoadingAdminApi: boolean) => {
    setIsApiAccessLoading(_isLoadingAdminApi);
  };

  const handleInEditModeChange = (_isInEditMode: boolean) => {
    setIsInEditMode(_isInEditMode);
  };

  const showPropertyDropdownAndContentTypeSection = () => {
    return !hasServiceCheckErrors || parameters.propertyId;
  };

  const handleKeyFileUpdate = (_validKeyFile: ServiceAccountKey) => {
    setValidKeyFile(_validKeyFile);
  };

  return (
    <>
      <Box className={styles.background} />
      <Box className={styles.body}>
        <AboutSection />
        <Splitter />
        <ApiAccessSection
          isAppInstalled={isAppInstalled}
          parameters={parameters}
          mergeSdkParameters={mergeSdkParameters}
          onAccountSummariesChange={handleAccountSummariesChange}
          isInEditMode={isInEditMode}
          isSavingConfiguration={isSavingConfiguration}
          onInEditModeChange={handleInEditModeChange}
          onHasServiceCheckErrorsChange={handleHasServiceCheckErrorsChange}
          onKeyFileUpdate={handleKeyFileUpdate}
          onIsApiAccessLoading={handleIsApiAccessLoading}
        />
        {isAppInstalled && showPropertyDropdownAndContentTypeSection() && (
          <>
            <Splitter />
            <MapAccountPropertySection
              accountsSummaries={accountsSummaries}
              parameters={parameters}
              onIsValidAccountProperty={handleIsValidAccountProperty}
              mergeSdkParameters={mergeSdkParameters}
              originalPropertyId={originalParameters.propertyId ?? ''}
              isApiAccessLoading={isApiAccessLoading}
            />
            <Splitter />
            <AssignContentTypeSection
              mergeSdkParameters={mergeSdkParameters}
              onIsValidContentTypeAssignment={handleIsValidContentTypeAssignment}
              parameters={parameters}
              currentEditorInterface={currentEditorInterface}
              originalContentTypes={originalParameters.contentTypes ?? {}}
            />
          </>
        )}

        <Splitter />
        <HyperLink
          body="Questions or concerns? Contact support."
          substring="Contact support."
          hyperLinkHref="https://www.contentful.com/support/?utm_source=webapp&utm_medium=help-menu&utm_campaign=in-app-help"
          icon={<ExternalLinkIcon />}
          alignIcon="end"
        />
      </Box>

      <GoogleAnalyticsIcon />
    </>
  );
}
