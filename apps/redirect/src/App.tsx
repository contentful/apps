import { locations } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useMemo } from 'react';
import ConfigScreen from './locations/ConfigScreen';
import Page from './locations/Page';
import Sidebar from './locations/Sidebar';
import { QueryProvider } from './providers/QueryProvider';

const ComponentLocationSettings = {
  [locations.LOCATION_APP_CONFIG]: ConfigScreen,
  [locations.LOCATION_ENTRY_SIDEBAR]: Sidebar,
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

  return <QueryProvider>{Component ? <Component /> : null}</QueryProvider>;
};

export default App;
