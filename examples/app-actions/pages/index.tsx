import React, { useMemo } from 'react';
import { locations } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import ConfigScreen from '@/components/locations/ConfigScreen';

const ComponentLocationSettings = {
  [locations.LOCATION_APP_CONFIG]: ConfigScreen,
};

const App = () => {
  const sdk = useSDK();

  const Component = useMemo(() => {
    return ComponentLocationSettings[sdk.location.current];
  }, [sdk.location]);

  return Component ? <Component /> : null;
};

export default App;
