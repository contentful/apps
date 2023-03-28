import React, { useState, useEffect } from 'react';
import Note from 'components/common/Note/Note';
import { ApiErrorType, ERROR_TYPE_MAP, isApiErrorType } from 'apis/apiTypes';
import {
  INVALID_ARGUMENT_MSG,
  PERMISSION_DENIED_MSG,
} from 'components/main-app/constants/noteMessages';
import { AppConfigPageHyperLink, SupportHyperLink } from './CommonErrorDisplays';

interface Props {
  error: Error;
}

type HyperLinkErrorDisplays = 'supportHyperLink' | 'appConfigPageHyperLink';

const ErrorDisplay = (props: Props) => {
  const { error } = props;
  const [errorBody, setErrorBody] = useState<HyperLinkErrorDisplays | string>('');

  const hyperLinkErrorDisplays = {
    supportHyperLink: <SupportHyperLink />,
    appConfigPageHyperLink: <AppConfigPageHyperLink bodyMsg={INVALID_ARGUMENT_MSG} />,
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
