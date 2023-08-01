import React from 'react';
import { locations } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useMemo } from 'react';
import { Config } from './locations/ConfigScreen';
import { PageRouter } from './locations/Page';

const ComponentLocationSettings = {
  [locations.LOCATION_APP_CONFIG]: Config,
  [locations.LOCATION_PAGE]: PageRouter,
};

const App = () => {
  const sdk = useSDK();

  const Component = useMemo(() => {
    return ComponentLocationSettings[sdk.location.current];
  }, [sdk.location]);

  return Component ? <Component /> : null;
};

export default App;
