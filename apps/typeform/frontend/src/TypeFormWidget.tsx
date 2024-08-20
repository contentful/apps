import React, { useEffect } from 'react';
import { DialogAppSDK } from '@contentful/app-sdk';
import { Hash } from './typings';
import { SDK_WINDOW_HEIGHT } from './constants';
import { Widget } from '@typeform/embed-react';

interface Props {
  sdk: DialogAppSDK;
}

export function TypeformPreviewWidget({ sdk }: Props) {
  const { value } = sdk.parameters.invocation as Hash;
  const formId = value.split('/').pop();
  console.log('formId', formId);
  useEffect(() => {
    sdk.window.updateHeight(SDK_WINDOW_HEIGHT);
  }, [sdk.window]);

  return (
    <Widget
      id={formId}
      style={{ width: '100%', height: SDK_WINDOW_HEIGHT }}
      opacity={0}
      hideFooter={true}
      hideHeaders={true}
    />
  );
}
