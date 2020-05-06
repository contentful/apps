import React, { useEffect } from 'react';
import { AppExtensionSDK } from 'contentful-ui-extensions-sdk';

// Use components from Contentful's design system, Forma 36: https://ctfl.io/f36
import { Paragraph } from '@contentful/forma-36-react-components';

export default function Config({ sdk }: { sdk: AppExtensionSDK }) {
  useEffect(() => {
    // Ready to display our app (end loading state).
    sdk.app.setReady();
  }, []);

  return <Paragraph>Hello World!</Paragraph>;
}
