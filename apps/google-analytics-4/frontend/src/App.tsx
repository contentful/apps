import * as Sentry from '@sentry/react';
import React, { useMemo } from 'react';
import { locations } from '@contentful/app-sdk';
import ConfigScreen from './locations/ConfigScreen';
import Field from './locations/Field';
import EntryEditor from './locations/EntryEditor';
import Dialog from './locations/Dialog';
import Sidebar from './locations/Sidebar';
import Page from './locations/Page';
import Home from './locations/Home';
import { useSDK } from '@contentful/react-apps-toolkit';

const ComponentLocationSettings = {
  [locations.LOCATION_APP_CONFIG]: ConfigScreen,
  [locations.LOCATION_ENTRY_FIELD]: Field,
  [locations.LOCATION_ENTRY_EDITOR]: EntryEditor,
  [locations.LOCATION_DIALOG]: Dialog,
  [locations.LOCATION_ENTRY_SIDEBAR]: Sidebar,
  [locations.LOCATION_PAGE]: Page,
  [locations.LOCATION_HOME]: Home,
};

const App = () => {
  const sdk = useSDK();

  const Component = useMemo(() => {
    for (const [location, component] of Object.entries(ComponentLocationSettings)) {
      if (sdk.location.is(location)) {
        // Set user information, as well as tags for contentful context
        Sentry.configureScope((scope) => {
          scope.clear();

          // user: "6iUaAfJg2ZoKe4oEYF7kxe"
          if (sdk.ids.user) scope.setUser({ id: sdk.ids.user });

          for (const [key, value] of Object.entries(sdk.ids)) {
            // app: "5eHTUt9pILTGjYk3VFE9ta"
            // contentType: "product"
            // entry: "4w6Hx5RgIO2uiNcgxpqj6l"
            // environment: "gary.hepting"
            // field: "sku"
            // organization: "6xdLsz6lCsk0yPOccSsDK7"
            // space: "30x8uoqewkkz"
            // user: "6iUaAfJg2ZoKe4oEYF7kxe"
            if (value) scope.setTag(`x-contentful-${key}`, value);
          }

          // location: "app-config"
          if (location) scope.setTag('x-contentful-location', location);
        });

        return component;
      }
    }
  }, [sdk.location, sdk.ids]);

  return Component ? <Component /> : null;
};

export default App;
