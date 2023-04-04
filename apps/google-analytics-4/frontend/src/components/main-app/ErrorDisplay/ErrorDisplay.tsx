import React, { useState, useEffect } from 'react';
import Note from 'components/common/Note/Note';
import { ApiErrorType, ERROR_TYPE_MAP, isApiErrorType } from 'apis/apiTypes';
import {
  INVALID_ARGUMENT_MSG,
  PERMISSION_DENIED_MSG,
  INVALID_SERVICE_ACCOUNT,
} from 'components/main-app/constants/noteMessages';
import { AppConfigPageHyperLink, SupportHyperLink } from './CommonErrorDisplays';

interface Props {
  error: Error;
}

type HyperLinkErrorDisplays =
  | 'supportHyperLink'
  | 'appConfigPageHyperLink'
  | 'invalidServiceAccount';

const ErrorDisplay = (props: Props) => {
  const { error } = props;
  const [errorBody, setErrorBody] = useState<HyperLinkErrorDisplays | string>('');

  const hyperLinkErrorDisplays = {
    supportHyperLink: <SupportHyperLink />,
    appConfigPageHyperLink: <AppConfigPageHyperLink bodyMsg={INVALID_ARGUMENT_MSG} />,
    invalidServiceAccount: <AppConfigPageHyperLink bodyMsg={INVALID_SERVICE_ACCOUNT} />,
  };

  useEffect(() => {
    const handleApiError = (e: ApiErrorType) => {
      switch (e.errorType) {
        case ERROR_TYPE_MAP.invalidProperty:
          setErrorBody('appConfigPageHyperLink');
          break;
        case ERROR_TYPE_MAP.disabledDataApi:
          setErrorBody(PERMISSION_DENIED_MSG);
          break;
        case ERROR_TYPE_MAP.failedFetch:
          setErrorBody('supportHyperLink');
          break;
        case ERROR_TYPE_MAP.invalidServiceAccount:
        case ERROR_TYPE_MAP.invalidServiceAccountKey:
          setErrorBody('invalidServiceAccount');
          break;
        default:
          setErrorBody(e.message || 'supportHyperLink');
      }
    };
    if (isApiErrorType(error)) handleApiError(error);
    else {
      setErrorBody(error.message || 'supportHyperLink');
    }
  }, [error]);

  return (
    <Note
      body={hyperLinkErrorDisplays[errorBody as HyperLinkErrorDisplays] ?? errorBody}
      variant="negative"
    />
  );
};

export default ErrorDisplay;
