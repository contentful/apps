import { useCallback, useEffect, useState } from 'react';
import { AppExtensionSDK, AppState, EditorInterface } from '@contentful/app-sdk';
import { useCMA, useSDK } from '@contentful/react-apps-toolkit';
import GoogleAnalyticsIcon from 'components/common/GoogleAnalyticsIcon';
import { styles } from 'components/config-screen/GoogleAnalytics.styles';
import Splitter from 'components/common/Splitter';
import ApiAccessSection from 'components/config-screen/api-access/ApiAccessSection';
import AboutSection from 'components/config-screen/header/AboutSection';
import { AccountSummariesType, ServiceAccountKey } from 'types';
import { Box } from '@contentful/f36-components';
import AssignContentTypeSection from 'components/config-screen/assign-content-type/AssignContentTypeSection';
import MapAccountPropertySection from 'components/config-screen/map-account-property/MapAccountPropertySection';
import { KeyValueMap } from '@contentful/app-sdk/dist/types/entities';
import { generateEditorInterfaceAssignments } from 'helpers/contentTypeHelpers/contentTypeHelpers';
import fetchWithSignedRequest from '../../helpers/signed-requests';
import { config } from '../../config';
import { convertServiceAccountKeyToServiceAccountKeyId } from '../../utils/serviceAccountKey';

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
  const [validKeyFile, setValidKeyFile] = useState<ServiceAccountKey | undefined>();
  const [isSavingPrivateKeyFile, setIsSavingPrivateKeyFile] = useState<boolean>(false);

  const sdk = useSDK<AppExtensionSDK>();
  const cma = useCMA();

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
    // Service Account checks go here
    if (!validKeyFile) {
      sdk.notifier.error('A valid service account key file is required');
      return false;
    }

    // Account to Property checks go here
    if (!isValidAccountProperty && isAppInstalled && !isInEditMode) {
      sdk.notifier.error('A valid account and property selection is required');
      return false;
    }

    // Account to Property checks go here
    if (!isValidContentTypeAssignment && isAppInstalled && !isInEditMode) {
      sdk.notifier.error('Invalid content types assignment');
      return false;
    }

    // Assign the app to the sidebar for saved content types
    const contentTypeIds = Object.keys(parameters.contentTypes ?? {});
    const newEditorInterfaceAssignments = generateEditorInterfaceAssignments(
      currentEditorInterface,
      contentTypeIds,
      'sidebar',
      1
    );

    setCurrentEditorInterface(newEditorInterfaceAssignments);
    setOriginalParameters(parameters);

    const newAppState: AppState = {
      EditorInterface: newEditorInterfaceAssignments,
    };

    return {
      parameters: parameters,
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
    // Save valid google service account key file in backend
    setIsSavingPrivateKeyFile(true);
    const keyFileSaved = validKeyFile && (await postServiceKeyFileToBackend(validKeyFile));
    setIsSavingPrivateKeyFile(false);
    if (!keyFileSaved) {
      sdk.notifier.error(
        'Failed to save private key file. Please try again. Contact support if the problem persists.'
      );
    }

    setIsInEditMode(false);
    setIsAppInstalled(true);
  }, [postServiceKeyFileToBackend, sdk.notifier, validKeyFile]);

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

  const handleInEditModeChange = (_isInEditMode: boolean) => {
    setIsInEditMode(_isInEditMode);
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
          isSavingPrivateKeyFile={isSavingPrivateKeyFile}
          onInEditModeChange={handleInEditModeChange}
          onKeyFileUpdate={handleKeyFileUpdate}
        />
        {isAppInstalled && !isInEditMode && (
          <>
            <Splitter />
            <MapAccountPropertySection
              accountsSummaries={accountsSummaries}
              parameters={parameters}
              onIsValidAccountProperty={handleIsValidAccountProperty}
              mergeSdkParameters={mergeSdkParameters}
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
      </Box>

      <GoogleAnalyticsIcon />
    </>
  );
}
