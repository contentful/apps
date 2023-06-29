import React, { useEffect, useState } from 'react';
import { Paragraph } from '@contentful/f36-components';
import { DialogExtensionSDK } from '@contentful/app-sdk';
import { useCMA, useSDK } from '@contentful/react-apps-toolkit';
import DialogClass from '../DialogClass';
import { PlainClientAPI } from 'contentful-management/dist/typings/plain/common-types';

interface AWSFunctionURLResponse {
  status: number;
  sapApplicationId: string;
}

const Dialog = () => {
  const [applicationInterfaceKey, setApplicationInterfaceKey] = useState<string>('');

  const sdk = useSDK();
  const cma = useCMA();

  const getApplicationInterfaceKey = async (): Promise<string> => {
    const url = 'https://dpqac5rkzhh4cahlgb7jby4qk40qsetg.lambda-url.us-west-2.on.aws/';
    try {
      const response = await fetch(url);
      if (response.ok) {
        const responseJson: AWSFunctionURLResponse = await response.json();
        return responseJson.sapApplicationId;
      } else {
        throw response;
      }
    } catch (error) {
      console.error(error);
      return 'Nothing Found';
    }
  };

  useEffect(() => {
    const getKey = async () => {
      const key = await getApplicationInterfaceKey();
      setApplicationInterfaceKey(key);
    };

    getKey();
  }, []);

  return (
    <DialogClass
      cma={cma as any}
      sdk={sdk}
      applicationInterfaceKey={`${applicationInterfaceKey}`}
    />
  );
};

export default Dialog;
