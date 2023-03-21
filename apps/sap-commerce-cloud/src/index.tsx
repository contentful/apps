import React from 'react';
import { render } from 'react-dom';

import {
  AppExtensionSDK,
  FieldExtensionSDK,
  DialogExtensionSDK,
  init,
  locations,
} from '@contentful/app-sdk';
import '@contentful/forma-36-react-components/dist/styles.css';
import '@contentful/forma-36-fcss/dist/styles.css';
import '@contentful/forma-36-tokens/dist/css/index.css';
import './index.css';
import AppConfig from './AppConfig/AppConfig';

import Field from './components/Field';
import Dialog from './components/Dialog';

init((sdk) => {
  const root = document.getElementById('root');
  const ComponentLocationSettings = [
    {
      location: locations.LOCATION_APP_CONFIG,
      component: (
        <AppConfig
          sdk={sdk as AppExtensionSDK}
          name="SAP Commerce App"
          description={`
            The sap commerce app allows editors to select commerce objects (eg: products) from their
            commerce app and reference them inside of Contentful entries.`}
          logo="https://images.ctfassets.net/lpjm8d10rkpy/6pMn4nHfKoOZGwFFcqaqqe/70272257dc1d2d0bbcc3ebdde13a7358/1493030643828.svg"
          color="212F3F"
          parameterDefinitions={[
            {
              id: 'apiEndpoint',
              name: 'API Endpoint',
              description: 'The API URL',
              type: 'Symbol',
              required: true,
            },
            {
              id: 'accessTokenApiEndpoint',
              name: 'Access Token URL',
              description: 'The access token API URL',
              type: 'Symbol',
              required: true,
            },
            {
              id: 'client_id',
              name: 'Client ID',
              description: 'OAUTH Client ID',
              type: 'Symbol',
              required: true,
            },
            {
              id: 'client_secret',
              name: 'Client Secret',
              description: 'OAUTH Client Secret',
              type: 'Symbol',
              required: true,
            },
            {
              id: 'grant_type',
              name: 'Grant Type',
              description: 'OAUTH Grant type',
              type: 'Symbol',
              required: true,
              default: 'client_credentials',
            },
            {
              id: 'scope',
              name: 'Scope',
              description: 'OAUTH Scope',
              type: 'Symbol',
              required: true,
              default: 'extended',
            },
            {
              id: 'baseSites',
              name: 'Base Sites',
              description: 'Allowed Base Sites',
              type: 'Symbol',
              required: true,
              default: '',
            },
          ]}
          validateParameters={() => null}
        />
      ),
    },
    {
      location: locations.LOCATION_ENTRY_FIELD,
      component: <Field sdk={sdk as FieldExtensionSDK} />,
    },
    {
      location: locations.LOCATION_DIALOG,
      component: <Dialog sdk={sdk as DialogExtensionSDK} />,
    },
  ];

  // Select a component depending on a location in which the app is rendered.
  ComponentLocationSettings.forEach((componentLocationSetting) => {
    if (sdk.location.is(componentLocationSetting.location)) {
      render(componentLocationSetting.component, root);
    }
  });
});
