import { useMemo } from 'react';
import { locations } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import Field from './locations/Field';
import Dialog from './locations/Dialog';

const ComponentLocationSettings = {
  [locations.LOCATION_ENTRY_FIELD]: Field,
  [locations.LOCATION_DIALOG]: Dialog,
};

function App() {
  const sdk = useSDK();

  const Component = useMemo(() => {
    for (const [location, component] of Object.entries(ComponentLocationSettings)) {
      if (sdk.location.is(location)) {
        return component;
      }
    }
    return null;
  }, [sdk.location]);

  return Component ? <Component /> : null;
}

export default App;
