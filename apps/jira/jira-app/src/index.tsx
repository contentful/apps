import React from 'react';
import { render } from 'react-dom';
import { init, locations, AppExtensionSDK, SidebarExtensionSDK } from '@contentful/app-sdk';
import standalone from './standalone';
import App from './components/App';
import Jira from './components/Jira';
import Auth from './components/Auth';
import './index.scss';
import JiraClient from './jiraClient';
import { InstallationParameters } from './interfaces';
import { SDKProvider } from '@contentful/react-apps-toolkit';

function renderAtRoot(component: JSX.Element) {
  render(component, document.getElementById('root'));
}

/*
  If we are running this code in standalone mode, it just means JIRA has redirected
  back to us with a code we can exchange for an access token
*/
if (window.location.search.includes('token')) {
  standalone(window);
} else {
  init((sdk) => {
    if (sdk.location.is(locations.LOCATION_APP_CONFIG)) {
      renderAtRoot(
        <SDKProvider>
          <App sdk={sdk as AppExtensionSDK} />
        </SDKProvider>
      );
    }

    if (sdk.location.is(locations.LOCATION_ENTRY_SIDEBAR)) {
      (sdk as SidebarExtensionSDK).window.startAutoResizer();
      renderAtRoot(
        <SDKProvider>
          <Auth
            notifyError={sdk.notifier.error}
            parameters={sdk.parameters.installation as InstallationParameters}>
            {(token, client: JiraClient, resetClient) => (
              <Jira client={client} sdk={sdk as SidebarExtensionSDK} signOut={resetClient} />
            )}
          </Auth>
        </SDKProvider>
      );
    }
  });
}
