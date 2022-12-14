import { useCallback, useState, useEffect } from 'react';
import { AppExtensionSDK } from '@contentful/app-sdk';
import { Heading, Form, Paragraph } from '@contentful/f36-components';
import { css } from 'emotion';
import { omitBy } from 'lodash';
import { useSDK } from '@contentful/react-apps-toolkit';
import tokens from '@contentful/f36-tokens';

import FormControlServiceAccountKey from '../components/FormControlServiceAccountKey';
import type { AppInstallationParameters, ServiceAccountKey, ServiceAccountKeyId } from '../types';

export const emptyServiceAccountKey: ServiceAccountKey = {
  type: '',
  project_id: '',
  private_key_id: '',
  private_key: '',
  client_email: '',
  client_id: '',
  auth_uri: '',
  token_uri: '',
  auth_provider_x509_cert_url: '',
  client_x509_cert_url: '',
};

const emptyServiceAccountKeyId: ServiceAccountKeyId = {
  id: '',
  clientEmail: '',
  clientId: '',
  projectId: '',
};

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
    serviceAccountKey: emptyServiceAccountKey,
    serviceAccountKeyId: emptyServiceAccountKeyId,
  });
  const [newServiceAccountKey, setNewServiceAccountKey] = useState<ServiceAccountKey | null>(null);
  const [newServiceAccountKeyId, setNewServiceAccountKeyId] = useState<ServiceAccountKeyId | null>(
    null
  );
  const sdk = useSDK<AppExtensionSDK>();

  const onConfigure = useCallback(async () => {
    const currentState = await sdk.app.getCurrentState();

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

    return {
      parameters: newParameters,
      targetState: currentState,
    };
  }, [newServiceAccountKey, newServiceAccountKeyId, parameters, sdk]);

  useEffect(() => {
    sdk.app.onConfigure(() => onConfigure());
  }, [sdk, onConfigure]);

  useEffect(() => {
    (async () => {
      const currentParameters: AppInstallationParameters | null = await sdk.app.getParameters();

      if (currentParameters) {
        setParameters(currentParameters);
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
          The Google Analytics app displays realtime page-based analytics data from your
          organization's Google Analytics properties alongside relevant content entries.
        </Paragraph>

        <hr className={styles.splitter} />

        <Form>
          <Heading as="h2" className={styles.sectionHeading}>
            Authorization Credentials
          </Heading>
          <Paragraph>
            Authorize this application to access page analytics data from your organiation's Google
            Analytics account.
          </Paragraph>

          <FormControlServiceAccountKey
            setServiceAccountKey={setNewServiceAccountKey}
            setServiceAccountKeyId={setNewServiceAccountKeyId}
            currentServiceAccountKeyId={
              parameters.serviceAccountKeyId === emptyServiceAccountKeyId
                ? null
                : parameters.serviceAccountKeyId
            }
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
