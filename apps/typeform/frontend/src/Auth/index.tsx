/* eslint-disable @typescript-eslint/no-non-null-assertion */
import React, { useState, useEffect } from 'react';
import { TypeformOAuth } from './TypeformOAuth';
import { AppExtensionSDK } from '@contentful/app-sdk';
import { AppConfig } from '../AppConfig';
import { styles } from '../AppConfig/styles';
// @ts-ignore 2307
import logo from '../AppConfig/config-screen-logo.svg';
import { Typography, Paragraph, Heading, TextLink } from '@contentful/forma-36-react-components';
import { getToken, tokenIsExpired, tokenWillExpireSoon, resetLocalStorage } from '../utils';

interface Props {
  sdk: AppExtensionSDK;
}

export default function AuthWrapper({ sdk }: Props) {
  let expirationWatchInterval = React.useRef<NodeJS.Timeout | undefined>(undefined);
  const [token, setToken] = useState(getToken());
  const [expireSoon, setExpireSoon] = useState(false);

  useEffect(() => {
    const refreshToken = () => {
      if (tokenIsExpired()) {
        resetLocalStorage();
      } else if (tokenWillExpireSoon()) {
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
  }, []);

  if (token) {
    return <AppConfig sdk={sdk} expireSoon={expireSoon} />;
  } else {
    return (
      <div>
        <div>
          <div className={styles.background('#262627')}>
            <div className={styles.body}>
              <div className={styles.authConfig}>
                <Typography>
                  <Heading>Connect to Typeform</Heading>
                  <Paragraph className={styles.aboutP}>
                    The{' '}
                    <TextLink
                      href="https://www.typeform.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Typeform
                    </TextLink>{' '}
                    app allows you to reference your forms from Typeform without leaving Contentful.
                  </Paragraph>
                </Typography>
                <TypeformOAuth
                  buttonType="primary"
                  sdk={sdk}
                  isFullWidth
                  expireSoon={expireSoon}
                  setToken={setToken}
                />
              </div>
            </div>
            <div className={styles.icon}>
              <img src={logo} alt="typeform logo" />
            </div>
          </div>
        </div>
      </div>
    );
  }
}
