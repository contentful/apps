import React, { useEffect, useState } from 'react';
import { FieldExtensionSDK } from '@contentful/app-sdk';
import { /* useCMA, */ useCMA, useSDK } from '@contentful/react-apps-toolkit';
import FieldClass from '../components/FieldClass';
interface AWSFunctionURLResponse {
  status: number;
  sapApplicationId: string;
}

const Field = () => {
  const [applicationInterfaceKey, setApplicationInterfaceKey] = useState<string>('');

  const sdk = useSDK<FieldExtensionSDK>();
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

  /*
     To use the cma, inject it as follows.
     If it is not needed, you can remove the next line.
  */
  // const cma = useCMA();
  // If you only want to extend Contentful's default editing experience
  // reuse Contentful's editor components
  // -> https://www.contentful.com/developers/docs/extensibility/field-editors/
  return (
    <FieldClass sdk={sdk} cma={cma as any} applicationInterfaceKey={applicationInterfaceKey} />
  );
};

export default Field;
