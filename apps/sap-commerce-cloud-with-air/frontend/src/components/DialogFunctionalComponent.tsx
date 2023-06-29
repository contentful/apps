import { useCMA, useSDK } from '@contentful/react-apps-toolkit';
import React, { useEffect } from 'react';
import Dialog from './Dialog';
import { DialogExtensionSDK, CMAClient, DialogAppSDK, FieldAppSDK } from '@contentful/app-sdk';

interface DialogProps {
  applicationInterfaceKey: string;
}

export default function DialogFunctionalComponent(props: DialogProps) {
  const { applicationInterfaceKey } = props;
  const cma = useCMA();
  const sdk = useSDK<any>();

  useEffect(() => {
    console.log(sdk);
  }, []);

  return (
    <div>
      <Dialog cma={cma} sdk={sdk} applicationInterfaceKey={`${applicationInterfaceKey}`} />
    </div>
  );
}
