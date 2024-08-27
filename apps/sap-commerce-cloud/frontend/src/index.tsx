import { createRoot } from 'react-dom/client';

import AppConfig from '@components/AppConfig/AppConfig';
import { init, locations } from '@contentful/app-sdk';
import './index.css';

import Dialog from '@components/Dialog/Dialog';
import Field from '@components/Field/Field';
import { SDKProvider } from '@contentful/react-apps-toolkit';

init(async (sdk) => {
  const rootEl = document.getElementById('root');
  if (!rootEl) {
    throw new Error('Root element not found');
  }
  const root = createRoot(rootEl);

  const ComponentLocationSettings = [
    {
      location: locations.LOCATION_APP_CONFIG,
      component: (
        <SDKProvider>
          <AppConfig
            name="SAP Commerce Cloud App"
            description={`
          The SAP Commerce Cloud app allows content creators to select products from their
          SAP Commerce Cloud instance and reference them inside of Contentful entries.`}
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
                id: 'baseSites',
                name: 'Base Sites',
                description:
                  'Include all base sites that you want to have available in the app. Separate each base site with a comma.',
                type: 'Symbol',
                required: true,
                default: '',
              },
            ]}
            validateParameters={() => null}
          />
        </SDKProvider>
      ),
    },
    {
      location: locations.LOCATION_ENTRY_FIELD,
      component: (
        <SDKProvider>
          <Field />
        </SDKProvider>
      ),
    },
    {
      location: locations.LOCATION_DIALOG,
      component: (
        <SDKProvider>
          <Dialog />
        </SDKProvider>
      ),
    },
  ];

  // Select a component depending on a location in which the app is rendered.
  ComponentLocationSettings.forEach((componentLocationSetting) => {
    if (sdk.location.is(componentLocationSetting.location)) {
      root.render(componentLocationSetting.component);
    }
  });
});
