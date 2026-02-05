/* eslint-disable @typescript-eslint/no-non-null-assertion */
import React, { useState, useEffect } from 'react';
import { AppExtensionSDK } from '@contentful/app-sdk';
import { AppConfig } from '../AppConfig';
import { getToken, tokenIsExpired, tokenWillExpireSoon, resetLocalStorage } from '../utils';
import { InstallationParameters } from '../typings';
import { BASE_URL } from '../constants';

interface Props {
  sdk: AppExtensionSDK;
}

export default function AuthWrapper({ sdk }: Props) {
  let expirationWatchInterval = React.useRef<NodeJS.Timeout | undefined>(undefined);
  const [baseUrl, setBaseUrl] = useState<string>(BASE_URL);
  const [expireSoon, setExpireSoon] = useState(false);

  useEffect(() => {
    sdk.app.getParameters().then((params) => {
      const installationParams = params as InstallationParameters | null;
      const effectiveBaseUrl = installationParams?.baseUrl || BASE_URL;
      setBaseUrl(effectiveBaseUrl);
    });
  }, [sdk]);

  useEffect(() => {
    const refreshToken = () => {
      if (tokenIsExpired(baseUrl)) {
        resetLocalStorage(baseUrl);
      } else if (tokenWillExpireSoon(baseUrl)) {
        setExpireSoon(true);
      }
    };

    const clearExpirationInterval = () => {
      if (expirationWatchInterval.current) {
        clearInterval(expirationWatchInterval.current);
      }
    };

    const watchForExpiration = () => {
      clearExpirationInterval();
      expirationWatchInterval.current = setInterval(refreshToken, 5000);
    };

    watchForExpiration();
    refreshToken();
    return () => clearExpirationInterval();
  }, [baseUrl]);

  return <AppConfig sdk={sdk} expireSoon={expireSoon} />;
}
