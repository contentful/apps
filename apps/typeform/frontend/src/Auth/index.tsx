/* eslint-disable @typescript-eslint/no-non-null-assertion */
import React, { useState, useEffect } from 'react';
import { TypeformOAuth } from './TypeformOAuth';
import { AppExtensionSDK } from 'contentful-ui-extensions-sdk';
import { AppConfig } from '../AppConfig';
import { styles } from '../AppConfig/styles';
// @ts-ignore 2307
import logo from '../AppConfig/config-screen-logo.svg';
import { Typography, Paragraph, Heading, TextLink } from '@contentful/forma-36-react-components';

/** Gets the expireTime from local storage to determine if the token is expired */
function tokenIsExpired() {
  const token = window.localStorage.getItem('token') || '';
  const expires = window.localStorage.getItem('expireTime') || '0';

  return !token || !expires || Date.now() > parseInt(expires, 10);
}

function tokenWillExpireSoon() {
  const expires = window.localStorage.getItem('expireTime') || '0';
  const _10Minutes = 600000;

  return !expires || parseInt(expires, 10) - Date.now() <= _10Minutes;
}

function resetLocalStorage() {
  window.localStorage.removeItem('token');
  window.localStorage.removeItem('expireTime');
}

function geToken() {
  return window.localStorage.getItem('token') || '';
}

interface Props {
  sdk: AppExtensionSDK;
}

export default function AuthWrapper({ sdk }: Props) {
  let expirationWatchInterval: NodeJS.Timeout | undefined;
  const [token, setToken] = useState(geToken());
  const [expireSoon, setExpireSoon] = useState(false);

  useEffect(() => {
    watchForExpiration();
    refreshToken();
    return () => clearExpirationInterval();
  }, []);

  const refreshToken = () => {
    if (tokenIsExpired()) {
      resetLocalStorage();
    } else if (tokenWillExpireSoon()) {
      setExpireSoon(true);
    }
  };

  const clearExpirationInterval = () => {
    if (expirationWatchInterval) {
      clearInterval(expirationWatchInterval);
    }
  };

  const watchForExpiration = () => {
    clearExpirationInterval();
    expirationWatchInterval = setInterval(refreshToken, 5000);
  };

  if (token) {
    return <AppConfig sdk={sdk} />;
  } else {
    return (
      <div>
        <div>
          <div className={styles.background('#262627')}>
            <div className={styles.body}>
              <Typography>
                <Heading>About Typeform</Heading>
                <Paragraph className={styles.aboutP}>
                  The{' '}
                  <TextLink
                    href="https://www.typeform.com/"
                    target="_blank"
                    rel="noopener noreferrer">
                    Typeform
                  </TextLink>{' '}
                  app allows you to reference your forms from Typeform without leaving Contentful.
                </Paragraph>
              </Typography>
              <TypeformOAuth sdk={sdk} expireSoon={expireSoon} setToken={setToken} />
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
