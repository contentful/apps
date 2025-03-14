import { useMemo } from 'react';
import { locations } from '@contentful/app-sdk';
import Field from './locations/Field';
import { useSDK } from '@contentful/react-apps-toolkit';
import Dialog from './locations/Dialog';

const ComponentLocationSettings = {
  [locations.LOCATION_ENTRY_FIELD]: Field,
  [locations.LOCATION_DIALOG]: Dialog,
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
