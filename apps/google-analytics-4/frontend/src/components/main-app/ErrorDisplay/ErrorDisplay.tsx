import React, { useState, useEffect, useMemo } from 'react';
import { useSDK } from '@contentful/react-apps-toolkit';
import { SidebarExtensionSDK } from '@contentful/app-sdk';
import Note from 'components/common/Note/Note';
import { ApiErrorType, ERROR_TYPE_MAP, isApiErrorType } from 'apis/apiTypes';
import {
  DEFAULT_ERR_MSG,
  INVALID_ARGUMENT_MSG,
  PERMISSION_DENIED_MSG,
} from '../constants/noteMessages';
import HyperLink from 'components/common/HyperLink/HyperLink';

interface Props {
  error: Error;
}

const ErrorDisplay = (props: Props) => {
  const { error } = props;
  const [errorDisplay, setErrorDisplay] = useState<string | JSX.Element>('');

  const sdk = useSDK<SidebarExtensionSDK>();
  const appConfigPageHyperLink = useMemo(() => {
    const openConfigPage = () => sdk.navigator.openAppConfig();
    return (
      <HyperLink
        body={INVALID_ARGUMENT_MSG}
        substring="app configuration page."
        onClick={openConfigPage}
      />
    );
  }, [sdk.navigator]);

  const supportHyperLink = useMemo(
    () => (
      <HyperLink
        body={DEFAULT_ERR_MSG}
        substring="contact support."
        hyperLinkHref="https://www.contentful.com/support/?utm_source=webapp&utm_medium=help-menu&utm_campaign=in-app-help"
      />
    ),
    []
  );

  useEffect(() => {
    const handleApiError = (e: ApiErrorType) => {
      switch (e.errorType) {
        case ERROR_TYPE_MAP.invalidProperty:
          setErrorDisplay(appConfigPageHyperLink);
          break;
        case ERROR_TYPE_MAP.disabledDataApi:
          setErrorDisplay(PERMISSION_DENIED_MSG);
          break;
        default:
          setErrorDisplay(e.message || supportHyperLink);
      }
    };

    if (isApiErrorType(error)) handleApiError(error);
    else {
      setErrorDisplay(error.message || supportHyperLink);
    }
  }, [error, sdk.navigator, supportHyperLink, appConfigPageHyperLink]);

  return <Note body={errorDisplay} variant="negative" />;
};

export default ErrorDisplay;
