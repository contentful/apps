import { useCallback, useState, useEffect } from 'react';
import { AppExtensionSDK } from '@contentful/app-sdk';
import { Heading, Form, Paragraph } from '@contentful/f36-components';
import { css } from 'emotion';
import { omitBy } from 'lodash';
import { useSDK } from '@contentful/react-apps-toolkit';
import tokens from '@contentful/f36-tokens';

import FormControlServiceAccountKey from '../components/FormControlServiceAccountKey';
import {
  convertServiceAccountKeyToServiceAccountKeyId,
  convertKeyFileToServiceAccountKey,
  AssertionError,
} from '../utils/serviceAccountKey';
import type { AppInstallationParameters, ServiceAccountKey, ServiceAccountKeyId } from '../types';

const googleAnalyticsBrand = {
  primaryColor: '#E8710A',
  url: 'https://www.google.com/analytics',
  logoImage: './images/google-analytics-logo.png',
};

const styles = {
  body: css({
    height: 'auto',
    minHeight: '65vh',
    margin: '0 auto',
    marginTop: tokens.spacingXl,
    padding: `${tokens.spacingXl} ${tokens.spacing2Xl}`,
    maxWidth: tokens.contentWidthText,
    backgroundColor: tokens.colorWhite,
    zIndex: 2,
    boxShadow: '0px 0px 20px rgba(0, 0, 0, 0.1)',
    borderRadius: '2px',
  }),
  background: css({
    display: 'block',
    position: 'absolute',
    zIndex: -1,
    top: 0,
    width: '100%',
    height: '300px',
    backgroundColor: googleAnalyticsBrand.primaryColor,
  }),
  section: css({
    margin: `${tokens.spacingXl} 0`,
  }),
  splitter: css({
    marginTop: tokens.spacingL,
    marginBottom: tokens.spacingL,
    border: 0,
    height: '1px',
    backgroundColor: tokens.gray300,
  }),
  sectionHeading: css({
    fontSize: tokens.fontSizeL,
    marginBottom: tokens.spacing2Xs,
  }),
  serviceAccountKeyFormControl: css({
    marginBottom: tokens.spacing2Xl,
  }),
  icon: css({
    display: 'flex',
    justifyContent: 'center',
    img: {
      display: 'block',
      width: '170px',
      margin: `${tokens.spacingXl} 0`,
    },
  }),
};

const ConfigScreen = () => {
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
  const [serviceAccountKeyFormControlIsExpanded, setServiceAccountKeyFormControlIsExpanded] =
    useState<boolean>(false);

  const sdk = useSDK<AppExtensionSDK>();

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

  const onExpanderClick = () => {
    setServiceAccountKeyFormControlIsExpanded(!serviceAccountKeyFormControlIsExpanded);
  };

  const onKeyFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setServiceAccountKeyFile(event.target.value);

    const trimmedFieldValue = event.target.value;
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
    setServiceAccountKeyFileIsRequired(false);
    setServiceAccountKeyFormControlIsExpanded(false);
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
    (async () => {
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
    })();
  }, [sdk]);

  return (
    <>
      <div className={styles.background} />

      <div className={styles.body}>
        <Heading>About Google Analytics for Contentful</Heading>
        <Paragraph>
          The Google Analytics app displays real-time page-based analytics data from your
          organization’s Google Analytics properties alongside relevant content entries.
        </Paragraph>

        <hr className={styles.splitter} />

        <Form>
          <Heading as="h2" className={styles.sectionHeading}>
            Authorization Credentials
          </Heading>
          <Paragraph>
            Authorize this application to access page analytics data from your organization’s Google
            Analytics account.
          </Paragraph>

          <FormControlServiceAccountKey
            isRequired={serviceAccountKeyFileIsRequired}
            isValid={serviceAccountKeyFileIsValid}
            isExpanded={serviceAccountKeyFormControlIsExpanded}
            errorMessage={serviceAccountKeyFileErrorMessage}
            currentServiceAccountKeyId={parameters.serviceAccountKeyId}
            currentServiceAccountKey={parameters.serviceAccountKey}
            serviceAccountKeyFile={serviceAccountKeyFile}
            onKeyFileChange={onKeyFileChange}
            onExpanderClick={onExpanderClick}
            className={styles.serviceAccountKeyFormControl}
          />

          <Heading as="h2" className={styles.sectionHeading}>
            Configuration
          </Heading>
          <Paragraph>Configure your Google Analytics app installation.</Paragraph>
        </Form>
      </div>

      <div className={styles.icon}>
        <a href={googleAnalyticsBrand.url} target="_blank" rel="noopener noreferrer">
          <img src={googleAnalyticsBrand.logoImage} alt="Google Analytics" />
        </a>
      </div>
    </>
  );
};

export default ConfigScreen;
