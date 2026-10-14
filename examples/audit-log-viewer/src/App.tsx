import { useMemo } from 'react';
import { locations } from '@contentful/app-sdk';
import ConfigScreen from './locations/ConfigScreen';
import Dialog from './locations/Dialog';
import Page from './locations/Page';
import { useSDK } from '@contentful/react-apps-toolkit';

const ComponentLocationSettings = {
  [locations.LOCATION_APP_CONFIG]: ConfigScreen,
  [locations.LOCATION_DIALOG]: Dialog,
  [locations.LOCATION_PAGE]: Page,
};

const App = () => {
  const sdk = useSDK();

  const Component = useMemo(() => {
    for (const [location, component] of Object.entries(ComponentLocationSettings)) {
      if (sdk.location.is(location)) {
        return component;
      }
    }
  }, [sdk.location]);

  return Component ? <Component /> : null;
};

export default App;
