import * as React from 'react';
import { render } from 'react-dom';
import {
  init,
  AppExtensionSDK,
  locations,
  SidebarExtensionSDK,
} from 'contentful-ui-extensions-sdk';
import '@contentful/forma-36-react-components/dist/styles.css';
import '@contentful/forma-36-fcss/dist/styles.css';
import spaceTemplate from '../space-template.json';
import { NetlifyProvider } from './providers/netlify-provider';
import { SdkProvider } from './providers/sdk-provider';
import Config from './apps/config';
import Sidebar from './apps/sidebar';

init((sdk: AppExtensionSDK & SidebarExtensionSDK) => {
  const root = document.getElementById('root');

  if (sdk.location.is(locations.LOCATION_APP_CONFIG)) {
    render(
      <NetlifyProvider>
        <SdkProvider sdk={sdk}>
          <Config template={spaceTemplate} />
        </SdkProvider>
      </NetlifyProvider>,
      root
    );
  }

  if (sdk.location.is(locations.LOCATION_ENTRY_SIDEBAR)) {
    render(
      <NetlifyProvider>
        <SdkProvider sdk={sdk}>
          <Sidebar />
        </SdkProvider>
      </NetlifyProvider>,
      root
    );
  }
});
