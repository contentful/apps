import { useMemo } from 'react';
import { locations } from '@contentful/app-sdk';
import Page from './locations/Page/Page';
import { useSDK } from '@contentful/react-apps-toolkit';
import ConfigScreen from './locations/ConfigScreen/ConfigScreen';
import Sidebar from './locations/Sidebar/Sidebar';

const ComponentLocationSettings = {
  [locations.LOCATION_APP_CONFIG]: ConfigScreen,
  [locations.LOCATION_PAGE]: Page,
  [locations.LOCATION_ENTRY_SIDEBAR]: Sidebar,
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
