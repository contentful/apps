import React, { useEffect, useRef } from 'react';
import * as typeformEmbed from '@typeform/embed';
import { DialogExtensionSDK } from 'contentful-ui-extensions-sdk';

interface Props {
  sdk: DialogExtensionSDK;
}

export function TypeformPreviewWidget({ sdk }: Props) {
  const el = useRef(null);
  const { value } = sdk.parameters.invocation;
  useEffect(() => {
    let element = el.current;
    typeformEmbed.makeWidget(element, value, {
      hideFooter: true,
      hideHeaders: true,
      opacity: 0
    });
    sdk.window.updateHeight(450);
  }, [value]);

  return (
    <div
      ref={el}
      style={{
        width: '100%',
        height: 450
      }}
    />
  );
}
