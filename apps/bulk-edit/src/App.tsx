import { useMemo } from 'react';
import { locations, AppExtensionSDK } from '@contentful/app-sdk';
import Page from './locations/Page';
import { useSDK } from '@contentful/react-apps-toolkit';

const ComponentLocationSettings = {
  [locations.LOCATION_PAGE]: Page,
};

const App = () => {
  const sdk = useSDK<AppExtensionSDK>();

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
