import { useCallback, useState, useEffect } from 'react';
import { AppExtensionSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { AppInstallationParameters, ServiceAccountKey, ServiceAccountKeyId } from 'types';
import {
  convertServiceAccountKeyToServiceAccountKeyId,
  convertKeyFileToServiceAccountKey,
  AssertionError,
} from 'utils/serviceAccountKey';
import omitBy from 'lodash/omitBy';

interface KeyServiceInfoType {
  parameters: AppInstallationParameters;
  serviceAccountKeyFile: string;
  serviceAccountKeyFileErrorMessage: string;
  serviceAccountKeyFileIsValid: boolean;
  serviceAccountKeyFileIsRequired: boolean;
  handleKeyFileChange: Function;
}

interface Props {
  onSaveGoogleAccountDetails?: Function; // Need this to switch the service account card view to display mode
}

export default function useKeyService(props: Props): KeyServiceInfoType {
  const { onSaveGoogleAccountDetails } = props;

  const [parameters, setParameters] = useState<AppInstallationParameters>(
    {} as AppInstallationParameters
  );
  const [newServiceAccountKey, setNewServiceAccountKey] = useState<ServiceAccountKey>();
  const [newServiceAccountKeyId, setNewServiceAccountKeyId] = useState<ServiceAccountKeyId>();
  const [serviceAccountKeyFile, setServiceAccountKeyFile] = useState<string>('');
  const [serviceAccountKeyFileErrorMessage, setServiceAccountKeyFileErrorMessage] =
    useState<string>('');
  const [serviceAccountKeyFileIsValid, setServiceAccountKeyFileIsValid] = useState<boolean>(true);
  const [serviceAccountKeyFileIsRequired, setServiceAccountKeyFileIsRequired] =
    useState<boolean>(false);

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

    setParameters(newParameters);
    if (onSaveGoogleAccountDetails) onSaveGoogleAccountDetails();
    setServiceAccountKeyFileIsRequired(false);
    setServiceAccountKeyFile('');

    return {
      parameters: newParameters,
      targetState: currentState,
    };
  }, [
    sdk.app,
    sdk.notifier,
    serviceAccountKeyFileIsValid,
    serviceAccountKeyFileIsRequired,
    newServiceAccountKeyId,
    newServiceAccountKey,
    parameters,
    onSaveGoogleAccountDetails,
  ]);

  useEffect(() => {
    sdk.app.onConfigure(() => onConfigure());
  }, [sdk, onConfigure]);

  useEffect(() => {
    const setupAppInstallationParameters = async () => {
      const currentParameters: AppInstallationParameters =
        (await sdk.app.getParameters()) ?? ({} as AppInstallationParameters);

      if (currentParameters) {
        setParameters(currentParameters);
        setServiceAccountKeyFileIsRequired(false);
      } else {
        // per the documentation, `null` means app is not installed, thus we will require
        // the key file
        setServiceAccountKeyFileIsRequired(true);
      }

      sdk.app.setReady();
    };

    setupAppInstallationParameters();
  }, [sdk]);

  const handleValidServiceAccountKey = (newServiceAccountKey: ServiceAccountKey | undefined) => {
    setNewServiceAccountKey(newServiceAccountKey);
    setNewServiceAccountKeyId(
      newServiceAccountKey
        ? convertServiceAccountKeyToServiceAccountKeyId(newServiceAccountKey)
        : undefined
    );
    setServiceAccountKeyFileErrorMessage('');
    setServiceAccountKeyFileIsValid(true);
  };

  const handleInvalidServiceAccountKey = (errorMessage: string) => {
    setNewServiceAccountKey(undefined);
    setNewServiceAccountKeyId(undefined);
    setServiceAccountKeyFileErrorMessage(errorMessage);
    setServiceAccountKeyFileIsValid(false);
  };

  const handleKeyFileChange = (keyFile: string) => {
    setServiceAccountKeyFile(keyFile);

    const trimmedFieldValue = keyFile;
    if (trimmedFieldValue === '') {
      handleValidServiceAccountKey(undefined);
      return;
    }

    try {
      const newServiceAccountKey = convertKeyFileToServiceAccountKey(trimmedFieldValue);
      handleValidServiceAccountKey(newServiceAccountKey);
    } catch (e) {
      // failed assertions about key file contents or could not parse as JSON
      if (e instanceof AssertionError || e instanceof SyntaxError) {
        handleInvalidServiceAccountKey(e.message);
      } else {
        console.error(e);
        handleInvalidServiceAccountKey('An unknown error occurred');
      }
    }
  };

  return {
    parameters: parameters,
    serviceAccountKeyFile: serviceAccountKeyFile,
    serviceAccountKeyFileErrorMessage: serviceAccountKeyFileErrorMessage,
    serviceAccountKeyFileIsValid: serviceAccountKeyFileIsValid,
    serviceAccountKeyFileIsRequired: serviceAccountKeyFileIsRequired,
    handleKeyFileChange: handleKeyFileChange,
  };
}
