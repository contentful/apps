import React, { useEffect, useRef } from 'react';
import * as typeformEmbed from '@typeform/embed';
import { DialogExtensionSDK } from '@contentful/app-sdk';
import { Hash } from './typings';
import { SDK_WINDOW_HEIGHT } from './constants';

interface Props {
  sdk: DialogExtensionSDK;
}

export function TypeformPreviewWidget({ sdk }: Props) {
  const el = useRef(null);
  const { value } = sdk.parameters.invocation as Hash;
  useEffect(() => {
    let element = el.current;
    typeformEmbed.makeWidget(element, value, {
      hideFooter: true,
      hideHeaders: true,
      opacity: 0
    });
    sdk.window.updateHeight(SDK_WINDOW_HEIGHT);
  }, [value]);

  return (
    <div
      ref={el}
      style={{
        width: '100%',
        height: SDK_WINDOW_HEIGHT
      }}
    />
  );
}
