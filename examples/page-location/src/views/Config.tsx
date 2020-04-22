import React, { useEffect } from 'react';

import { AppExtensionSDK } from 'contentful-ui-extensions-sdk';
import { Note } from '@contentful/forma-36-react-components';

interface ConfigProps {
  sdk: AppExtensionSDK;
}

export default function Config({ sdk }: ConfigProps) {
  useEffect(() => {
    sdk.app.setReady();
  }, []);

  return (
    <div>
      <Note className="f36-margin-top--xl">
        This is an example app, it has no configuration. Hit 'install' in the top right corner to
        continue.
      </Note>
    </div>
  );
}
