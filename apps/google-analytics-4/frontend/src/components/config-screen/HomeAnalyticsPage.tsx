import { useCallback, useState, useEffect } from 'react';
import { AppExtensionSDK } from '@contentful/app-sdk';
import { Box } from '@contentful/f36-components';
import GoogleAnalyticsIcon from 'components/common/GoogleAnalyticsIcon'; import omitBy from 'lodash/omitBy';
import { useSDK } from '@contentful/react-apps-toolkit';
import { styles } from 'components/config-screen/HomeAnalytics.styles'
import Splitter from 'components/common/Splitter';
import ApiAccessPage from 'components/config-screen/api-access/ApiAccessPage';
import ConfigurationPage from 'components/config-screen/configuration/ConfigurationPage';
import AboutSection from 'components/config-screen/header/AboutSection';
import { AppInstallationParameters, ServiceAccountKey, ServiceAccountKeyId } from 'types';
import { convertServiceAccountKeyToServiceAccountKeyId, convertKeyFileToServiceAccountKey, AssertionError } from 'utils/serviceAccountKey';

const HomeAnalyticsPage = () => {
  const [parameters, setParameters] = useState<AppInstallationParameters>({
    serviceAccountKey: null,
    serviceAccountKeyId: null,
  });
  const [newServiceAccountKey, setNewServiceAccountKey] = useState<ServiceAccountKey | null>(null);
  const [newServiceAccountKeyId, setNewServiceAccountKeyId] = useState<ServiceAccountKeyId | null>(
    null
  );

  const [serviceAccountKeyFile, setServiceAccountKeyFile] = useState<string>('');
  const [serviceAccountKeyFileErrorMessage, setServiceAccountKeyFileErrorMessage] =
    useState<string>('');
  const [serviceAccountKeyFileIsValid, setServiceAccountKeyFileIsValid] = useState<boolean>(true);
  const [serviceAccountKeyFileIsRequired, setServiceAccountKeyFileIsRequired] =
    useState<boolean>(false);
  const [isInEditMode, setIsInEditMode] = useState<boolean>(false);

  const sdk = useSDK<AppExtensionSDK>();

  const onConfigure = useCallback(async () => {
    const currentState = await sdk.app.getCurrentState();

    if (!serviceAccountKeyFileIsValid) {
      sdk.notifier.error('Invalid service account key file. See field error for details');
      return false;
    }

    if (serviceAccountKeyFileIsRequired && !newServiceAccountKeyId) {
      sdk.notifier.error('A valid service account key file is required');
      return false;
    }

    const newServiceKeyParameters = {
      serviceAccountKey: newServiceAccountKey,
      serviceAccountKeyId: newServiceAccountKeyId,
    };

    const newParameters = Object.assign(
      {},
      parameters,
      omitBy(newServiceKeyParameters, (val) => val === null)
    );

    setIsInEditMode(false);
    setParameters(newParameters);
    setServiceAccountKeyFileIsRequired(false);
    setServiceAccountKeyFile('');

    return {
      parameters: newParameters,
      targetState: currentState,
    };
  }, [
    newServiceAccountKey,
    newServiceAccountKeyId,
    serviceAccountKeyFileIsRequired,
    serviceAccountKeyFileIsValid,
    parameters,
    sdk,
  ]);

  useEffect(() => {
    sdk.app.onConfigure(() => onConfigure());
  }, [sdk, onConfigure]);

  useEffect(() => {
    const setupAppInstallationParameters = async () => {
      const currentParameters: AppInstallationParameters | null = await sdk.app.getParameters();

      if (currentParameters) {
        setParameters(currentParameters);
        setServiceAccountKeyFileIsRequired(false);
      } else {
        // per the documentation, `null` means app is not installed, thus we will require
        // the key file
        setServiceAccountKeyFileIsRequired(true);
      }

      sdk.app.setReady();
    }

    setupAppInstallationParameters();
  }, [sdk]);

  const setValidServiceAccountKey = (newServiceAccountKey: ServiceAccountKey | null) => {
    setNewServiceAccountKey(newServiceAccountKey);
    setNewServiceAccountKeyId(
      newServiceAccountKey
        ? convertServiceAccountKeyToServiceAccountKeyId(newServiceAccountKey)
        : null
    );
    setServiceAccountKeyFileErrorMessage('');
    setServiceAccountKeyFileIsValid(true);
  };

  const setInvalidServiceAccountKey = (errorMessage: string) => {
    setNewServiceAccountKey(null);
    setNewServiceAccountKeyId(null);
    setServiceAccountKeyFileErrorMessage(errorMessage);
    setServiceAccountKeyFileIsValid(false);
  };

  const handleKeyFileChangeEventWrapper = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleKeyFileChange(event.target.value);
  };

  const handleKeyFileChange = (keyFile: string) => {
    setServiceAccountKeyFile(keyFile);

    const trimmedFieldValue = keyFile;
    if (trimmedFieldValue === '') {
      setValidServiceAccountKey(null);
      return;
    }

    let newServiceAccountKey: ServiceAccountKey;
    try {
      newServiceAccountKey = convertKeyFileToServiceAccountKey(trimmedFieldValue);
    } catch (e) {
      if (
        // failed assertions about key file contents
        e instanceof AssertionError ||
        // could not parse as JSON
        e instanceof SyntaxError
      ) {
        setInvalidServiceAccountKey(e.message);
      } else {
        console.error(e);
        setInvalidServiceAccountKey('An unknown error occurred');
      }
      return;
    }

    setValidServiceAccountKey(newServiceAccountKey);
  };

  const handleEditGoogleAccountDetails = () => {
    setIsInEditMode(true);
  }

  const handleCancelGoogleAccountDetails = () => {
    handleKeyFileChange('');
    setIsInEditMode(false);
  }

  return (
    <>
      <Box className={styles.background} />

      <Box className={styles.body}>
        <AboutSection />
        <Splitter />
        <ApiAccessPage
          isRequired={serviceAccountKeyFileIsRequired}
          isValid={serviceAccountKeyFileIsValid}
          errorMessage={serviceAccountKeyFileErrorMessage}
          currentServiceAccountKeyId={parameters.serviceAccountKeyId}
          currentServiceAccountKey={parameters.serviceAccountKey}
          serviceAccountKeyFile={serviceAccountKeyFile}
          onKeyFileChange={handleKeyFileChangeEventWrapper}
          isInEditMode={isInEditMode}
          onEditGoogleAccountDetails={handleEditGoogleAccountDetails}
          onCancelGoogleAccountDetails={handleCancelGoogleAccountDetails}
        />
        <Splitter />
        <ConfigurationPage />
      </Box>

      <GoogleAnalyticsIcon />
    </>
  );
};

export default HomeAnalyticsPage;
