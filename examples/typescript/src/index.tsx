import React from 'react';
import { render } from 'react-dom';
import { createClient } from 'contentful-management';

import {
  init,
  locations,
} from '@contentful/app-sdk';
import type { KnownSDK } from '@contentful/app-sdk';
import { GlobalStyles } from '@contentful/f36-components';
import { SDKProvider } from '@contentful/react-apps-toolkit'

import ConfigScreen from './locations/ConfigScreen';
import EntryEditor from './locations/EntryEditor';
import Page from './locations/Page';
import Sidebar from './locations/Sidebar';
import Field from './locations/Field';
import Dialog from './locations/Dialog';
import LocalhostWarning from './components/LocalhostWarning';

if (process.env.NODE_ENV === 'development' && window.self === window.top) {
  // You can remove this if block before deploying your app
  const root = document.getElementById('root');

  render(<LocalhostWarning />, root);
} else {
  init((sdk: KnownSDK) => {
    const root = document.getElementById('root');

    // Creating a CMA client allows you to use the contentful-management library
    // within your app. See the contentful-management documentation at https://contentful.github.io/contentful-management.js/contentful-management/latest/
    // to learn what is possible.
    const cma = createClient(
      { apiAdapter: sdk.cmaAdapter },
      {
        type: 'plain',
        defaults: {
          environmentId: sdk.ids.environment,
          spaceId: sdk.ids.space,
        },
      }
    );

    // All possible locations for your app
    // Feel free to remove unused locations
    // Dont forget to delete the file too :)
    const ComponentLocationSettings = [
      {
        location: locations.LOCATION_APP_CONFIG,
        component: <ConfigScreen cma={cma} />,
      },
      {
        location: locations.LOCATION_ENTRY_FIELD,
        component: <Field cma={cma} />,
      },
      {
        location: locations.LOCATION_ENTRY_EDITOR,
        component: <EntryEditor cma={cma} />,
      },
      {
        location: locations.LOCATION_DIALOG,
        component: <Dialog cma={cma} />,
      },
      {
        location: locations.LOCATION_ENTRY_SIDEBAR,
        component: <Sidebar cma={cma} />,
      },
      {
        location: locations.LOCATION_PAGE,
        component: <Page cma={cma} />,
      },
    ];

    // Select a component depending on a location in which the app is rendered.
    ComponentLocationSettings.forEach((componentLocationSetting) => {
      if (sdk.location.is(componentLocationSetting.location)) {
        render(
          <SDKProvider>
            <GlobalStyles />
            {componentLocationSetting.component}
          </SDKProvider>,
          root
        );
      }
    });
  });
}
