import React from 'react';
import { AppExtensionSDK } from '@contentful/app-sdk';
import Config from './Config';
import JiraSoftware from '../JiraSoftware';
import Auth from '../Auth';

interface Props {
  sdk: AppExtensionSDK;
}

/** The Jira App location component */
const App = ({ sdk }: Props) => (
  <div className="app">
    <div className="background" />
    <div className="body">
      <div className="config">
        <Auth notifyError={sdk.notifier.error} mode="config" setReady={sdk.app.setReady}>
          {(token: string, client, reset) => <Config token={token} sdk={sdk} reauth={reset} />}
        </Auth>
      </div>
    </div>
    <div className="logo">
      <JiraSoftware />
    </div>
  </div>
);

export default App;
