import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    const openConfigPage = () => sdk.navigator.openAppConfig();
    const handleApiError = (e: ApiErrorType) => {
      switch (e.errorType) {
        case ERROR_TYPE_MAP.invalidProperty:
          setErrorDisplay(
            <HyperLink
              body={INVALID_ARGUMENT_MSG}
              substring="app configuration page."
              onClick={openConfigPage}
            />
          );
          break;
        case ERROR_TYPE_MAP.disabledDataApi:
          setErrorDisplay(PERMISSION_DENIED_MSG);
          break;
        default:
          setErrorDisplay(e.message);
      }
    };

    if (isApiErrorType(error)) handleApiError(error);
    else {
      setErrorDisplay(error.message || DEFAULT_ERR_MSG);
    }
  }, [error, sdk.navigator]);

  return <Note body={errorDisplay} variant="negative" />;
};

export default ErrorDisplay;
